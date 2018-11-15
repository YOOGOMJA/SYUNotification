// 로드 
// 1. interval 로드
// 2. 직접 로드

// 옵션 페이지 필요 
let _bg = {
    IDENTIFIERS : {
        MESG : {
            GET_BOARD_ITEM : 'GET_BOARD_ITEM',
            GET_LAST_UPDATED : 'GET_LAST_UPDATED',
            SET_HISTORY_ITEM : 'SET_HISTORY_ITEM',
            GET_HISTORY_ITEM : 'GET_HISTORY_ITEM',
            SET_FAVORITE_ITEM : 'SET_FAVORITE_ITEM',
            GET_FAVORITE_ITEM : 'GET_FAVORITE_ITEM',
            DEL_HISTORY_ITEM : 'DEL_HISTORY_ITEM',
            DEL_FAVORITE_ITEM : 'DEL_FAVORITE_ITEM',
            GET_CONFIG_DATA : 'GET_CONFIG_DATA',
            SET_CONFIG_DATA : 'SET_CONFIG_DATA',
            GET_META_DATA : 'GET_META_DATA',
            GET_KEYWORDS : 'GET_KEYWORDS',
            GET_KEYWORD_ITEM : 'GET_KEYWORD_ITEM'
        },
        sync : {
            LAST_UPDATED : 'LAST_UPDATED',
            FAVORITE_ITEMS : 'FAVORITE_ITEMS',
            HISTORY_ITEMS : 'HISTORY_ITEMS',
            INTERVAL : 'INTERVAL',
            KEYWORDS : 'KEYWORDS',
            CRAWLER_STATE : 'CRAWLER_STATE',
            CRAWLER_PERIOD : 'CRAWLER_PERIOD',
        },
        states : {
            REQUESTING : 'REQUESTING',
            IDLE : 'IDLE'
        }
    },
    data : {
        last_updated : '',
        items : [],
        paging : [],
        favorites : [],
        histories : [],
        stored : {
            items : {},
            paging : {},
        },
        states : '',
    },
    // notification 관련
    noti : {
        old : [],
        new : [],
        fn : {
            init : function(){

            },
            makeNotification : function(){        
                let ct = '';
                let msg = '';
                
                if(_bg.noti.new.length > 1){
                    msg += _bg.noti.new[0].title.slice(0,20);
                    msg += '.. 외 ' + (_bg.noti.new.length - 1) + '건';
                    ct = '학사공지에 새로운 글이 올라왔습니다!';
                }
                else{
                    msg += _bg.noti.new[0].title;
                    ct = '학사공지에 새로운 글이 올라왔습니다!';
                }
                
                chrome.notifications.create({
                    type : 'basic',
                    iconUrl : '../assets/logo@128.png',
                    // title : 'SYU Notification',
                    title : ct,
                    message : msg
                });
            },
            mw : function(data, paging){
                let deferred = jQuery.Deferred();

                _bg.noti.old = _bg.noti.new.slice(0,_bg.noti.new.length);
                _bg.noti.new = [];
                for(let idx in data){
                    if(data[idx].isNew && _bg.noti.old.indexOf(data[idx].contentId) < 0){
                        // 새로운 아이템이고 이전에 저장된 적이 없을 경우
                        _bg.noti.new.push(data[idx].contentId);
                    }
                }
                if(_bg.noti.new.length > 0){
                    _bg.noti.fn.makeNotification(hasNewItems);
                }

                deferred.resolve(data , paging);
                return deferred.promise();
            }
        }
    },
    // 키워드 기능 관련
    filter : {
        keywords : [],
        items : {},
        fn : {
            mw : function(data , paging){
                let deferred = jQuery.Deferred();

                if(_bg.filter.keywords.length <= 0){ 
                    deferred.resolve(data , paging);
                    return deferred.promise(); 
                }
                for(key in _bg.filter.items){
                    if(_bg.filter.keywords.indexOf(key) < 0){
                        delete _bg.filter.items[key];
                    }
                }
                
                for(idx in _bg.filter.keywords){
                    let keyword = _bg.filter.keywords[idx];
                    if(!_bg.filter.items.hasOwnProperty(keyword) || !_bg.filter.items[keyword].length ){
                        _bg.filter.items[keyword] = [];
                    }
                    for(i in data){
                        if(data[i].title.indexOf(keyword) >= 0){
                            _bg.filter.items[keyword].push(data[i]);   
                        }
                    }
                }                
                deferred.resolve(data, paging);
                return deferred.promise();
            }
        }
    },
    crawler : {
        mod : {
            state : true,
            period : 30,
            min : 1000 * 60,
            hour : 1000 * 60 * 60,
            day : 1000 * 60 * 60 * 24,
        },
        fn : {
            init : function(){
                chrome.storage.sync.get([
                    _bg.IDENTIFIERS.sync.KEYWORDS,
                    _bg.IDENTIFIERS.sync.CRAWLER_STATE,
                    _bg.IDENTIFIERS.sync.CRAWLER_PERIOD
                ] , function(data){
                    let setting_first = false;
                    let setting_data = {};
                    if(!data.hasOwnProperty(_bg.IDENTIFIERS.sync.KEYWORDS)){
                        _bg.filter.keywords = [];
                        setting_first = true;
                        setting_data[_bg.IDENTIFIERS.sync.KEYWORDS] = _bg.filter.keywords;
                    }
                    else{
                        _bg.filter.keywords = data[_bg.IDENTIFIERS.sync.KEYWORDS];
                    }
                    if(!data.hasOwnProperty(_bg.IDENTIFIERS.sync.CRAWLER_STATE)){
                        _bg.crawler.mod.period = 30;
                        _bg.crawler.mod.state = true;    
                        setting_first = true;
                        setting_data[_bg.IDENTIFIERS.sync.CRAWLER_STATE] = true;
                        setting_data[_bg.IDENTIFIERS.sync.CRAWLER_PERIOD] = 30;
                    }
                    else{
                        _bg.crawler.mod.state = data[_bg.IDENTIFIERS.sync.CRAWLER_STATE];
                        _bg.crawler.mod.period = data[_bg.IDENTIFIERS.sync.CRAWLER_PERIOD];
                    }

                    if(setting_first){
                        chrome.storage.sync.set(setting_data, function(){
                            window.clearInterval(_bg.crawler.timer);
                            _bg.crawler.timer = window.setInterval(_bg.crawler.fn.tick , _bg.crawler.mod.min * _bg.crawler.mod.period);
                        });
                    }
                    else{
                        window.clearInterval(_bg.crawler.timer);
                        _bg.crawler.timer = window.setInterval(_bg.crawler.fn.tick , _bg.crawler.mod.min * _bg.crawler.mod.period);
                    }
                });

            },
            tick : function(){
                if(_bg.crawler.mod.state && _bg.data.states !== _bg.IDENTIFIERS.states.REQUESTING){
                    _Crawler.load(1, '', '', '')
                    .then(_bg.filter.fn.mw)
                    .then(_bg.noti.fn.mw)
                    .then(function(data, paging){
                        // tick이 끝나고나면 
                        for(key in _bg.data.stored.items){
                            delete _bg.data.stored.items[key];
                        }
                        for(key in _bg.data.stored.paging){
                            delete _bg.data.stored.paging[key];
                        }
                        _bg.data.stored.items['page1'] = data;
                        _bg.data.stored.paging['page1'] = paging;
                        
                        _bg.data.last_updated = (new Date()).getTime();
                    });
                }
            },
            clear : function(){
                clearInterval(_bg.crawler.timer);
            }
        },
        timer : {},
        // m sec
    },
};


