var _BACKGROUND = _BACKGROUND || {
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
            _EXT_BBS_sWriter: "취업지원팀",
            _EXT_BBS_sTag: "",
            _EXT_BBS_sContent: "",
            _EXT_BBS_sCategory2: "",
            _EXT_BBS_sKeyType: "writer",
            _EXT_BBS_sKeyword: "취업지원팀",
            _EXT_BBS_curPage: 1,
        }
    },
    items : [],
    fetch : function(raw){
        var parsed = jQuery(raw).find('.list').find('tbody');
        var ret = [];
        var _items = parsed.children();
        _items.map(function(idx){
            var _item = _items.eq(idx)
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
            _itemData.author = _item.find('.author').text().trim();
            _itemData.date = _item.find('.date').text().trim();

            ret.push(_itemData);
        });

        
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

            chrome.storage.sync.set({'LAST_UPDATED' : (new Date()).getTime()});
        });
    }
}


chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.get(['LAST_UPDATED'] , function(item){
        console.log(item);
    })
    _BACKGROUND.load(1);
});

chrome.runtime.onMessage.addListener(function(mesg){
    if(mesg.title === "GET_BOARD_ITEM"){
        if(!mesg.forced &&
            _BACKGROUND.conn.requestParams._EXT_BBS_curPage === mesg.page && 
            _BACKGROUND.items.length > 0){
            chrome.runtime.sendMessage({
                title : 'GET_BOARD_ITEM',
                data : _BACKGROUND.items
            });
        }
        else{
            _BACKGROUND.load(mesg.page).then(function(){
                chrome.runtime.sendMessage({
                    title : 'GET_BOARD_ITEM',
                    data : _BACKGROUND.items
                }); 
            });
        }
    }
    else if(mesg.title === "GET_LAST_UPDATED"){
        chrome.storage.sync.get(['LAST_UPDATED'] , function(items){
            chrome.runtime.sendMessage({
                title : 'GET_LAST_UPDATED',
                data : items.LAST_UPDATED
            });
        })
    }
})