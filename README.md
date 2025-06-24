# Fashion Folio

패션 트렌드 추적 및 개인 스타일 다이어리 웹 애플리케이션

## 📁 프로젝트 구조

```
fashion-folio/
├── server.js                      # 메인 애플리케이션 진입점
├── package.json               # 프로젝트 의존성 및 스크립트
├── .env                       # 환경 변수 (API 키)
├── README.md                  # 프로젝트 문서
│
├── server/                    # 서버 사이드 코드
│   ├── data/                  # JSON 데이터베이스 파일
│   │   ├── users.json        # 사용자 계정 데이터
│   │   ├── trends.json       # 무신사 패션 트렌드
│   │   ├── my-trends.json    # 사용자가 좋아요한 트렌드
│   │   └── posts.json        # 사용자 다이어리 게시글
│   │
│   └── services/             # 비즈니스 로직 서비스
│       ├── scrapingService.js # 무신사 웹 스크래핑
│       └── aiService.js      # OpenAI API 연동
│
└── public/                   # 클라이언트 정적 파일
    ├── index.html           # 메인 HTML 파일
    ├── style.css            # 스타일시트
    ├── script.js            # 클라이언트 JavaScript
    │
    ├── assets/              # 정적 에셋
    │   ├── bgvideo.mp4      # 배경 비디오
    │   └── logo-w.png       # 로고 이미지
    │
    └── images/              # 사용자 업로드 이미지
        └── {userId}/        # 사용자별 디렉토리
            └── *.jpg        # 다이어리 사진
```

## 🎨 배경 비디오 출처

- [Top View of Black Fabric Texture](https://www.pexels.com/video/top-view-of-black-fabric-texture-7677746/) from Pexels

## 🛠 사용 기술

- **백엔드**: Node.js, Express.js
- **웹 스크래핑**: Puppeteer (무신사 트렌드 수집)
- **파일 업로드**: Multer
- **스케줄링**: Node-cron (매일 오전 6시 자동 실행)
- **AI 연동**: OpenAI API (GPT-4)
- **프론트엔드**: Vanilla JavaScript, HTML5, CSS3
- **데이터 저장**: JSON 파일 (파일시스템 기반)

## 📋 주요 기능

- 사용자 인증 및 프로필 관리
- 무신사 일일 패션 트렌드 자동 업데이트
- 사진 업로드가 가능한 개인 스타일 다이어리
- AI 기반 맞춤형 패션 추천 (AI Stylist)
- 사용자 검색 및 구독 시스템
- 고급 필터링 및 검색 기능

## 참고
2025 웹프로그래밍 텀프로젝트 과제입니다.