// INSTALLED
chrome.runtime.onInstalled.addListener(function() {
    _bg.data.states = _bg.IDENTIFIERS.states.IDLE;    
    
});

jQuery(function(){
    _bg.crawler.fn.init();
});

chrome.runtime.onMessage.addListener(function(mesg, sender , sendResponse){
    if(mesg.title === _bg.IDENTIFIERS.MESG.GET_META_DATA){
        chrome.runtime.sendMessage({
            title : _bg.IDENTIFIERS.MESG.GET_META_DATA,
            data : {
                categories : _Crawler.opts.cate(),
                types : _Crawler.opts.type()
            }
        });
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_CONFIG_DATA)
    {
        // 키워드 관련 추가할 것 
        chrome.storage.sync.get([
            _bg.IDENTIFIERS.sync.KEYWORDS,
            _bg.IDENTIFIERS.sync.CRAWLER_STATE,
            _bg.IDENTIFIERS.sync.CRAWLER_PERIOD
        ] , function(data){
            let setting_first = false;
            let setting_data = {};
            if(!data.hasOwnProperty(_bg.IDENTIFIERS.sync.KEYWORDS)){
                _bg.filter.keywords = [];
                setting_first = true;
                setting_data[_bg.IDENTIFIERS.sync.KEYWORDS] = _bg.filter.keywords;
            }
            if(!data.hasOwnProperty(_bg.IDENTIFIERS.sync.CRAWLER_STATE)){
                _bg.crawler.mod.period = 30;
                _bg.crawler.mod.state = true;    
                setting_first = true;
                setting_data[_bg.IDENTIFIERS.sync.CRAWLER_STATE] = true;
                setting_data[_bg.IDENTIFIERS.sync.CRAWLER_PERIOD] = 30;
            }
            
            if(setting_first){
                chrome.storage.sync.set(setting_data, function(data){
                    chrome.runtime.sendMessage({
                        title : _bg.IDENTIFIERS.MESG.GET_CONFIG_DATA,
                        data : data
                    });
                });
            }
            else{
                chrome.runtime.sendMessage({
                    title : _bg.IDENTIFIERS.MESG.GET_CONFIG_DATA,
                    data : data
                });
            }
        });
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.SET_CONFIG_DATA){
        let setting_data = {};

        _bg.filter.keywords = mesg.data.keywords;
        _bg.crawler.mod.state = mesg.data.crawler_state;
        _bg.crawler.mod.period = mesg.data.crawler_period;

        setting_data[_bg.IDENTIFIERS.sync.KEYWORDS] = _bg.filter.keywords;
        setting_data[_bg.IDENTIFIERS.sync.CRAWLER_STATE] = _bg.crawler.mod.state;
        setting_data[_bg.IDENTIFIERS.sync.CRAWLER_PERIOD] = _bg.crawler.mod.period;

        chrome.storage.sync.set(setting_data , function(){
            _bg.data.stored.items = {};
            _bg.data.stored.paging = {};
            chrome.runtime.sendMessage({
                title : mesg.title
            });
            
            window.clearInterval(_bg.crawler.timer);
            _bg.crawler.timer = window.setInterval(_bg.crawler.fn.tick , _bg.crawler.mod.min * _bg.crawler.mod.period);
        });
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_BOARD_ITEM){
        if(mesg.cate !== '' || mesg.type !== '' || mesg.keyword !== ''){   
            // 1.1. 검색인 경우
            _bg.data.states = _bg.IDENTIFIERS.states.REQUESTING;
            _Crawler.load(mesg)
            .then(function(data, paging){
                chrome.runtime.sendMessage({
                    title : _bg.IDENTIFIERS.MESG.GET_BOARD_ITEM,
                    data : {
                        items : data,
                        paging : paging,
                        last_updated : _bg.data.last_updated
                    }
                }, ()=>{ 
                    _bg.data.states = _bg.IDENTIFIERS.states.IDLE;
                });
            });
        }
        else{   
            // 1.2. 검색이 아닌 경우
            if(mesg.forced || !_bg.data.stored.items.hasOwnProperty('page' + mesg.page)){   
                // 1.2.1. forced load 혹은 페이지에 해당하는 데이터가 없는 경우 
                _bg.data.states = _bg.IDENTIFIERS.states.REQUESTING;
                _Crawler.load(mesg)
                .then(_bg.filter.fn.mw)
                .then(function(data , paging){
                    if(mesg.forced){
                        for(var key in _bg.data.stored.items){
                            delete _bg.data.stored.items[key];
                        }
                        for(var key in _bg.data.stored.paging){
                            delete _bg.data.stored.paging[key];
                        }
                    }
                    _bg.data.stored.items['page' + mesg.page] = data;
                    _bg.data.stored.paging['page' + mesg.page] = paging;
                    _bg.data.last_updated = (new Date()).getTime();

                    let sync_item = {};
                    sync_item[_bg.IDENTIFIERS.sync.LAST_UPDATED] = _bg.data.last_updated;
                    chrome.storage.sync.set(sync_item);
                    chrome.runtime.sendMessage({
                        title : _bg.IDENTIFIERS.MESG.GET_BOARD_ITEM,
                        data : {
                            items : data,
                            paging : paging,
                            last_updated : _bg.data.last_updated
                        }
                    }, ()=>{ 
                        _bg.data.states = _bg.IDENTIFIERS.states.IDLE;
                    });
                });
            }
            else {   
                // 1.2.2. 이미 데이터가 있는 경우 
                chrome.runtime.sendMessage({
                    title : mesg.title,
                    data : {
                        items : _bg.data.stored.items['page' + mesg.page],
                        paging : _bg.data.stored.paging['page' + mesg.page],
                        last_updated : _bg.data.last_updated
                    }
                } , ()=>{
                    _bg.data.states = _bg.IDENTIFIERS.states.IDLE;
                });
            }
        }
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_LAST_UPDATED){
        chrome.runtime.sendMessage({
            title : mesg.title,
            data: _bg.data.last_updated
        });
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_FAVORITE_ITEM){
        
        chrome.storage.sync.get(_bg.IDENTIFIERS.sync.FAVORITE_ITEMS, function(item){
            if(item.hasOwnProperty(_bg.IDENTIFIERS.sync.FAVORITE_ITEMS)){
                // 요소가 있는 경우 
                _bg.data.favorites = item[_bg.IDENTIFIERS.sync.FAVORITE_ITEMS];
            }
            chrome.runtime.sendMessage({
                title : mesg.title,
                data : _bg.data.favorites
            });
        });
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.SET_FAVORITE_ITEM){
        if(_bg.data.favorites.length >= 10){
            sendResponse({
                state : false ,
                mesg : '즐겨찾기가 가득 찼습니다. 더 추가하시려면 즐겨찾기 항목을 삭제해주세요'
            });
        }
        else{
            let isDuplicated = false;
            for(var i= 0 ; i < _bg.data.favorites.length; i++){
                let _checkItem = _bg.data.favorites[i];
                // 중복 체크 
                if(_checkItem.contentId === mesg.item.contentId){
                    isDuplicated = true;
                    break;
                }
            }
            if(isDuplicated){
                sendResponse({
                    state : false,
                    mesg : '이미 등록된 항목입니다'
                });
            }
            else{                
                chrome.storage.sync.get(_bg.IDENTIFIERS.sync.FAVORITE_ITEMS , function(items){
                    if(items.hasOwnProperty(_bg.IDENTIFIERS.sync.FAVORITE_ITEMS)){
                        _bg.data.favorites = items[_bg.IDENTIFIERS.sync.FAVORITE_ITEMS];
                    }
                    _bg.data.favorites.unshift(mesg.item);
                    let si = {};
                    si[_bg.IDENTIFIERS.sync.FAVORITE_ITEMS] = _bg.data.favorites;
                    chrome.storage.sync.set(si , function(){
                        sendResponse({
                            state : true,
                            mesg : '성공했습니다',
                            items : _bg.data.favorites
                        });
                    });
                });
            }
        }
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.DEL_FAVORITE_ITEM){
        chrome.storage.sync.get(_bg.IDENTIFIERS.sync.FAVORITE_ITEMS , function(item){
            if(item.hasOwnProperty(_bg.IDENTIFIERS.sync.FAVORITE_ITEMS)){
               _bg.data.favorites = item[_bg.IDENTIFIERS.sync.FAVORITE_ITEMS]; 
            }

            for(var i = 0 ; i < _bg.data.favorites.length; i++){
                if(_bg.data.favorites[i].contentId === mesg.contentId){
                    _bg.data.favorites.splice(i , 1);
                }
            }

            let storage_setup = {};
            storage_setup[_bg.IDENTIFIERS.sync.FAVORITE_ITEMS] = _bg.data.favorites;
            chrome.storage.sync.set(storage_setup, function(){
                sendResponse({
                    state : true,
                    mesg : '성공했습니다',
                    items : _bg.data.favorites
                });
            });
        });
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_HISTORY_ITEM){
        chrome.storage.sync.get(_bg.IDENTIFIERS.sync.HISTORY_ITEMS, function(item){
            if(item.hasOwnProperty(_bg.IDENTIFIERS.sync.HISTORY_ITEMS)){
                _bg.data.histories = item[_bg.IDENTIFIERS.sync.HISTORY_ITEMS];
            }
            chrome.runtime.sendMessage({
                title : mesg.title ,
                data : _bg.data.histories
            });
        });
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.SET_HISTORY_ITEM){
        if(mesg.item){
            chrome.storage.sync.get(_bg.IDENTIFIERS.sync.HISTORY_ITEMS , function(item){
                if(item.hasOwnProperty(_bg.IDENTIFIERS.sync.HISTORY_ITEMS)){
                    _bg.data.histories = item[_bg.IDENTIFIERS.sync.HISTORY_ITEMS];
                }
                mesg.item.watched_date = (new Date()).getTime();
                _bg.data.histories.unshift(mesg.item);
                
                if(_bg.data.histories.length >= 10){
                    while(_bg.data.histories.length > 10){
                        _bg.data.histories.pop();
                    }
                }
                let sync_items = {};
                sync_items[_bg.IDENTIFIERS.sync.HISTORY_ITEMS] = _bg.data.histories;
    
                chrome.storage.sync.set(sync_items , function(){
                    // updated
                });
            });
        }   
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_KEYWORD_ITEM){
        chrome.runtime.sendMessage({
            title : mesg.title,
            data : {
                keywords : _bg.filter.keywords,
                items : _bg.filter.items
            }
        });
    }
});