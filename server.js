const express = require('express');
const cors = require('cors');
const path = require('path'); // 파일/폴더 경로 처리
const fs = require('fs'); // 파일 시스템 읽기/쓰기
const cron = require('node-cron'); // 스케줄링
const { scrapeMusinsa } = require('./server/scrapingService');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // JSON 파싱을 위한 미들웨어
app.use(express.static(path.join(__dirname, 'public'))); // 자동으로 public/index.html 서빙하므로 아래 코드 필요 없음
// app.get('/', (req, res) => {res.sendFile(path.join(__dirname, 'public', 'index.html')); })

function getAllTrends() {
    try {
        const dataPath = path.join(__dirname, './server/data', 'trends.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('데이터 읽기 오류:', error);
    }
}

app.get('/api/trends', (req, res) => {
    try {
        const trendsData = getAllTrends();
        res.json({
            success: true,
            data: trendsData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 스크래핑 함수 (로깅 추가)
async function runScraping() {
    try {
        console.log(`[${new Date().toLocaleString()}] 스크래핑 시작...`);
        await scrapeMusinsa();
        console.log(`[${new Date().toLocaleString()}] 스크래핑 완료!`);
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] 스크래핑 실패:`, error);
    }
}

// 스크래핑 실행 후 서버 시작
app.listen(PORT, async () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);

    await runScraping(); // 서버 시작 시 한 번 실행
    cron.schedule('0 6 * * *', runScraping, { // 매일 오전 9시에 스크래핑 실행
        timezone: "Asia/Seoul"
    });

    console.log('매일 오전 9시에 자동 스크래핑이 실행됩니다.');
});

module.exports = app;