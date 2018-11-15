angular.module('popApp' , ['ngMaterial' , 'ngMessages'])
.controller('popCtrl' , ['$scope' , '$http' , '$mdDialog' , function($s , $http, $mdDialog){
    
    $s.mod = {
        IDENTIFIERS : {
            NOTICE : 'NOTICE',
            HISTORY : 'HISTORY',
            FAVORITE : 'FAVORITE',
            KEYWORD : 'KEYWORD'
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
        },
        keyword : {
            keywords :[],
            items : {}
        }
    };

    $s.chrome = {
        meta : function(){
            chrome.runtime.sendMessage({title : 'GET_META_DATA'});
        }, 
        init : function(){
            chrome.runtime.onMessage.addListener(function(mesg){
                if(mesg.title === "GET_BOARD_ITEM"){
                    
                    $s.mod.items = mesg.data.items;
                    $s.mod.state.loading = false;

                    $s.mod.page.max = mesg.data.paging.last;
                    $s.mod.page.items = mesg.data.paging.data;
                    var _tmp = moment(mesg.data.last_updated);
                    $s.mod.last_updated_txt = _tmp.fromNow();
                    
                    console.log($s.mod);

                    $s.$apply();
                }
                else if(mesg.title == 'GET_HISTORY_ITEM'){
                    $s.mod.state.loading = false;
                    $s.mod.histories = mesg.data;
                    
                    $s.$apply();
                }
                else if(mesg.title === 'GET_FAVORITE_ITEM'){
                    $s.mod.state.loading = false;
                    $s.mod.favorites = mesg.data;
                    $s.$apply();
                }
                else if(mesg.title == 'GET_LAST_UPDATED'){
                    if(mesg.data){
                        var _tmp = moment(mesg.data);
                        $s.mod.last_updated_txt = _tmp.fromNow();
                        $s.$apply();
                    }
                }
                else if(mesg.title == 'GET_META_DATA'){
                    if(mesg.data){
                        $s.mod.search.types = mesg.data.types;
                        $s.mod.search.type = $s.mod.search.types[0].val;
                        $s.mod.search.cates = mesg.data.categories;
                        $s.mod.search.cate = $s.mod.search.cates[0].val;
                    }
                }
                else if(mesg.title === 'GET_KEYWORD_ITEM'){
                    if(mesg.data){
                        $s.mod.keyword.keywords = mesg.data.keywords;
                        $s.mod.keyword.items = mesg.data.items;
                    }
                }
            });
        }
    }

    $s.fn = {
        init : function(){
            // $s.mod.page.items = [1,2,3,4,5];
            $s.mod.page.items = [1,2,3,4,5];
            
            $s.chrome.init();
            $s.chrome.meta();
            $s.fn.load({
                page : 1,
                forced : false
            });
            $s.fn.evt.search.init();
            $s.fn.evt.keyword.init();
        },
        load : function(opt){
            if(!$s.mod.state.loading){
                $s.mod.state.loading = true;
                chrome.runtime.sendMessage({ 
                    title : "GET_BOARD_ITEM" , 
                    page : opt.page ? opt.page : 1,
                    cate : opt.cate ? opt.cate : '',
                    type : opt.type ? opt.type : '',
                    keyword : opt.keyword ? opt.keyword : '',
                    forced : opt.forced
                });    
            }
        },
        evt : {
            // 모든 상태를 초기화하고 데이터를 가져온다
            reload : function(){
                $s.mod.page.current = 1;
                $s.fn.load({
                    page : $s.mod.page.current,
                    forced : true
                });

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
                            $s.fn.load({
                                page : $s.mod.page.current,
                                forced : false
                            });
                            
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
                            $s.fn.load({
                                page : $s.mod.page.current,
                                forced : false
                            });
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
                            // $s.fn.load($s.mod.page.current, false);
                            $s.fn.load({
                                page : $s.mod.page.current,
                                keyword : $s.mod.search.keyword,
                                forced : false
                            });
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
                            title : "GET_BOARD_ITEM" , 
                            keyword : $s.mod.search.keyword,
                            type : $s.mod.search.type,
                            forced : true
                        });
                    }
                },
                init : function(){
                    _fn.footer.disableSearch();

                    $s.mod.page.current = 1;
                    $s.fn.load({
                        page : $s.mod.page.current,
                        forced : true
                    });
                }
            },
            setFooterState : function(mode){
                _fn.footer.set(mode);
            },
            keyword : {
                init : function(){
                    $s.fn.evt.keyword.get();
                },
                get : function(){
                    chrome.runtime.sendMessage({
                        title : 'GET_KEYWORD_ITEM'
                    });
                },
            }
        }
    };

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
            $s.mod.state.loading = true;
            chrome.runtime.sendMessage({
                title : 'GET_HISTORY_ITEM'
            });
        }
        else if(n === 2){
            // FAVORITE
            $s.mod.state.loading = true;
            chrome.runtime.sendMessage({
                title : 'GET_FAVORITE_ITEM'
            });
        }
        else if(n === 3){
            $s.fn.evt.keyword.get();
        }
    });
    $s.fn.init();
}])
.filter('frmDate', function(){
    return function(dateStr){
        var _dt = new Date(dateStr);
        _dt = moment(_dt);

        return _dt.format('YYYY-MM-DD');
    };
})
.filter('frmLongDate', function(){
    return function(dateStr){
        var _dt = new Date(dateStr);
        _dt = moment(_dt);

        return _dt.format('YYYY-MM-DD HH:MM:SS');
    };
}).directive('rptLastItem', function() {
    return function(scope, element, attrs) {
        // angular.element(element).css('color','blue');
        if (scope.$last){
            if(attrs['rptLastItem'] === 'true'){
                var list = jQuery('.list.keyword');
                var list_children = list.children();
                for(var idx = 0 ; idx < list_children.length ; idx++){
                    var item = list_children.eq(idx);
                    item.find('.header').attr('data-position-top' , item.find('.header').position().top);
                }
                list.unbind('scroll');
                // list.bind('scroll' , e => {
                //     for(var idx = 0 ; idx < list_children.length ; idx++){
                //         var position_top = Number(list_children.eq(idx).find('.header').attr('data-position-top'));
                //         var item = list_children.eq(idx).find('.header');
                //         console.log(position_top , e.target.scrollTop);
                //         if(e.target.scrollTop >= position_top){
                //             // console.log('idx : ' + idx + ' is not same');
                //             if(item.css('position') !== 'fixed'){
                //                 item.css({
                //                     'position' : 'fixed',
                //                     'top' : (idx * 33) + 'px',
                //                     'width' : '100%',
                //                     'z-index' : 10
                //                 });
                //                 list_children.eq(idx).css({
                //                     'padding-top' : '33px'
                //                 });
                //             }
                //         }
                //         else{
                //             if(item.css('position') === 'fixed'){
                //                 item.css({
                //                     'position' : '',
                //                     'top' : '',
                //                     'width' : '',
                //                     'z-index' : ''
                //                 });
                //                 list_children.eq(idx).css({
                //                     'padding-top' : ''
                //                 });
                //             }
                //         }
                //     }
                // });
            }
        }
    };
});
