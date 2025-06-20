const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { scrapeMusinsa } = require('./server/scrapingService');
const { getFashionRecommendation } = require('./server/aiService');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// 로그인
app.post('/api/login', async (req, res) => {
    try {
        const { id, password } = req.body;
        const usersData = await readJsonFile('users.json');
        const user = usersData.users.find(u => u.id === id);

        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                age: user.age,
                gender: user.gender,
                height: user.height,
                weight: user.weight,
                job: user.job,
                bodyType: user.bodyType
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 회원가입
app.post('/api/users', async (req, res) => {
    try {
        const { id, password, age, gender, height, weight, job, bodyType } = req.body;

        if (!id || !password) {
            return res.status(400).json({
                success: false,
                message: '아이디와 비밀번호는 필수입니다.'
            });
        }

        const usersData = await readJsonFile('users.json');

        if (usersData.users.find(u => u.id === id)) {
            return res.status(400).json({
                success: false,
                message: '이미 존재하는 아이디입니다.'
            });
        }

        const newUser = {
            id,
            password,
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

// 패션 추천
app.post('/api/fashion-recommend', async (req, res) => {
    try {
        const { dailyInfo } = req.body;
        const userId = req.userId;

        // 사용자 정보 가져오기
        const usersData = await readJsonFile('users.json');
        const user = usersData.users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // 입력 검증
        if (!dailyInfo || dailyInfo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '오늘의 기분이나 일정을 입력해주세요.'
            });
        }

        // AI 서비스 호출
        const result = await getFashionRecommendation(user, dailyInfo);

        if (result.success) {
            res.json({
                success: true,
                userInfo: {
                    height: `${user.height}cm`,
                    weight: `${user.weight}kg`,
                    bodyType: user.bodyType || '보통',
                    dailyInfo
                },
                recommendation: result.recommendation
            });
        } else {
            // 에러 타입에 따른 적절한 상태 코드 반환
            const statusCode = result.error === 'INVALID_API_KEY' ? 401 :
                result.error === 'RATE_LIMIT' ? 429 : 500;

            res.status(statusCode).json({
                success: false,
                message: result.message
            });
        }

    } catch (error) {
        console.error('패션 추천 엔드포인트 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
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

// 스크래핑 함수
async function runScraping() {
    try {
        console.log(`[${new Date().toLocaleString()}] 스크래핑 시작...`);
        await scrapeMusinsa();
        console.log(`[${new Date().toLocaleString()}] 스크래핑 완료!`);
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] 스크래핑 실패:`, error);
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

app.get('/api/trends/:gender', (req, res) => {
    try {
        const { gender } = req.params;
        const trendsData = getAllTrends();

        let filteredTrends = [];

        if (gender === 'men' && trendsData.men) {
            filteredTrends = trendsData.men;
        } else if (gender === 'women' && trendsData.women) {
            filteredTrends = trendsData.women;
        } else if (gender === 'all' && trendsData.all) {
            filteredTrends = trendsData.all;
        }

        res.json({
            success: true,
            data: { trends: filteredTrends }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

function getAllUsers() {
    try {
        const dataPath = path.join(__dirname, './server/data', 'users.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('데이터 읽기 오류:', error);
    }
}

app.get('/api/users', (req, res) => {
    try {
        const usersData = getAllUsers();
        res.json({
            success: true,
            data: usersData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

function getAllPosts() {
    try {
        const dataPath = path.join(__dirname, './server/data', 'posts.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('데이터 읽기 오류:', error);
    }
}

app.get('/api/posts', (req, res) => {
    try {
        const postsData = getAllPosts();
        res.json({
            success: true,
            data: postsData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 서버 시작
app.listen(PORT, async () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);

    await runScraping();
    module.exports = app;
    cron.schedule('0 6 * * *', runScraping, {
        timezone: "Asia/Seoul"
    });
});

module.exports = app;