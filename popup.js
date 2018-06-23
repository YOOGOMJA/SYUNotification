angular.module('popApp' , ['ngMaterial' , 'ngMessages'])
.controller('popCtrl' , ['$scope' , '$http' , '$mdDialog' , function($s , $http, $mdDialog){
    
    $s.mod = {
        IDENTIFIERS : {
            NOTICE : "NOTICE",
            HISTORY : "HISTORY",
            FAVORITE : 'FAVORITE'
        },
        items : [],
        histories : [],
        favorites : [],
        page : {
            current : 1,
            items : [],
            max : 9999,
            pagecount : 5
        },
        // loading : false,
        last_updated_txt : '',
        nav : {
            selected : 0
        },
        state : {
            loading : false,
            isSearchMode : false,
            searched : false
        },
        search : {
            keyword : '',
            type : 'title',
            types : [
                { val : 'title' , desc : '제목' },
                { val : 'writer' , desc : '작성자' },
                { val : 'content' , desc : '내용' }
            ]
        }
    }

    $s.fn = {
        init : function(){
            // $s.mod.page.items = [1,2,3,4,5];
            $s.mod.page.items = [1,2,3,4,5];
            chrome.runtime.onMessage.addListener(function(mesg){
                if(mesg.title === "GET_BOARD_ITEM"){
                    $s.mod.items = mesg.data;
                    $s.mod.state.loading = false;

                    if($s.mod.items.length <= 0 || !mesg.data){
                        $s.mod.page.max = 1;
                    }
                    else{
                        $s.mod.page.max = $s.mod.items[0].__MAX_PAGE;
                    }

                    if($s.mod.page.max < $s.mod.page.pagecount){
                        $s.mod.page.items.splice(0);
                        for(var i = 1 ; i <= $s.mod.page.max ; i++){
                            $s.mod.page.items.push(i);
                        }
                    }

                    $s.$apply();

                    console.log($s.mod.items);
                }
                else if(mesg.title == 'GET_HISTORY_ITEM'){
                    console.log(mesg.items);
                    console.log('hi' , mesg);
                    $s.mod.state.loading = false;
                    $s.mod.histories = mesg.items;
                    $s.$apply();
                }
                else if(mesg.title === 'GET_FAVORITE_ITEM'){
                    console.log(mesg.items);
                    console.log('hi' , mesg);
                    $s.mod.state.loading = false;
                    $s.mod.favorites = mesg.items;
                    $s.$apply();
                }
                else if(mesg.title == 'GET_LAST_UPDATED'){
                    if(mesg.data){
                        console.log('Jello')
                        var _tmp = moment(mesg.data);
                        $s.mod.last_updated_txt = _tmp.fromNow();
                        $s.$apply();
                    }
                }
            });

            chrome.runtime.sendMessage({
                title : 'GET_LAST_UPDATED'
            });

            $s.fn.evt.search.init();
            // $s.fn.load(1 , false);
        },
        load : function(page, forced){
            if(!$s.mod.state.loading){
                $s.mod.state.loading = true;
                chrome.runtime.sendMessage({ title : "GET_BOARD_ITEM" , page : page , forced : forced}, function(){
                    
                });
                
                // chrome.storage.sync.get(['LAST_UPDATED'] , function(item){
                //     if(item.LAST_UPDATED){
                //         console.log('Jello')
                //         var _tmp = moment(item.LAST_UPDATED);
                //         $s.mod.last_updated_txt = _tmp.fromNow();
                //         $s.$apply();
                //     }
                // });
                chrome.runtime.sendMessage({
                    title : 'GET_LAST_UPDATED'
                });
            }
        },
        evt : {
            
            reload : function(){
                $s.mod.page.current = 1;
                $s.mod.page.items.splice(0);
                for(var i= 1 ; i <= 5;i++){
                    $s.mod.page.items.push(i);
                }
                // $s.fn.load(1,true);
                $s.mod.state.searched = false;
                $s.mod.state.isSearchMode = false;
                $s.fn.evt.search.init();
            },
            page : {
                next : function(){
                    if($s.mod.page.current >= $s.mod.page.max ){
                        return;
                    }
                    else{
                        if(!$s.mod.state.loading && ($s.mod.page.current + 1) < $s.mod.page.max){
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
                        if(!$s.mod.state.loading && ($s.mod.page.current - 1) > 0){
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
                        if(!$s.mod.state.loading){
                            $s.mod.page.current = page;
                            $s.fn.load($s.mod.page.current, false);
                        }
                    }
                }
            },
            openTab : function(item){
                // $s.mod.history.push(item);
                chrome.runtime.sendMessage({
                    title : 'SET_HISTORY_ITEM',
                    item : item
                });
                chrome.tabs.create({
                    url : item.location
                });
            },
            fav : {
                add : function(item){
                    item.isFocused = false;
                    chrome.runtime.sendMessage({
                        title : 'SET_FAVORITE_ITEM',
                        item : item
                    }, function(mesg){
                        if(mesg){
                            $mdDialog.show(
                                $mdDialog
                                .alert()
                                .parent(angular.element(document.querySelector('.content')))
                                .clickOutsideToClose(true)
                                .title('즐겨찾기 알림')
                                .textContent(mesg.mesg)
                                .ariaLabel('즐겨찾기 알림')
                                .ok('알겠어요')
                            );
                        }
                        else{
                            $mdDialog.show(
                                $mdDialog
                                .alert()
                                .parent(angular.element(document.querySelector('.content')))
                                .clickOutsideToClose(true)
                                .title('즐겨찾기 알림')
                                .textContent('즐겨찾기에 추가되었습니다')
                                .ariaLabel('즐겨찾기 알림')
                                .ok('알겠어요')
                            );
                        }
                        $s.mod.state.loading = true;
                        chrome.runtime.sendMessage({
                            title : "GET_FAVORITE_ITEM"
                        });
                    }); 
                },
                del : function(contentId){
                    var _confirm = $mdDialog.confirm()
                    .title('즐겨찾기 삭제')
                    .textContent('정말 이 항목을 삭제 하시겠습니까?')
                    .ariaLabel('즐겨찾기 삭제 안내 ')
                    .ok('지워주세요')
                    .cancel('다시 생각할게요');
                
                    $mdDialog.show(_confirm).then(function() {
                        chrome.runtime.sendMessage({
                            title : 'DEL_FAVORITE_ITEM',
                            contentId : contentId
                        }, function(mesg){
                            $s.mod.state.loading = true;
                            chrome.runtime.sendMessage({
                                title : "GET_FAVORITE_ITEM"
                            });
                        });
                    });

                }
            },
            search : {
                get : function(){
                    if($s.mod.search.keyword.trim() === ""){
                        // alert('검색어를 입력해주세요');
                        $mdDialog.show(
                            $mdDialog
                            .alert()
                            .parent(angular.element(document.querySelector('.content')))
                            .clickOutsideToClose(true)
                            .title('검색 알림')
                            .textContent('검색어를 입력해주세요')
                            .ariaLabel('검색 알림')
                            .ok('알겠어요')
                        );
                        return ;
                    }
                    else{
                        $s.mod.state.loading = true;
                        $s.mod.page.current = 1;
                        _fn.footer.enableSearch();
                        chrome.runtime.sendMessage({ 
                            title : "GET_SEARCHED_ITEM" , 
                            keyword : $s.mod.search.keyword,
                            type : $s.mod.search.type
                        });
                    }
                },
                init : function(){
                    $s.mod.state.loading = true;

                    _fn.footer.disableSearch();

                    $s.mod.page.current = 1;
                    $s.mod.page.items.splice(0);
                    for(var i= 1 ; i <= 5;i++){
                        $s.mod.page.items.push(i);
                    }
                    chrome.runtime.sendMessage({ 
                        title : "GET_INITIALIZED_ITEM" , 
                    });
                }
            },
            setFooterState : function(mode){
                _fn.footer.set(mode);
            }
        }
    }

    var _fn ={
        footer : {
            set : function(mode){
                if(mode == "PAGINATION"){
                    // 1. MAKE PAGINATION
                    if(!$s.mod.state.searched){
                        $s.mod.search.type = $s.mod.search.types[0].val;
                        $s.mod.search.keyword = '';
                    }
                    $s.mod.state.isSearchMode = false;
                }
                else if('SEARCH'){
                    $s.mod.state.isSearchMode = true;
                }
            },
            enableSearch : function(){
                $s.mod.state.searched = true;
            },
            disableSearch : function(){
                $s.mod.state.searched = false;
                $s.mod.search.keyword = "";
                $s.mod.search.type = $s.mod.search.types[0].val;
            }
        }
    }

    $s.$watch('mod.nav.selected' , function(n,o){
        if(n === 0){
            // NOTICE
            //$s.fn.evt.reload();
        }
        else if(n === 1){
            // HISTORY
            console.log('hello histories');
            $s.mod.state.loading = true;
            chrome.runtime.sendMessage({
                title : 'GET_HISTORY_ITEM'
            });
        }
        else if(n === 2){
            // FAVORITE
            console.log('Hello favorite');
            $s.mod.state.loading = true;
            chrome.runtime.sendMessage({
                title : 'GET_FAVORITE_ITEM'
            });
        }
    })

    $s.fn.init();
}])
.filter('frmDate', function(){
    return function(dateStr){
        var _dt = new Date(dateStr);
        _dt = moment(_dt);

        return _dt.format('YYYY-MM-DD');
    }
});
