angular.module('optApp' , ['ngMaterial' , 'ngMessages'])
.controller('optCtrl' , ['$scope' , '$http' , '$mdDialog' , function($s , $http, $mdDialog){
    $s.mod = {
        keywords : [],
        crawler : {
            state : false,
            period : 0
        }
    };

    $s.fn = {
        init : function(){
            chrome.runtime.sendMessage({
                title : 'GET_CONFIG_DATA'
            });

            chrome.runtime.onMessage.addListener(function(mesg){
                if(mesg.title === 'GET_CONFIG_DATA'){
                    $s.mod.keywords = mesg.data.KEYWORDS;
                    $s.mod.crawler.period = mesg.data.CRAWLER_PERIOD;
                    $s.mod.crawler.state = mesg.data.CRAWLER_STATE;  
                    
                    $s.$apply();           
                }
                else if(mesg.title === 'SET_CONFIG_DATA'){
                    
                    window.location.reload();
                }
            });
        },
        evt : {
            save : function(){
                $mdDialog.show(
                    $mdDialog
                    .confirm()
                    .parent(angular.element(document.querySelector('.content-option')))
                    .clickOutsideToClose(true)
                    .title('설정 저장안내')
                    .textContent('현재 상태를 저장할까요?')
                    .ariaLabel('설정저장안내')
                    .ok('저장해주세요')
                    .cancel('잠시만요')
                ).then(function(){
                    chrome.runtime.sendMessage({
                        title : 'SET_CONFIG_DATA',
                        data : {
                            keywords : $s.mod.keywords,
                            crawler_state : $s.mod.crawler.state,
                            crawler_period : $s.mod.crawler.period
                        }
                    });
                }, function(){
                    // console.log('nah!');
                });
            },
            cancel : function(){
                $mdDialog.show(
                    $mdDialog
                    .confirm()
                    .parent(angular.element(document.querySelector('.content-option')))
                    .clickOutsideToClose(true)
                    .title('설정 저장안내')
                    .textContent('변경 사항을 취소할까요?')
                    .ariaLabel('설정저장안내')
                    .ok('취소해주세요')
                    .cancel('잠시만요')
                ).then(function(){
                    window.location.reload();
                }, function(){
                    // console.log('nah!');
                });
            }
        }
    };

    $s.fn.init();
}]);