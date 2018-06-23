var QUERIES = QUERIES || function(urlStr){
    

    var internal = {
        __QUERIES : -1,
        __LEN : 0,
        __URL : urlStr,
        __ACTUAL_QUERYSTR : '',
        exists : function(){
            if(internal.__URL.indexOf("?") < 0){
                return false;
            }
            else{
                return true;
            }
        },
        get : function(key){
            if(internal.exists()){
                if(internal.__QUERIES == -1){  
                    internal.all();
                }
            
                return internal.__QUERIES[key];
            }
            else{ return undefined; }
        },
        has : function(key){
            if(!internal.exists()){ return false; }
            else
            {
            if(internal.__QUERIES == -1) {internal.all();}
            
            return Object.keys(internal.__QUERIES).indexOf(key) >= 0;
            }
        },
        all : function(){
            if(!internal.exists()){ return {}; } 
            
            var _t = urlStr.split("?");
            var _ret = {};
            if (_t.len == 1) { return undefined; }

            var _t = _t[1].split("&");
            for (var idx = 0; idx < _t.length; idx++) {
                if (_t[idx] == undefined || _t[idx].length == 0 || _t[idx] == "") { continue; }
                var _t2 = _t[idx].split("=");
                _ret[_t2[0]] = decodeURIComponent(_t2[1]);
            }
            
            internal.__QUERIES = _ret;
            internal.__LEN = _t.length;
        },
        gen : function(obj){
            var ret = "?";
            var keys = Object.keys(obj);
            for(var idx = 0 ; idx < keys.length ; idx++){
                if(idx != 0 && idx <= keys.length -1){
                    ret += "&";
                }
                ret += encodeURIComponent(keys[idx]) + "=" + encodeURIComponent(obj[keys[idx]]);
            }
            
            return ret;
        }
    }

    internal.all();

    return {
        // 쿼리스트링에 특정 키가 있는지 확인 (BOOL)
        has : function(key){
            return internal.has(key);
        },
        // 쿼리스트링에서 특정 키로 값을 가져옴 (OBJECT)
        get : function(key){
            return internal.get(key)
        },
        // 쿼리스트링의 모든 값들을 키=밸류 쌍의 객체로 반환(OBJECT)
        all : function(){
            return internal.__QUERIES;
        },
        // 넘겨받는 객체를 쿼리스트링 형태로 변환 (STRING)
        gen : function(obj){
            return internal.gen(obj);
        },
        len : internal.__LEN
    }
};