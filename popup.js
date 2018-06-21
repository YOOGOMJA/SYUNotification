angular.module('popApp' , ['ngMaterial' , 'ngMessages'])
.controller('popCtrl' , ['$scope' , '$http' , function($s , $http){
    
    $s.mod = {
        IDENTIFIERS : {
            NOTICE : "NOTICE",
            HISTORY : "HISTORY",
            FAVORITE : 'FAVORITE'
        },
        items : [],
        history : [],
        favorite : [],
        page : {
            current : 1,
            items : [],
            max : 9999,
            pagecount : 5
        },
        loading : false,
        last_updated_txt : '',
        nav : {
            selected : 0
        }
    }

    $s.fn = {
        init : function(){
            $s.mod.page.items = [1,2,3,4,5];
            chrome.runtime.onMessage.addListener(function(mesg){
                if(mesg.title === "GET_BOARD_ITEM"){
                    $s.mod.items = mesg.data;
                    $s.mod.loading = false;
                    $s.$apply();
                }
            });

            $s.fn.load(1 , false);
        },
        load : function(page, forced){
            if(!$s.mod.loading){
                $s.mod.loading = true;
                chrome.runtime.sendMessage({ title : "GET_BOARD_ITEM" , page : page , forced : forced});
                
                chrome.storage.sync.get(['LAST_UPDATED'] , function(item){
                    if(item.LAST_UPDATED){
                        var _tmp = moment(item.LAST_UPDATED);
                        $s.mod.last_updated_txt = _tmp.fromNow();
                        $s.$digest();
                    }
                });
            }
        },
        evt : {
            nav : {
                change : function(type){
                    if(type == $s.mod.IDENTIFIERS.NOTICE){
                        $s.mod.nav.selected = type;
                    }
                    else if(type == $s.mod.IDENTIFIERS.FAVORITE){
                        $s.mod.nav.selected = type;
                    }
                    else if(type == $s.mod.IDENTIFIERS.HISTORY){
                        $s.mod.nav.selected = type;
                    }
                }
            },
            reload : function(){
                $s.mod.page.current = 1;
                $s.mod.page.items.splice(0);
                for(var i= 1 ; i <= 5;i++){
                    $s.mod.page.items.push(i);
                }
                $s.fn.load(1,true);
            },
            page : {
                next : function(){
                    if($s.mod.page.current >= $s.mod.page.max ){
                        return;
                    }
                    else{
                        if(!$s.mod.loading && ($s.mod.page.current + 1) < $s.mod.page.max){
                            $s.mod.page.current += 1;
                            $s.fn.load($s.mod.page.current,false);
                            if($s.mod.page.current > $s.mod.page.items[4]){
                                $s.mod.page.items.splice(0);
                                for(var i = 0 ; i< $s.mod.page.pagecount;i++ ){
                                    if(($s.mod.page.current + i) <= $s.mod.page.max){
                                        $s.mod.page.items.push($s.mod.page.current + i);
                                    }
                                }
                            }
                        }
                    }
                },
                prev : function(){
                    if($s.mod.page.current <= 1){
                        return;
                    }
                    else{
                        if(!$s.mod.loading && ($s.mod.page.current - 1) > 0){
                            $s.mod.page.current--;
                            $s.fn.load($s.mod.page.current,false);
                            if($s.mod.page.current < $s.mod.page.items[0]){
                                $s.mod.page.items.splice(0);
                                for(var i = $s.mod.page.pagecount-1 ; i >= 0 ; i-- ){
                                    if($s.mod.page.current - i >= 1){
                                        $s.mod.page.items.push($s.mod.page.current - i);
                                    }
                                }
                                
                            }
                        }
                    }
                },
                go : function(page){
                    if(page === $s.mod.page.current){
                        return;
                    }
                    else{
                        if(!$s.mod.loading){
                            $s.mod.page.current = page;
                            $s.fn.load($s.mod.page.current, false);
                        }
                    }
                }
            },
            openTab : function(item){
                $s.mod.history.push(item);
                chrome.tabs.create({
                    url : item.location
                });
            },
            store : function(item){
                item.isStored = item.isStored ? false : true;
            }
        }
    }

    $s.fn.init();
}])
.filter('frmDate', function(){
    return function(dateStr){
        var _dt = new Date(dateStr);
        _dt = moment(_dt);

        return _dt.format('YYYY-MM-DD');
    }
});
