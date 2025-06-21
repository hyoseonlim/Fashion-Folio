const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cron = require('node-cron');
const { scrapeMusinsa } = require('./server/scrapingService');
const { getFashionRecommendation } = require('./server/aiService');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 파일 업로드 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userId = req.headers['user-id'];
        const uploadDir = path.join(__dirname, 'public', 'images', userId);

        // 디렉토리가 없으면 생성
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const userId = req.headers['user-id'];
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${userId}_diary_${timestamp}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB 제한
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('JPG, PNG, GIF 형식의 이미지만 업로드 가능합니다.'));
        }
    }
});


// JSON 파일 읽기/쓰기 헬퍼
const readJsonFile = (filename) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, './server/data', filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
};

const writeJsonFile = async (filename, data) => {
    try {
        await fs.writeFileSync(
            path.join(__dirname, 'server/data', filename),
            JSON.stringify(data, null, 2)
        );
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
};

// 로그인
app.post('/api/login', async (req, res) => {
    try {
        const { id, password } = req.body;
        const usersData = readJsonFile('users.json');

        if (!usersData) {
            return res.status(500).json({
                success: false,
                message: '사용자 데이터를 읽을 수 없습니다.'
            });
        }

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
                bodyType: user.bodyType,
                profileColor: user.profileColor,
                subscribed: user.subscribed || []
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
        const { id, password, age, gender, height, weight, job, bodyType, profileColor } = req.body;

        if (!id || !password) {
            return res.status(400).json({
                success: false,
                message: '아이디와 비밀번호는 필수입니다.'
            });
        }

        const usersData = readJsonFile('users.json');

        if (!usersData) {
            return res.status(500).json({
                success: false,
                message: '사용자 데이터를 읽을 수 없습니다.'
            });
        }

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
            profileColor: profileColor || '#ff69b4',
            joinDate: new Date().toISOString().split('T')[0],
            likedTrends: [],
            likedUsers: []
        };

        usersData.users.push(newUser);
        const writeSuccess = await writeJsonFile('users.json', usersData);

        if (!writeSuccess) {
            return res.status(500).json({
                success: false,
                message: '회원가입 처리 중 오류가 발생했습니다.'
            });
        }

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
        const usersData = readJsonFile('users.json');

        if (!usersData) {
            return res.status(500).json({
                success: false,
                message: '사용자 데이터를 읽을 수 없습니다.'
            });
        }

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

// 사용자 정보 업데이트
app.put('/api/user/update', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        const { profileColor, gender, age, height, weight, job, bodyType } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '사용자 인증이 필요합니다.'
            });
        }

        const usersData = readJsonFile('users.json');

        if (!usersData) {
            return res.status(500).json({
                success: false,
                message: '사용자 데이터를 읽을 수 없습니다.'
            });
        }

        const userIndex = usersData.users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // 사용자 정보 업데이트
        const user = usersData.users[userIndex];
        if (gender !== undefined) user.gender = gender;
        if (age !== undefined) user.age = parseInt(age);
        if (height !== undefined) user.height = parseInt(height);
        if (weight !== undefined) user.weight = parseInt(weight);
        if (job !== undefined) user.job = job;
        if (bodyType !== undefined) user.bodyType = bodyType;
        if (profileColor !== undefined) user.profileColor = profileColor;

        // 업데이트된 정보 저장
        const writeSuccess = await writeJsonFile('users.json', usersData);

        if (!writeSuccess) {
            return res.status(500).json({
                success: false,
                message: '사용자 정보 저장 중 오류가 발생했습니다.'
            });
        }

        res.json({
            success: true,
            message: '사용자 정보가 성공적으로 업데이트되었습니다.',
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
        console.error('사용자 정보 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 내 트렌드 가져오기
app.get('/api/my-trends/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const myTrendsData = readJsonFile('my-trends.json');

        if (!myTrendsData) {
            // 파일이 없으면 빈 배열 반환
            return res.json({
                success: true,
                data: []
            });
        }

        const userTrends = myTrendsData.trends ?
            myTrendsData.trends.filter(trend => trend.userId === userId) : [];

        res.json({
            success: true,
            data: userTrends
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 내 트렌드 토글 (추가/제거)
app.post('/api/my-trends', async (req, res) => {
    try {
        const { userId, imageUrl, linkUrl } = req.body;

        if (!userId || !imageUrl || !linkUrl) {
            return res.status(400).json({
                success: false,
                message: '필수 데이터가 누락되었습니다.'
            });
        }

        let myTrendsData = readJsonFile('my-trends.json');

        if (!myTrendsData) {
            // 파일이 없으면 새로 생성
            myTrendsData = { trends: [] };
        }

        if (!myTrendsData.trends) {
            myTrendsData.trends = [];
        }

        // 이미 존재하는지 확인
        const existingIndex = myTrendsData.trends.findIndex(
            trend => trend.userId === userId &&
                trend.imageUrl === imageUrl &&
                trend.linkUrl === linkUrl
        );

        if (existingIndex >= 0) {
            // 이미 존재하면 제거 (좋아요 취소)
            myTrendsData.trends.splice(existingIndex, 1);
        } else {
            // 존재하지 않으면 추가 (좋아요)
            myTrendsData.trends.push({
                userId,
                imageUrl,
                linkUrl,
                createdAt: new Date().toISOString()
            });
        }

        const writeSuccess = await writeJsonFile('my-trends.json', myTrendsData);

        if (!writeSuccess) {
            return res.status(500).json({
                success: false,
                message: '트렌드 저장 중 오류가 발생했습니다.'
            });
        }

        res.json({
            success: true,
            message: existingIndex >= 0 ? '트렌드 좋아요를 취소했습니다.' : '트렌드를 좋아요했습니다.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 구독/구독취소 토글
app.post('/api/user/subscribe', async (req, res) => {
    try {
        const currentUserId = req.headers['user-id'];
        const { targetUserId } = req.body;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                message: '사용자 인증이 필요합니다.'
            });
        }

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: '구독할 사용자 ID가 필요합니다.'
            });
        }

        if (currentUserId === targetUserId) {
            return res.status(400).json({
                success: false,
                message: '자기 자신을 구독할 수 없습니다.'
            });
        }

        const usersData = readJsonFile('users.json');

        if (!usersData) {
            return res.status(500).json({
                success: false,
                message: '사용자 데이터를 읽을 수 없습니다.'
            });
        }

        const currentUserIndex = usersData.users.findIndex(u => u.id === currentUserId);
        const targetUserIndex = usersData.users.findIndex(u => u.id === targetUserId);

        if (currentUserIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '현재 사용자를 찾을 수 없습니다.'
            });
        }

        if (targetUserIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '구독할 사용자를 찾을 수 없습니다.'
            });
        }

        const currentUser = usersData.users[currentUserIndex];

        // subscribed 배열이 없으면 생성
        if (!currentUser.subscribed) {
            currentUser.subscribed = [];
        }

        // 구독 상태 토글
        const isCurrentlySubscribed = currentUser.subscribed.includes(targetUserId);

        if (isCurrentlySubscribed) {
            // 구독 취소
            currentUser.subscribed = currentUser.subscribed.filter(id => id !== targetUserId);
        } else {
            // 구독 추가
            currentUser.subscribed.push(targetUserId);
        }

        // 파일에 저장
        const writeSuccess = await writeJsonFile('users.json', usersData);

        if (!writeSuccess) {
            return res.status(500).json({
                success: false,
                message: '구독 정보 저장 중 오류가 발생했습니다.'
            });
        }

        res.json({
            success: true,
            message: isCurrentlySubscribed ? '구독을 취소했습니다.' : '구독했습니다.',
            subscribed: currentUser.subscribed
        });
    } catch (error) {
        console.error('구독 처리 오류:', error);
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
        const userId = req.headers['user-id'];

        // 사용자 정보 가져오기
        const usersData = readJsonFile('users.json');

        if (!usersData) {
            return res.status(500).json({
                success: false,
                message: '사용자 데이터를 읽을 수 없습니다.'
            });
        }

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
        return null;
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

        if (!trendsData) {
            return res.status(500).json({
                success: false,
                message: '트렌드 데이터를 읽을 수 없습니다.'
            });
        }

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

        if (!trendsData) {
            return res.status(500).json({
                success: false,
                message: '트렌드 데이터를 읽을 수 없습니다.'
            });
        }

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
        return null;
    }
}

// ID로 사용자 검색
app.get('/api/users/search', (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: '검색할 ID를 입력해주세요.'
            });
        }

        const usersData = getAllUsers();

        if (!usersData) {
            return res.status(500).json({
                success: false,
                message: '사용자 데이터를 읽을 수 없습니다.'
            });
        }

        // ID에 검색어가 포함된 사용자들 찾기 (대소문자 구분 없음)
        const searchResults = usersData.users.filter(user =>
            user.id.toLowerCase().includes(id.toLowerCase())
        );

        res.json({
            success: true,
            data: {
                users: searchResults,
                searchQuery: id,
                totalResults: searchResults.length
            }
        });
    } catch (error) {
        console.error('사용자 검색 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/users', (req, res) => {
    try {
        const usersData = getAllUsers();

        if (!usersData) {
            return res.status(500).json({
                success: false,
                message: '사용자 데이터를 읽을 수 없습니다.'
            });
        }

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
        return null;
    }
}

app.get('/api/posts', (req, res) => {
    try {
        const postsData = getAllPosts();

        if (!postsData) {
            return res.status(500).json({
                success: false,
                message: '게시글 데이터를 읽을 수 없습니다.'
            });
        }

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

// 다이어리 추가
app.post('/api/posts', upload.single('photo'), async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        const { date, content } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '사용자 인증이 필요합니다.'
            });
        }

        if (!date || !content || !req.file) {
            return res.status(400).json({
                success: false,
                message: '모든 필드를 입력해주세요.'
            });
        }

        const postsData = getAllPosts();

        if (!postsData) {
            return res.status(500).json({
                success: false,
                message: '게시글 데이터를 읽을 수 없습니다.'
            });
        }

        // 새 게시글 생성
        const newPost = {
            id: `diary_${userId}_${Date.now()}`,
            userId: userId,
            date: date,
            imageUrl: `/images/${userId}/${req.file.filename}`,
            content: content,
            createdAt: new Date().toISOString(),
            styles: []
        };

        postsData.posts.push(newPost);

        const writeSuccess = await writeJsonFile('posts.json', postsData);

        if (!writeSuccess) {
            return res.status(500).json({
                success: false,
                message: '다이어리 저장 중 오류가 발생했습니다.'
            });
        }

        res.json({
            success: true,
            message: '다이어리가 성공적으로 저장되었습니다.',
            post: newPost
        });
    } catch (error) {
        console.error('다이어리 추가 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 다이어리 수정
app.put('/api/posts/:postId', upload.single('photo'), async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        const { postId } = req.params;
        const { date, content } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '사용자 인증이 필요합니다.'
            });
        }

        if (!date || !content) {
            return res.status(400).json({
                success: false,
                message: '날짜와 내용을 입력해주세요.'
            });
        }

        const postsData = getAllPosts();

        if (!postsData) {
            return res.status(500).json({
                success: false,
                message: '게시글 데이터를 읽을 수 없습니다.'
            });
        }

        const postIndex = postsData.posts.findIndex(p => p.id === postId && p.userId === userId);

        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '수정할 다이어리를 찾을 수 없습니다.'
            });
        }

        const post = postsData.posts[postIndex];

        // 새 이미지가 업로드된 경우 기존 이미지 삭제
        if (req.file) {
            const oldImagePath = path.join(__dirname, 'public', post.imageUrl);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            post.imageUrl = `/images/${userId}/${req.file.filename}`;
        }

        // 게시글 정보 업데이트
        post.date = date;
        post.content = content;
        post.updatedAt = new Date().toISOString();

        const writeSuccess = await writeJsonFile('posts.json', postsData);

        if (!writeSuccess) {
            return res.status(500).json({
                success: false,
                message: '다이어리 수정 중 오류가 발생했습니다.'
            });
        }

        res.json({
            success: true,
            message: '다이어리가 성공적으로 수정되었습니다.',
            post: post
        });
    } catch (error) {
        console.error('다이어리 수정 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 다이어리 삭제
app.delete('/api/posts/:postId', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        const { postId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '사용자 인증이 필요합니다.'
            });
        }

        const postsData = getAllPosts();

        if (!postsData) {
            return res.status(500).json({
                success: false,
                message: '게시글 데이터를 읽을 수 없습니다.'
            });
        }

        const postIndex = postsData.posts.findIndex(p => p.id === postId && p.userId === userId);

        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '삭제할 다이어리를 찾을 수 없습니다.'
            });
        }

        const post = postsData.posts[postIndex];

        // 이미지 파일 삭제
        const imagePath = path.join(__dirname, 'public', post.imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // 게시글 삭제
        postsData.posts.splice(postIndex, 1);

        const writeSuccess = await writeJsonFile('posts.json', postsData);

        if (!writeSuccess) {
            return res.status(500).json({
                success: false,
                message: '다이어리 삭제 중 오류가 발생했습니다.'
            });
        }

        res.json({
            success: true,
            message: '다이어리가 성공적으로 삭제되었습니다.'
        });
    } catch (error) {
        console.error('다이어리 삭제 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 특정 사용자의 게시글 가져오기
app.get('/api/posts/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const postsData = getAllPosts();

        if (!postsData) {
            return res.status(500).json({
                success: false,
                message: '게시글 데이터를 읽을 수 없습니다.'
            });
        }

        const userPosts = postsData.posts ?
            postsData.posts.filter(post => post.userId === userId) : [];

        res.json({
            success: true,
            data: { posts: userPosts }
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

    cron.schedule('0 6 * * *', runScraping, {
        timezone: "Asia/Seoul"
    });
});

module.exports = app;