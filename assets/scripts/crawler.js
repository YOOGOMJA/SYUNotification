/**
* SYU Notification Crawler 2018.
* 
* @description SYU Notificatino Crawler Singleton
* @author KyeongSoo Yoo
* @exception jQuery is not exists.
*/
let _Crawler = (function(jQuery){
    // Crawler config 
    // 주소 및 통신 방법 
    let config = {
        url : 'https://new.syu.ac.kr/academic/academic-notice/',
        ajax_method : 'GET'
    }
    // Crawler Meta 데이터 
    let meta = {
        css : {
            root : '.md_notice_tbl',
            no_area : '.step1',
            title_area : '.step2',
            author_area : '.step3',
            date_area : '.step4',
            attach_area : '.step5',
            cnt_area : '.step6',
            notice_icon : '.notice_icon',
            cate : '.md_cate',
            title : '.tit',
            new : '.md_new',
            paging_area : '.md_pagingbx'
        },
        // 실제 문장 쿼리스트링
        query : {
            cate : 't',
            type  : 'c',
            keyword : 'k'
        },
        // 조회에 사용되는 옵션들 
        options : {
            cate : [
                { text : '전체' , val : '' },
                { text : '수업' , val : '수업' },
                { text : '학적' , val : '학적' },
                { text : '등록' , val : '등록' },
                { text : '채플' , val : '채플' },
            ],
            type : [
                { text : '전체' , val : '' },
                { text : '제목' , val : '제목' },
                { text : '내용' , val : '내용' },
            ]
        }
    }
    let mod = {
        dom : '',
        tbl : '',
        arr : '',
        paging : '',
    }

    let fn = {
        /** 
         *  비동기 통신 부 
         *
         *  @param data.url 주소 (쿼리스트링 포함)
         *  @param data.page 현재 페이지
         *  @returns 최종 결과물 promise 
         */
        get : function(data){
            let reqURL = '' + config.url;
            if(data.page && data.page !== '' ){ reqURL = reqURL + '/page/' + data.page; }
            else{ reqURL = reqURL + '/page/1'; }
            data.page = undefined;
            return jQuery.ajax({
                url : reqURL,
                data : data,
                method : config.ajax_method
            });
        },
        /** 
         *  조회한 DOM요소를 parsing하는 함수
         *
         *  @param data 비동기 통신 dom
         *  @returns promise 
         */
        fetch : function(dom){
            mod.arr = [];
            mod.dom = jQuery(dom);

            // dom 요소를 가져옴
            mod.tbl = mod.dom.find(meta.css.root);
            // promise를 위한 deferred 객체 생성
            let dfd = jQuery.Deferred();
            // 데이터가 없는 경우에 실패 처리
            if(mod.tbl === '' || mod.tbl.length <= 0){
                dfd.reject({
                    data : [],
                    state : -1,
                    err : 'dom요소가 없거나 테이블이 존재하지 않습니다. url 내용을 확인해주세요'
                });
            }

            // tbody의 내용을 한 줄씩 읽는다.
            let rows = mod.tbl.find('tbody').children();
            rows.map(function(idx){
                let row = rows.eq(idx);
                let item = {};
                // tbody의 내용이 없는 경우 빈채로 보냄
                if(row.find(".step1").length <= 0){
                    mod.arr = [];
                }
                // tbody의 내용이 있는 경우
                else{ 
                    // 1. NO
                    let no = row.find(meta.css.no_area);
                    if(no.find(meta.css.notice_icon).length > 0){
                        // 1.1. 공지사항인 경우
                        item.seq = -1;
                        item.isNotice = true;
                    }
                    else{
                        // 1.2. 공지사항이 아닌 경우
                        item.seq = Number(no.text());
                        item.isNotice = false;
                    }

                    // 2. TITLE
                    let title = row.find(meta.css.title_area);
                    item.title = title.find(meta.css.title).text().trim();
                    item.cate = title.find(meta.css.cate).length <= 0 ? '' : title.find(meta.css.cate).text().trim();
                    item.location = title.find('a').prop('href');
                    item.isNew = title.find(meta.css.new).length > 0;
                    
                    item.contentId = item.location.split('?')[0];
                    item.contentId = item.contentId.slice(0, item.contentId.lastIndexOf('/'));
                    item.contentId = item.contentId.slice(item.contentId.lastIndexOf('/') , item.contentId.length);
                    item.contentId = decodeURI(item.contentId);

                    // 3. AUTHOR
                    let author = row.find(meta.css.author_area);
                    item.author = author.text().trim();
                    
                    // 4. DATE
                    let date = row.find(meta.css.date_area);
                    item.date = date.text().trim();

                    mod.arr.push(item);
                }   
            });

            // PAGING
            // 페이징 정보가 페이지에 따로 있으므로 그걸 그대로 가져옴 
            mod.paging = {};
            mod.paging.data = [];
            mod.paging.last = 1;
            let paging_container = mod.dom.find(meta.css.paging_area);
            if(paging_container.length <= 0){
                // 페이징이 없는 경우에는 비워서 보낸다
                mod.paging.data = [];
                mod.paging.last = 1;
            }
            else{
                let paging = paging_container.find('li').not('.icon_item');
                paging.map(function(idx){
                    let page = paging.eq(idx);
                    let item = {};

                    item.val = Number(page.text());
                    item.selected = page.text() === paging_container.find('ul').attr('data-current-paged');
                    mod.paging.data.push(item);
                });

                let last_elem = paging_container.find('.last a').attr('href');
                last_elem = last_elem.replace(config.url, '');
                last_elem = last_elem.split('?')[0];
                last_elem = last_elem.replace(/\//g,'').replace('page','');

                mod.paging.last = Number(last_elem);
            }
            dfd.resolve(mod.arr, mod.paging);
            
            return dfd.promise();
        },
        /** 
         * 외부용 함수 
         *
         *  @param data 크롤링된 json 요소
         *  @returns 최종 결과물 promise 
         */
        load : function(data){
            // 1. get
            // 2. fetch
            return fn.get(data)
            .then(fn.fetch)
            .then(function(d , p){
                let _d = jQuery.Deferred();

                _d.resolve(d, p , data);

                return _d.promise();
            });
        }
    }

    return {
        /** 
         *  조회 함수
         *  
         *  @desc   비동기 통신 후 데이터를 파싱한다 
         *          opt.cate : 조회 카테고리
         *          opt.type : 조회 타입 
         *          opt.keyword : 조회 키워드
         *          opt.page : 현재 페이지
         *          opt.forced : 강제 업데이트 여부 (background에서 사용)
         *  @param opt 조회에 필요한 요소
         *  @returns 최종 결과물 promise 
         */
        load : function(opt){
            let _data = {};
            _data[meta.query.cate] = opt.cate;
            _data[meta.query.type] = opt.type;
            _data[meta.query.keyword] = opt.keyword;
            _data.page = opt.page;
            _data.forced = opt.forced || false;

            return fn.load(_data);
        },
        /** 
         *  데이터 가져오기 
         *  
         *  @desc 비동기 통신을 하지 않고 기존에 있는 데이터를 가져옴
         *  @returns 크롤러가 가지고 있는 데이터들 
         */
        get : function(){
            return {
                data : mod.arr,
                paging : mod.paging
            };
        },
        /**
         *  옵션 가져오기
         *  조회에 필요한 요소들을 가져옴  
         */
        opts : {
            cate : (function(){
                return meta.options.cate;
            }),
            type : (function(){
                return meta.options.type;
            })
        }
    }
})(jQuery);