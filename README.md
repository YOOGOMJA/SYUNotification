# SYUNotification


## Description
삼육대학교 공지 뷰어 입니다. 

## Installation

[구글 웹스토어 바로가기](https://chrome.google.com/webstore/detail/syunotification/icgcbogmfianabccahhdadhcfmenhhik?hl=ko) 

직접 추가 하여 사용하는 경우 bower가 필요합니다. 

<pre>
  bower install -- 필요한 스크립트들을 설치합니다.
</pre>

## Structure

### Chrome Extension 
- background.js 
- option.css / options.html / option.js
- popup.css / popup.html / popup.js
- manifest.json

### resource
- COM_QUERIES.js : 주소 쿼리스트링 조작
- crawler.js : 실제 크롤링 부 

## 0. Update

### v1.0.3 
- 푸시 예시 버튼이 추가되었습니다.

### v1.0.2 
- 키워드 관련 오류가 해결됐습니다

### v1.0.1 
- 로드 오류가 해결됐습니다

### v1.0.0
- 메이저 업데이트 되었습니다
- 기존 홈페이지 리뉴얼 반영
- 자동 조회 기능 추가
- 옵션 페이지 추가
- 키워드 설정 및 필터링 기능 추가
- 웹스토어에 게시되었습니다.

## 1. 예제

![사용예제](https://github.com/YOOGOMJA/SYUNotification/blob/master/syunoti_demo.gif?raw=true)

## 2. 기능 
### 2.1 일반 목록 및 검색 

'Notice'를 클릭하면 삼육대학교 학사 공지의 내용들을 가져옵니다.
검색버튼을 클릭하면 '제목','내용','작성자'의 필터로 검색을 할 수 있으며,
검색 내용을 초기화하려면 Refresh 버튼을 클릭하거나 검색 취소 버튼을 클릭해야합니다. 

### 2.2 히스토리

학사 공지 내용을 클릭하면 자동으로 새 탭에서 해당 글로 이동합니다.
이렇게 이동한 항목들은 최대 10개까지 저장되어 history에 남게 됩니다. 
이 정보는 사용한 기기에만 저장되고, 업데이트 되면 사라질 수 있는 휘발성 정보입니다.

### 2.3 즐겨찾기

리스트에서 하트 모양을 클릭하면 즐겨찾기에 등록할 수 있습니다.
이렇게 등록된 항목은 즐겨찾기 탭에서 확인할 수 있고, 최대 10개까지 등록됩니다.
이 정보는 기기간에 공유됩니다. 

### 2.4 자동 조회 & 푸시 메시지

자동 조회 기능이 추가되었습니다. 최소 1분 최대 180분마다 데이터를 자동으로 불러옵니다
자동으로 불러와진 데이터에서 새글이 올라왔다면 push로 알려줍니다.
설정에서 on/off하거나 조회 시간을 설정할 수 있습니다.

### 2.5 키워드 필터링

지정한 키워드에 해당하는 텍스트가 제목에 포함되어있는 경우 따로 모아서 보여줍니다.
이미 읽은 데이터를 기준으로 조회해오기때문에, 데이터 표본이 적다면 데이터가 나타나지
않을 수 도 있습니다.

## Frameworks & Libraries

[AngularJS 1.x](https://angularjs.org/) 

[AngularJS 1.x Material](https://material.angularjs.org/latest/)

[jQuery](https://jquery.com/)

[momentJS](http://momentjs.com/)

[chrome extension](https://developer.chrome.com/extensions/getstarted)

