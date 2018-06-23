var _BACKGROUND = _BACKGROUND || {
    IDENTIFIERS :{
        MESG : {
            GET_BOARD_ITEM : 'GET_BOARD_ITEM',
            GET_LAST_UPDATED : 'GET_LAST_UPDATED',
            GET_SEARCHED_ITEM : 'GET_SEARCHED_ITEM',
            GET_INITIALIZED_ITEM : 'GET_INITIALIZED_ITEM',
            SET_HISTORY_ITEM : 'SET_HISTORY_ITEM',
            GET_HISTORY_ITEM : 'GET_HISTORY_ITEM',
            SET_FAVORITE_ITEM : 'SET_FAVORITE_ITEM',
            GET_FAVORITE_ITEM : 'GET_FAVORITE_ITEM',
            DEL_HISTORY_ITEM : 'DEL_HISTORY_ITEM',
            DEL_FAVORITE_ITEM : 'DEL_FAVORITE_ITEM'
        },
        SEARCH_TYPES : {
            WRITER : 'writer',
            TITLE : 'title',
            CONTENT : 'content'
        }
    },
    conn : {
        url : "https://www.syu.ac.kr/web/kor/comm_a_01",
        requestParams : {
            p_p_id: "EXT_BBS",
            p_p_lifecycle: 0,
            p_p_state: "normal",
            p_p_mode: "view",
            p_p_col_id: "column-1",
            p_p_col_count: 1,
            _EXT_BBS_struts_action: "/ext/bbs/view",
            _EXT_BBS_sCategory: "",
            _EXT_BBS_sTitle: "",
            _EXT_BBS_sWriter: "",
            _EXT_BBS_sTag: "",
            _EXT_BBS_sContent: "",
            _EXT_BBS_sCategory2: "",
            _EXT_BBS_sKeyType: "",
            _EXT_BBS_sKeyword: "",
            _EXT_BBS_curPage: 1,
        }
    },
    items : [],
    histories : [],
    favorites :[],
    last_updated : (new Date()).getTime(),
    fetch : function(raw){
        var parsed_doc = jQuery(raw);
        var parsed_listInfo = parsed_doc.find('.list-info').text();
        var listInfo_splited = parsed_listInfo.split(' ');
        var listInfo = {
            totalItem : Number(listInfo_splited[1]),
            current : Number(listInfo_splited[3].replace('/' , '')),
            last : Number(listInfo_splited[4].replace('페이지' , ''))
        };

        var ret = [];
        var parsed = parsed_doc.find('.list').find('tbody');
        // 2. 리스트 목록 파싱 
        var _items = parsed.children();
        if(_items.length > 0){
            _items.map(function(idx){
                var _item = _items.eq(idx);
                
                if(_item.find('td[colspan="4"]').length <= 0){
                    var _itemData = { };
                    _itemData.isFixed = (_item.find('.no img').length > 0) ? true : false;
                    if(!_itemData.isFixed){ 
                        _itemData.seq = _item.find('.no').text().trim(); 
                        var _num = Number(_itemData.seq);
                    } 
                    else{
                        _itemData.seq = -1;
                    }
                    _itemData.isNewItem = (_item.find('.title img[alt="새글"]').length > 0) ? true : false;
                    _itemData.title = _item.find('.title a').text().trim();
                    _itemData.location = _item.find('.title a').prop('href');
                    _itemData.contentId = _itemData.location.indexOf("?") >= 0 ? (new QUERIES(_itemData.location)).get('_EXT_BBS_messageId') : -1;
                    _itemData.author = _item.find('.author').text().trim();
                    _itemData.date = _item.find('.date').text().trim();
                    _itemData.__TOTAL_ITEM_LENGTH = listInfo.totalItem;
                    _itemData.__MAX_PAGE = listInfo.last <= 0 ? 1 : listInfo.last;
                    _itemData.__CURRENT_PAGE = listInfo.current;
    
                    ret.push(_itemData);
                }
            });
        }   
        
        return ret;
    },
    load : function(page , callback){
        //_BACKGROUND.page.setCurrent(page);
        _BACKGROUND.conn.requestParams._EXT_BBS_curPage = page;
        return jQuery.ajax({
            url : _BACKGROUND.conn.url,
            data : _BACKGROUND.conn.requestParams,
            method : 'POST'
        })
        .then(function(d){
            var _fetched = _BACKGROUND.fetch(d);
            _BACKGROUND.items = _fetched;

            var _now = (new Date()).getTime();
            chrome.storage.sync.set({'LAST_UPDATED' :_now}, function(){
                _BACKGROUND.last_updated = _now;
            });
        });
    }
}

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.get(['LAST_UPDATED'] , function(item){
        console.log(item);
        _BACKGROUND.last_updated = item.LAST_UPDATED;
    })
    _BACKGROUND.load(1);
});

