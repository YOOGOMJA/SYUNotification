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
            GET_META_DATA : 'GET_META_DATA',
            GET_KEYWORD_FILTERED_ITEM : 'GET_KEYWORD_FILTERED_ITEM',
        },
        sync : {
            LAST_UPDATED : 'LAST_UPDATED',
            FAVORITE_ITEMS : 'FAVORITE_ITEMS',
            HISTORY_ITEMS : 'HISTORY_ITEMS',
            INTERVAL : 'INTERVAL'
        }
    },
    data : {
        last_updated : '',
        favorites : [],
        histories : [],
        stored : {
            items : {},
            paging : {},
        }
    },
    // 키워드 기능 관련
    filter : {
        keywords : [],
        old : {},
        new : {},
    }
}

// INSTALLED
chrome.runtime.onInstalled.addListener(function() {
    
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
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_CONFIG_DATA){
        // 키워드 관련 추가할 것 
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_KEYWORD_FILTERED_ITEM){
        
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_BOARD_ITEM){
        if(!_bg.data.stored.items.hasOwnProperty('page' + mesg.page) || mesg.forced){
            if(mesg.forced){ 
                for(var key in _bg.data.stored.items){
                    delete _bg.data.stored.items[key];
                }
                for(var key in _bg.data.stored.paging){
                    delete _bg.data.stored.paging[key];
                }
            }
            _Crawler.load(mesg.page,mesg.cate,mesg.type,mesg.keyword)
            .then(function(data, paging){
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
                });
            }, function(e){ alert(e); });
        }
        else {
            chrome.runtime.sendMessage({
                title : mesg.title,
                data : {
                    items : _bg.data.stored.items['page' + mesg.page],
                    paging : _bg.data.stored.paging['page' + mesg.page],
                    last_updated : _bg.data.last_updated
                }
            });
        }
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_LAST_UPDATED){
        chrome.runtime.sendMessage({
            title : mesg.title,
            data: _bg.data.last_updated
        });
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.GET_FAVORITE_ITEM){
        chrome.runtime.sendMessage({
            title : mesg.title,
            data : _bg.data.favorites
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
            }
        }
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.DEL_FAVORITE_ITEM){
        chrome.storage.sync.get(_bg.IDENTIFIERS.sync.FAVORITE_ITEMS , function(item){
            _bg.data.favorites = item[_bg.IDENTIFIERS.sync.FAVORITE_ITEMS] ? item[_bg.IDENTIFIERS.sync.FAVORITE_ITEMS] : [];

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
        chrome.storage.local.get(_bg.IDENTIFIERS.sync.HISTORY_ITEMS, function(item){
            _bg.data.histories = item[_bg.IDENTIFIERS.sync.HISTORY_ITEMS];

            chrome.runtime.sendMessage({
                title : mesg.title ,
                data : _bg.data.histories
            });
        });
    }
    else if(mesg.title === _bg.IDENTIFIERS.MESG.SET_HISTORY_ITEM){
        if(mesg.item){
            chrome.storage.local.get(_bg.IDENTIFIERS.sync.HISTORY_ITEMS , function(item){
                if(item[_bg.IDENTIFIERS.sync.HISTORY_ITEMS] && item[_bg.IDENTIFIERS.sync.HISTORY_ITEMS].length > 0){
                    _bg.data.histories = item[_bg.IDENTIFIERS.sync.HISTORY_ITEMS];
                }

                mesg.item.watched_date = (new Date()).getTime();                
                _bg.data.histories.unshift(mesg.item);
                if(_bg.data.histories.length >= 10){
                    while(_bg.histories.length != 10){
                        _bg.histories.pop();
                    }
                }
                
                let sync_items = {};
                sync_items[_bg.IDENTIFIERS.sync.HISTORY_ITEMS] = _bg.data.histories;
                chrome.storage.local.set(sync_items , function(){
                    // updated
                    console.log('history item stored success');
                });
            });

        }
    }   
});