배경이미지 출처: https://www.pexels.com/video/top-view-of-black-fabric-texture-7677746/

## 프로젝트 구조
fashion-folio/
├── app.js                  # 메인 애플리케이션 진입점
├── package.json
├── .env
├── data/                   # JSON 데이터 파일들
│   ├── users.json
│   ├── trends.json
│   ├── favorites.json
│   └── journals.json
├── models/                 # JSON 파일 CRUD 로직
│   ├── User.js
│   ├── Trend.js          
│   └── Journal.js        
├── routes/
│   ├── trends.js
│   ├── journals.js       
│   ├── assist.js         
│   └── users.js          
├── controllers/
│   ├── trendController.js
│   ├── journalController.js
│   ├── assistController.js
│   └── userController.js
├── services/
│   ├── scrapingService.js                  # 트렌드 스크래핑
│   ├── openaiService.js                    # OpenAI API 연동  
│   └── dataService.js
|   └── imageService.js                  # 이미지처리
├── middleware/       
│   ├── upload.js                   # 파일 업로드 미들웨어  
│   └── validation.js                   # 입력값 검증
├── utils/
│   ├── scheduler.js                    # 스케줄링 (매일 스크래핑)           
└── public/              # 정적 파일들 (기존 파일들 그대로!)
    ├── index.html
    ├── style.css 
    ├── main.js      # 새로 작성할 API 연동 JS
    ├── assets/
    │   ├── bgvideo.mp4  # 기존 assets 파일들
    │   └── logo-w.png
    └── uploads/         # 업로드된 이미지들