chrome.runtime.onMessage.addListener(function(mesg, sender , sendResponse){
    if(mesg.title === _BACKGROUND.IDENTIFIERS.MESG.GET_BOARD_ITEM){
        if(!mesg.forced &&
            _BACKGROUND.conn.requestParams._EXT_BBS_curPage === mesg.page && 
            _BACKGROUND.items.length > 0){
            chrome.runtime.sendMessage({
                title : _BACKGROUND.IDENTIFIERS.MESG.GET_BOARD_ITEM,
                data : _BACKGROUND.items
            });
        }
        else{
            _BACKGROUND.load(mesg.page).then(function(){
                chrome.runtime.sendMessage({
                    title : _BACKGROUND.IDENTIFIERS.MESG.GET_BOARD_ITEM,
                    data : _BACKGROUND.items
                }); 
            });
        }
    }
    else if(mesg.title === _BACKGROUND.IDENTIFIERS.MESG.GET_LAST_UPDATED){
        console.log('GETLASTUPDATED')
        chrome.storage.sync.get(['LAST_UPDATED'] , function(items){
            _BACKGROUND.last_updated = items.LAST_UPDATED ? items.LAST_UPDATED : (new Date()).getTime();
            chrome.runtime.sendMessage({
                title : _BACKGROUND.IDENTIFIERS.MESG.GET_LAST_UPDATED,
                data : items.LAST_UPDATED
            });
        })
    }
    else if(mesg.title === _BACKGROUND.IDENTIFIERS.MESG.GET_SEARCHED_ITEM){
        if(mesg.type === _BACKGROUND.IDENTIFIERS.SEARCH_TYPES.TITLE){
            _BACKGROUND.conn.requestParams._EXT_BBS_sTitle = mesg.keyword;
            _BACKGROUND.conn.requestParams._EXT_BBS_sKeyword = mesg.keyword;
            _BACKGROUND.conn.requestParams._EXT_BBS_sKeyType = _BACKGROUND.IDENTIFIERS.SEARCH_TYPES.TITLE;
        }
        else if(mesg.type === _BACKGROUND.IDENTIFIERS.SEARCH_TYPES.WRITER){
            _BACKGROUND.conn.requestParams._EXT_BBS_sWriter = mesg.keyword;
            _BACKGROUND.conn.requestParams._EXT_BBS_sKeyword = mesg.keyword;
            _BACKGROUND.conn.requestParams._EXT_BBS_sKeyType = _BACKGROUND.IDENTIFIERS.SEARCH_TYPES.WRITER;
        }
        else if(mesg.type === _BACKGROUND.IDENTIFIERS.SEARCH_TYPES.CONTENT){
            _BACKGROUND.conn.requestParams._EXT_BBS_sContent = mesg.keyword;
            _BACKGROUND.conn.requestParams._EXT_BBS_sKeyword = mesg.keyword;
            _BACKGROUND.conn.requestParams._EXT_BBS_sKeyType = _BACKGROUND.IDENTIFIERS.SEARCH_TYPES.CONTENT;
        }
        else{
            _BACKGROUND.conn.requestParams._EXT_BBS_sTitle = "";
            _BACKGROUND.conn.requestParams._EXT_BBS_sWriter = "";
            _BACKGROUND.conn.requestParams._EXT_BBS_sContent = "";
            _BACKGROUND.conn.requestParams._EXT_BBS_sKeyword = "";
            _BACKGROUND.conn.requestParams._EXT_BBS_sKeyType = "";
        }
        _BACKGROUND.load(1).then(function(){
            chrome.runtime.sendMessage({
                title : _BACKGROUND.IDENTIFIERS.MESG.GET_BOARD_ITEM,
                data : _BACKGROUND.items
            }); 
        });
    }
    else if(mesg.title === _BACKGROUND.IDENTIFIERS.MESG.GET_INITIALIZED_ITEM){
        // _EXT_BBS_struts_action: "/ext/bbs/view",
        //     _EXT_BBS_sCategory: "",
        //     _EXT_BBS_sTitle: "",
        //     _EXT_BBS_sWriter: "",
        //     _EXT_BBS_sTag: "",
        //     _EXT_BBS_sContent: "",
        //     _EXT_BBS_sCategory2: "",
        //     _EXT_BBS_sKeyType: "",
        //     _EXT_BBS_sKeyword: "",
        //     _EXT_BBS_curPage: 1,
        _BACKGROUND.conn.requestParams._EXT_BBS_sTitle = "";
        _BACKGROUND.conn.requestParams._EXT_BBS_sWriter = "";
        _BACKGROUND.conn.requestParams._EXT_BBS_sContent = "";
        _BACKGROUND.conn.requestParams._EXT_BBS_sKeyword = "";
        _BACKGROUND.conn.requestParams._EXT_BBS_sKeyType = "";
        _BACKGROUND.load(1).then(function(){
            chrome.runtime.sendMessage({
                title : 'GET_BOARD_ITEM',
                data : _BACKGROUND.items
            }); 
        });        
    }
    else if(mesg.title == _BACKGROUND.IDENTIFIERS.MESG.SET_HISTORY_ITEM){
        _BACKGROUND.histories.unshift(mesg.item);
        if(_BACKGROUND.histories.length >= 10){
            while(_BACKGROUND.histories.length != 10){
                _BACKGROUND.histories.pop();
            }
        }
    }
    else if(mesg.title == _BACKGROUND.IDENTIFIERS.MESG.GET_HISTORY_ITEM){
        chrome.runtime.sendMessage({
            title : _BACKGROUND.IDENTIFIERS.MESG.GET_HISTORY_ITEM,
            items : _BACKGROUND.histories
        });
    }
    else if(mesg.title == _BACKGROUND.IDENTIFIERS.MESG.SET_FAVORITE_ITEM){
        
        if(_BACKGROUND.favorites.length >= 10){
            sendResponse({
                state : false,
                mesg : '즐겨찾기가 가득 찼습니다. 더 추가하시려면 즐겨 찾기 항목을 삭제해주세요'
            });
        }
        else{
            var isDuplicated = false;
            for(var i = 0 ; i < _BACKGROUND.favorites.length ; i++){
                var _checkItem = _BACKGROUND.favorites[i];
                if(_checkItem.contentId === mesg.item.contentId){
                    isDuplicated = true;
                    break;
                }
            }

            if(isDuplicated){
               sendResponse({
                   state : false,
                   mesg : '이미 즐겨찾기에 등록된 항목 입니다.'
               });
            }
            else{
                _BACKGROUND.favorites.unshift(mesg.item);
                chrome.storage.sync.set({
                    'FAVORITE_ITEMS' : _BACKGROUND.favorites,
                    'LAST_UPDATED' : (new Date()).getTime()
                }, function(){
                    sendResponse({
                        state : true,
                        mesg : '성공했습니다',
                        items : _BACKGROUND.favorites
                    });
                });    
            }
        }
    }
    else if(mesg.title == _BACKGROUND.IDENTIFIERS.MESG.GET_FAVORITE_ITEM){
        chrome.storage.sync.get(['FAVORITE_ITEMS'] , function(item){
            _BACKGROUND.favorites = item.FAVORITE_ITEMS ? item.FAVORITE_ITEMS : [];
            chrome.runtime.sendMessage({
                title : _BACKGROUND.IDENTIFIERS.MESG.GET_FAVORITE_ITEM,
                items : _BACKGROUND.favorites
            });
        });
    }
    else if(mesg.title == _BACKGROUND.IDENTIFIERS.MESG.DEL_FAVORITE_ITEM){
        chrome.storage.sync.get(['FAVORITE_ITEMS'] , function(item){
            _BACKGROUND.favorites = item.FAVORITE_ITEMS;
            for(var i = 0 ; i < _BACKGROUND.favorites.length ; i++){
                if(mesg.contentId === _BACKGROUND.favorites[i].contentId){
                    _BACKGROUND.favorites.splice(i,1);
                }
            }

            chrome.storage.sync.set({
                'FAVORITE_ITEMS' : _BACKGROUND.favorites
            }, function(){
                sendResponse({
                    state : true,
                    mesg : '성공했습니다',
                    items : _BACKGROUND.favorites
                });
            });
        });
    }
    else{
        console.log("ERR" , mesg);
    }
})