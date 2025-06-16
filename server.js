const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // JSON 파싱을 위한 미들웨어
app.use(express.static(path.join(__dirname, 'public'))); // 자동으로 public/index.html 서빙하므로 아래 코드 필요 없음
// app.get('/', (req, res) => {res.sendFile(path.join(__dirname, 'public', 'index.html')); })

function getAllTrends() {
    try {
        const dataPath = path.join(__dirname, 'data', 'trends.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('데이터 읽기 오류:', error);
    }
}

app.get('/api/trends', (req, res) => {
    const trendsData = getAllTrends();
    try {
        res.json({
            success: true,
            data: trendsData
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})




// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
})

module.exports = app;