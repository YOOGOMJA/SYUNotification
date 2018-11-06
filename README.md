# SYUNotification


## Description
삼육대학교 공지 뷰어 입니다. 

## Installation

크롬 확장 프로그램 스토어에는 아직 등록되어있지 않습니다.
직접 추가 하여 사용하는 경우 bower가 필요합니다. 

<pre>
  bower install -- 필요한 스크립트들을 설치합니다.
</pre>

## 1. 예제

![Alt text](https://github.com/YOOGOMJA/SYUNotification/blob/material/syunoti_demo.gif?raw=true "사용예제")

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

## Frameworks & Libraries

[AngularJS 1.x](https://angularjs.org/) 

[AngularJS 1.x Material](https://material.angularjs.org/latest/)

[jQuery](https://jquery.com/)

[momentJS](http://momentjs.com/)

[chrome extension](https://developer.chrome.com/extensions/getstarted)

