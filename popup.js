angular.module('popApp' , [])
.controller('popCtrl' , ['$scope' , '$http' , function($s , $http){
    var _private = {
        fetch : function(raw){
            var ret = [];
            var _items = raw.children();
            _items.map(function(idx){
                var _item = _items.eq(idx)
                var _itemData = { };
                _itemData.isFixed = (_item.find('.no img').length > 0) ? true : false;
                if(!_itemData.isFixed){ 
                    _itemData.seq = _item.find('.no').text().trim(); 
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
        }
    }

    $s.mod = {
        items_raw : [],
        items : []
    }

    $s.fn = {
        init : function(){
            console.log('init');
            $s.fn.load();
        },
        load : function(){
            return $http({
                url : 'https://www.syu.ac.kr/web/kor/comm_a_01',
                method : 'get'
            })
            .then(function(d){
                console.log(d);

                $s.mod.items_raw = jQuery(d.data).find('.list').find('tbody');

                console.log($s.mod.items_raw.get(0));

                window.raw = $s.mod.items_raw;

                $s.mod.items = _private.fetch($s.mod.items_raw);    

                console.log($s.mod.items);
            })
        }
    }

    $s.fn.init();
}]);