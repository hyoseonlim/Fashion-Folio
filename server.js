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

// JSON 파일 읽기/쓰기 헬퍼
const readJsonFile = (filename) => {
    const data = fs.readFileSync(path.join(__dirname, './server/data', filename), 'utf8');
    return JSON.parse(data);
};

const writeJsonFile = async (filename, data) => {
    await fs.writeFile(
        path.join(__dirname, 'server/data', filename),
        JSON.stringify(data, null, 2)
    );
};

const sessions = new Map();

// 로그인
app.post('/api/login', async (req, res) => {
    try {
        const { id, password } = req.body;
        const usersData = await readJsonFile('users.json');
        const user = usersData.users.find(u => u.id === id);
        // 사용자 확인
        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // 세션 ID 생성
        const sessionId = Math.random().toString(36).substring(2, 9);
        sessions.set(sessionId, user.id);
        res.json({
            success: true,
            sessionId,
            user: {
                id: user.id,
                age: user.age,
                gender: user.gender,
                height: user.height,
                weight: user.weight,
                job: user.job
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

function getAllTrends() {
    try {
        const dataPath = path.join(__dirname, './server/data', 'trends.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('데이터 읽기 오류:', error);
    }
}

// 회원가입
app.post('/api/users', async (req, res) => {
    try {
        const { id, password, age, gender, height, weight, job, bodyType } = req.body;

        // 필수 필드 확인
        if (!id || !password) {
            return res.status(400).json({
                success: false,
                message: '아이디와 비밀번호는 필수입니다.'
            });
        }

        const usersData = await readJsonFile('users.json');

        // 중복 확인
        if (usersData.users.find(u => u.id === id)) {
            return res.status(400).json({
                success: false,
                message: '이미 존재하는 아이디입니다.'
            });
        }

        // 새 사용자 추가
        const newUser = {
            id,
            password, // 암호화 생략
            age: parseInt(age) || 0,
            gender: gender || '',
            height: parseInt(height) || 0,
            weight: parseInt(weight) || 0,
            job: job || '',
            bodyType: bodyType || '',
            joinDate: new Date().toISOString().split('T')[0],
            likedTrends: [],
            likedUsers: []
        };

        usersData.users.push(newUser);
        await writeJsonFile('users.json', usersData);

        res.json({
            success: true,
            message: '회원가입이 완료되었습니다.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 아이디 중복 확인
app.get('/api/check-id/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const usersData = await readJsonFile('users.json');
        const exists = usersData.users.some(u => u.id === id);

        res.json({
            success: true,
            available: !exists,
            message: exists ? '이미 사용중인 아이디입니다.' : '사용 가능한 아이디입니다.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// 인증 미들웨어
const authenticate = (req, res, next) => {
    const sessionId = req.headers['session-id'];

    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    req.userId = sessions.get(sessionId);
    next();
};


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
        console.log(`[${new
            Date().toLocaleString()}] 스크래핑 시작...`);
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