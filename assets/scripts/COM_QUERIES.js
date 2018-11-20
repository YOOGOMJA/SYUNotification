/**
 * 쿼리스트링 조작용 객체 
 * 
 * @version 0.1.1
 * @author KyeongSoo Yoo machun34@gmail.com
 * @description 주소 요청에 필요한 쿼리스트링을 조작할 수 있는 객체
 * @param {String} urlStr 조작할 url 본체 
 * @returns {Object} 함수를 갖는 객체
 */
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
        /**
         * 소지 여부 
         * 
         * @description 현재 쿼리스트링이 해당 key를 갖는지 확인
         * @param {String} key 확인할 키 
         * @returns {boolean} 소지 여부
         */
        has : function(key){
            return internal.has(key);
        },
        /** 
         * 키 값 가져오기
         * 
         * @description 쿼리스트링에서 특정 키로 값을 가져옴
         * @param {String} key 가져올 키 
         * @returns {Object} 데이터
         */
        get : function(key){
            return internal.get(key)
        },
        /** 
         * 변환
         * 
         * @description 쿼리스트링의 모든 값들을 키=밸류 쌍의 객체로 반환
         * @returns {Object} 데이터
         */
        all : function(){
            return internal.__QUERIES;
        },
        /** 
         * object -> string
         * 
         * @desc 넘겨받는 객체를 쿼리스트링 형태로 변환
         * @param {Object} 키와 값 형태의 오브젝트 
         * @returns {String} 주소용 쿼리스트링 형태 스트링
         */
        gen : function(obj){
            return internal.gen(obj);
        },
        len : internal.__LEN
    }
};