const API_BASE_URL = 'http://localhost:3000/api';

// 로그인 확인 함수
function checkLoginRequired() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        showPage('login');
        return false;
    }
    return true;
}

function updateUserUI(user) {
    // 로그인 버튼 숨기고 유저 아이콘 표시
    const loginBtn = document.getElementById('headerLoginBtn');
    const userIcon = document.getElementById('headerUserIcon');

    if (loginBtn) loginBtn.style.display = 'none';
    if (userIcon) userIcon.style.display = 'block';

    if (userIcon) {
        userIcon.style.display = 'block';
        userIcon.style.backgroundColor = user.profileColor || 'black';
    }

    // 유저 정보 표시
    const userInfoDiv = document.getElementById('userInfo');
    if (userInfoDiv) {
        userInfoDiv.innerHTML =
            `${user.age}세 ${user.gender}<br>${user.height}cm, ${user.weight}kg<br>${user.job}`;
    }

    // 편집 모달의 입력 필드들도 업데이트
    if (document.getElementById('genderInput')) {
        document.getElementById('genderInput').value = user.gender || '';
        document.getElementById('ageInput').value = user.age || '';
        document.getElementById('heightInput').value = user.height || '';
        document.getElementById('weightInput').value = user.weight || '';
        document.getElementById('jobInput').value = user.job || '';
        document.getElementById('profileColorInput').value = user.profileColor || '#ff69b4';
    }

    // MY DIARY 메뉴 표시
    const diaryNav = document.querySelector('.header__nav-item:nth-child(4)');
    if (diaryNav) {
        diaryNav.style.display = 'block';
    }
}

// 로그인 처리
async function handleLogin() {
    const id = document.getElementById('loginID').value;
    const password = document.getElementById('loginPW').value;

    if (!id || !password) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, password })
        });

        const result = await response.json();

        if (result.success) {
            // 세션 정보 저장
            localStorage.setItem('userId', result.user.id);
            localStorage.setItem('userInfo', JSON.stringify(result.user));

            // UI 업데이트
            updateUserUI(result.user);
            showPage('trend');

            // 성별에 맞는 트렌드로 새로고침
            getTrends();

            document.getElementById('loginID').value = '';
            document.getElementById('loginPW').value = '';
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert('로그인 중 오류가 발생했습니다.');
    }
}

// 회원가입 처리
async function handleRegister() {
    const id = document.getElementById('registerId').value;
    const password = document.getElementById('registerPw').value;
    const passwordConfirm = document.getElementById('registerPwConfirm').value;
    const gender = document.getElementById('registerGender').value;
    const age = document.getElementById('registerAge').value;
    const job = document.getElementById('registerJob').value;
    const height = document.getElementById('registerHeight').value;
    const weight = document.getElementById('registerWeight').value;
    const bodyType = document.getElementById('registerBodyType').value;
    const profileColor = document.getElementById('registerProfileColor').value;

    // 유효성 검사
    if (!id || !password) {
        alert('아이디와 비밀번호는 필수입니다.');
        return;
    }

    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    if (password.length < 4) {
        alert('비밀번호는 4자 이상이어야 합니다.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id, password, age, gender, height, weight, job, bodyType, profileColor
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            showPage('login');
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert('회원가입 중 오류가 발생했습니다.');
    }
}

// 아이디 중복 확인
async function checkDuplicateId() {
    const id = document.getElementById('registerId').value;

    if (!id) {
        alert('아이디를 입력해주세요.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/check-id/${id}`);
        const result = await response.json();

        const messageDiv = document.getElementById('idCheckMessage');
        messageDiv.textContent = result.message;
        messageDiv.className = result.available ?
            'auth-page__message auth-page__message--success' :
            'auth-page__message';
    } catch (error) {
        alert('중복 확인 중 오류가 발생했습니다.');
    }
}

// 사용자 정보 수정
async function saveUserInfo() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('로그인이 필요합니다.');
        return;
    }

    const gender = document.getElementById('genderInput').value;
    const age = document.getElementById('ageInput').value;
    const height = document.getElementById('heightInput').value;
    const weight = document.getElementById('weightInput').value;
    const job = document.getElementById('jobInput').value;
    const profileColor = document.getElementById('profileColorInput').value;

    // 유효성 검사
    if (!gender || !age || !height || !weight) {
        alert('모든 필수 정보를 입력해주세요.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/user/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId
            },
            body: JSON.stringify({
                gender: gender,
                age: parseInt(age),
                height: parseInt(height),
                weight: parseInt(weight),
                job: job,
                profileColor: profileColor,
            })
        });

        const result = await response.json();

        if (result.success) {
            // localStorage 업데이트
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            Object.assign(userInfo, {
                gender: gender,
                age: parseInt(age),
                height: parseInt(height),
                weight: parseInt(weight),
                job: job,
                profileColor: profileColor
            });
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // UI 업데이트
            updateUserUI(userInfo);
            closeEditModal();
            alert('정보가 수정되었습니다.');
        } else {
            alert(result.message || '정보 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('사용자 정보 수정 오류:', error);
        alert('정보 수정 중 오류가 발생했습니다.');
    }
}

function logout() {
    // 로컬 스토리지 클리어
    localStorage.removeItem('userId');
    localStorage.removeItem('userInfo');

    // UI 초기화
    const loginBtn = document.getElementById('headerLoginBtn');
    const userIcon = document.getElementById('headerUserIcon');

    if (loginBtn) loginBtn.style.display = 'block';
    if (userIcon) userIcon.style.display = 'none';

    // MY DIARY 메뉴 숨기기
    const diaryNav = document.querySelector('.header__nav-item:nth-child(4)');
    if (diaryNav) {
        diaryNav.style.display = 'none';
    }

    // 드롭다운 닫기
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('header__user-dropdown--active');
    }

    // 메인 페이지로 이동하고 전체 트렌드 보기
    showPage('trend');
    getTrends();
}

// 전역 변수
let showingFavoritesOnly = false;
let currentFilters = {
    gender: null,
    styles: [],
    height: null,
    weight: null
};
let appliedFilters = {};
let myTrends = []; // 사용자가 좋아요한 트렌드 목록

// 내 트렌드 데이터 로드
async function loadMyTrends() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/my-trends/${userId}`);
        if (response.ok) {
            const result = await response.json();
            myTrends = result.success ? result.data : [];
        }
    } catch (error) {
        console.error('내 트렌드 로드 실패:', error);
    }
}

// 트렌드 좋아요 토글
async function toggleTrendLike(trendData) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('로그인이 필요합니다.');
        showPage('login');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/my-trends`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                imageUrl: trendData.imageUrl,
                linkUrl: trendData.linkUrl
            })
        });

        const result = await response.json();
        if (result.success) {
            // 로컬 상태 업데이트
            await loadMyTrends();

            // UI 업데이트 (현재 화면이 favorites only라면 다시 필터링)
            if (showingFavoritesOnly) {
                toggleFavoritesFilter();
            }
        }
    } catch (error) {
        console.error('트렌드 좋아요 실패:', error);
    }
}

async function getTrends() {
    try {
        // 로그인 상태 확인
        const userInfo = localStorage.getItem('userInfo');
        let apiUrl = `${API_BASE_URL}/trends`;

        if (userInfo) {
            // 로그인된 경우 사용자 성별에 따라 필터링
            const user = JSON.parse(userInfo);
            const genderParam = user.gender === '남성' ? 'men' :
                user.gender === '여성' ? 'women' : 'all';
            apiUrl += `/${genderParam}`;

            // 내 트렌드 데이터 로드
            await loadMyTrends();
        } else {
            // 로그인하지 않은 경우 모든 데이터
            apiUrl += '/all';
        }

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (result.success) {
            displayTrends(result.data.trends);
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        console.error('데이터 가져오기 실패', err);
    }
}

function displayTrends(trends) {
    const container = document.getElementById('trends');

    // 기존 내용 지우기
    container.innerHTML = '';

    if (!trends || trends.length === 0) {
        container.innerHTML = '<p class="no-data">표시할 트렌드가 없습니다.</p>';
        return;
    }

    for (const trend of trends) {
        let trendTag = document.createElement('div');
        trendTag.className = 'item-card';
        trendTag.onclick = () => window.open(trend.linkUrl, '_blank');

        let trendImg = document.createElement('img');
        trendImg.className = 'item-card__image';
        trendImg.src = trend.imageUrl;
        trendImg.alt = `${trend.category} 스타일`;

        let heartIcon = document.createElement('div');
        heartIcon.className = 'item-card__heart';

        // 좋아요 상태 확인
        const isLiked = myTrends.some(myTrend =>
            myTrend.imageUrl === trend.imageUrl && myTrend.linkUrl === trend.linkUrl
        );
        if (isLiked) {
            heartIcon.classList.add('item-card__heart--liked');
        }

        heartIcon.onclick = (e) => {
            e.stopPropagation();
            toggleTrendLike(trend);
            heartIcon.classList.toggle('item-card__heart--liked');
        };

        trendTag.append(trendImg, heartIcon);
        container.appendChild(trendTag);
    }
}

async function getUsers() {
    if (!checkLoginRequired()) return;

    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const result = await response.json();
        if (result.success) {
            // 로그인한 사용자 제외
            const userId = localStorage.getItem('userId');
            const filteredUsers = result.data.users.filter(user => user.id !== userId);

            // 인기도 계산 (다른 사용자들이 구독한 횟수) - 추가된 부분
            const usersWithPopularity = filteredUsers.map(user => {
                const subscriberCount = result.data.users.filter(u =>
                    u.subscribed && u.subscribed.includes(user.id)
                ).length;
                return { ...user, subscriberCount };
            });

            displayUsers(usersWithPopularity); // 변경된 부분
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        console.error('데이터 가져오기 실패', err);
    }
}

function displayUsers(users) {
    const container = document.getElementById('galleryGrid');
    container.innerHTML = '';

    // 필터링 적용
    let filteredUsers = filterUsers(users);
    const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    const sortType = document.querySelector('input[name="sort"]:checked').value;
    if (sortType === 'join') {
        // 가입일순 정렬 (최신순)
        filteredUsers.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
    } else if (sortType === 'popular') {
        // 인기순 정렬 (구독자 많은 순)
        filteredUsers.sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0));
    }

    // 구독한 유저만 보기 필터 - 추가된 부분
    const showFavoriteOnly = document.getElementById('favoriteOnlyCheckbox').checked;
    if (showFavoriteOnly) {
        const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        filteredUsers = filteredUsers.filter(user =>
            currentUserInfo.subscribed && currentUserInfo.subscribed.includes(user.id)
        );
    }

    if (filteredUsers.length === 0) {
        container.innerHTML = '<div class="no-data">조건에 맞는 사용자가 없습니다.</div>';
        return;
    }

    for (const user of filteredUsers) {
        let userCard = document.createElement('div');
        userCard.className = 'user-card';

        // 사용자 아이콘
        let userIcon = document.createElement('div');
        userIcon.className = 'user-card__icon';
        userIcon.style.backgroundColor = user.profileColor || '#ff69b4';

        // 사용자 정보 컨테이너
        let userInfo = document.createElement('div');
        userInfo.className = 'user-card__info';

        // 아이디
        let userIdElement = document.createElement('h3');
        userIdElement.className = 'user-card__id';
        userIdElement.textContent = user.id;

        // 상세 정보 컨테이너
        let userDetails = document.createElement('div');
        userDetails.className = 'user-card__details';

        // 기본 정보 (나이, 성별)
        let basicInfo = document.createElement('p');
        basicInfo.className = 'user-card__basic-info';
        basicInfo.textContent = `${user.age}세 ${user.gender}`;

        // 신체 정보 (키, 몸무게)
        let bodyInfo = document.createElement('p');
        bodyInfo.className = 'user-card__body-info';
        bodyInfo.textContent = `${user.height}cm, ${user.weight}kg`;

        // 직업
        let jobInfo = document.createElement('span');
        jobInfo.className = 'user-card__job';
        jobInfo.textContent = user.job || '직업 미공개';

        userDetails.append(basicInfo, bodyInfo, jobInfo);
        userInfo.append(userIdElement, userDetails);

        // 구독 버튼
        let subscribeBtn = document.createElement('button');
        subscribeBtn.className = 'user-card__subscribe-btn';

        // 구독 상태 확인
        const isSubscribed = currentUserInfo.subscribed &&
            currentUserInfo.subscribed.includes(user.id);

        if (isSubscribed) {
            subscribeBtn.classList.add('user-card__subscribe-btn--subscribed');
            subscribeBtn.textContent = '구독취소';
        } else {
            subscribeBtn.textContent = '구독하기';
        }

        subscribeBtn.onclick = (e) => {
            e.stopPropagation();
            toggleSubscribe(user.id, subscribeBtn);
        };

        // 카드 클릭 이벤트 (사용자 상세 페이지로)
        userCard.addEventListener('click', function (e) {
            if (e.target === subscribeBtn) return;
            getUser(user);
        });

        userCard.append(userIcon, userInfo, subscribeBtn);
        container.appendChild(userCard);
    }
    showPage('gallery');
}

// 구독 토글 함수
async function toggleSubscribe(targetUserId, buttonElement) {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
        alert('로그인이 필요합니다.');
        showPage('login');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/user/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': currentUserId
            },
            body: JSON.stringify({
                targetUserId: targetUserId
            })
        });

        const result = await response.json();

        if (result.success) {
            // localStorage의 사용자 정보 업데이트
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            userInfo.subscribed = result.subscribed;
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // 버튼 UI 업데이트
            const isSubscribed = result.subscribed.includes(targetUserId);
            if (isSubscribed) {
                buttonElement.classList.add('user-card__subscribe-btn--subscribed');
                buttonElement.textContent = '구독취소';
            } else {
                buttonElement.classList.remove('user-card__subscribe-btn--subscribed');
                buttonElement.textContent = '구독하기';
            }

            console.log(result.message);
        } else {
            alert(result.message || '구독 처리 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('구독 처리 오류:', error);
        alert('서버 연결에 실패했습니다.');
    }
}

// 사용자 필터링 함수
function filterUsers(users) {
    let filtered = [...users];

    // 성별 필터
    if (appliedFilters.gender && appliedFilters.gender !== '전체') {
        filtered = filtered.filter(user => user.gender === appliedFilters.gender);
    }

    // 키 필터
    if (appliedFilters.height) {
        const [minHeight, maxHeight] = appliedFilters.height.replace('cm', '').split('-').map(Number);
        filtered = filtered.filter(user => {
            const height = parseInt(user.height);
            return height >= minHeight && height <= maxHeight;
        });
    }

    // 몸무게 필터
    if (appliedFilters.weight) {
        const [minWeight, maxWeight] = appliedFilters.weight.replace('kg', '').split('-').map(Number);
        filtered = filtered.filter(user => {
            const weight = parseInt(user.weight);
            return weight >= minWeight && weight <= maxWeight;
        });
    }

    return filtered;
}

async function getUser(user) {
    // 좌측 유저 정보 처리
    document.getElementById('detailUserName').innerText = user.id;
    document.getElementById('detailUserBody').innerText = `${user.height}cm, ${user.weight}kg`;
    document.getElementById('detailUserIcon').style.backgroundColor = user.profileColor || '#ff69b4';
    document.getElementById('detailUserFollowers').innerText = user.subscriberCount || 0;

    // 구독 버튼 상태 설정
    const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const subscribeBtn = document.getElementById('detailSubscribeBtn');
    const isSubscribed = currentUserInfo.subscribed && currentUserInfo.subscribed.includes(user.id);

    if (isSubscribed) {
        subscribeBtn.classList.add('user-detail__subscribe-btn--subscribed');
        subscribeBtn.textContent = '구독취소';
    } else {
        subscribeBtn.classList.remove('user-detail__subscribe-btn--subscribed');
        subscribeBtn.textContent = '구독하기';
    }

    // 현재 상세보기 중인 유저 정보 저장
    window.currentDetailUser = user;

    // 해당 유저의 게시글만 가져오기
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        const result = await response.json();
        if (result.success) {
            const userPosts = result.data.posts.filter(post => post.userId === user.id);
            displayUser(userPosts, user);
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        console.error('데이터 가져오기 실패', err);
        displayUser([], user); // 변경된 부분 - 에러 시에도 빈 배열로 호출
    }
}

function displayUser(posts, userData) {
    const container = document.getElementById('detailUserDiaries');

    // 기존 내용 지우기
    container.innerHTML = '';

    if (!posts || posts.length === 0) {
        container.innerHTML = '<p class="no-data">게시글이 없습니다.</p>';
        showPage('user-detail');
        return;
    }

    for (const post of posts) {
        let postDiv = document.createElement('div');
        postDiv.className = 'polaroid-card';
        postDiv.addEventListener('click', function () {
            displayPost(post, userData);
        });

        let postImg = document.createElement('img');
        postImg.src = post.imageUrl;

        let postCaption = document.createElement('div');
        postCaption.className = 'polaroid-caption';
        let postDate = document.createElement('div');
        postDate.className = 'date';
        postDate.innerText = post.date;
        let postContents = document.createElement('div');
        postContents.className = 'desc';
        postContents.innerText = post.content.substr(0, 7) + "...";
        postCaption.append(postDate, postContents);

        postDiv.append(postImg, postCaption);
        container.appendChild(postDiv);
    }
    showPage('user-detail');
}

function displayPost(post, userData) {
    document.getElementById('eachDetailUserIcon').style.backgroundColor = userData.profileColor || '#ff69b4';
    document.getElementById('eachDetailContent').innerText = post.content;
    document.getElementById('eachDetailImage').src = post.imageUrl;
    document.getElementById('eachDetailDate').innerText = post.date;
    document.getElementById('eachDetailUsername').innerText = userData.id;
    document.getElementById('eachDetailUserTags').innerText = `${userData.age}세 ${userData.gender}`;
    document.getElementById('eachDetailUserBody').innerText = `${userData.height}cm, ${userData.weight}kg`;

    showPage('each-detail');
}

// 상세 페이지에서 구독 토글
async function toggleDetailSubscribe() {
    if (!window.currentDetailUser) return;

    const subscribeBtn = document.getElementById('detailSubscribeBtn');
    await toggleSubscribe(window.currentDetailUser.id, subscribeBtn);

    // 팔로워 수 업데이트
    const isSubscribed = subscribeBtn.classList.contains('user-detail__subscribe-btn--subscribed');
    const followersEl = document.getElementById('detailUserFollowers');
    let followersCount = parseInt(followersEl.innerText) || 0;

    if (isSubscribed) {
        followersCount++;
    } else {
        followersCount = Math.max(0, followersCount - 1);
    }

    followersEl.innerText = followersCount;
}

// 갤러리 정렬 함수
function sortGallery(sortType) {
    getUsers(); // 정렬 옵션이 변경되면 사용자 목록을 다시 로드
}

// 구독한 유저만 보기 토글
function toggleFavoriteUsers() {
    getUsers(); // 필터 옵션이 변경되면 사용자 목록을 다시 로드
}

// 페이지 전환 함수 (로그인 체크 포함)
function showPage(pageId) {
    // 로그인이 필요한 페이지들 체크
    if (['discover', 'gallery', 'diary', 'add', 'edit'].includes(pageId)) {
        if (!checkLoginRequired()) return;
    }

    // 모든 페이지 숨기기
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('page--active'));

    // 모든 네비게이션 아이템 비활성화
    const navItems = document.querySelectorAll('.header__nav-item');
    navItems.forEach(item => item.classList.remove('header__nav-item--active'));

    // 선택된 페이지 표시
    document.getElementById(pageId).classList.add('page--active');

    // Add 페이지일 때 오늘 날짜 설정
    if (pageId === 'add') {
        const today = new Date().toISOString().split('T')[0];
        const addDateInput = document.getElementById('add-date');
        if (addDateInput) {
            addDateInput.value = today;
        }

        // 폼 초기화
        const addTextInput = document.getElementById('add-text');
        const addPhotoInput = document.getElementById('add-photo');
        if (addTextInput) addTextInput.value = '';
        if (addPhotoInput) addPhotoInput.value = '';

        // 미리보기 이미지 숨기기
        const addPreview = document.getElementById('add-preview');
        if (addPreview) {
            addPreview.style.display = 'none';
        }
    }

    // 해당 네비게이션 아이템 활성화
    if (pageId !== 'edit' && pageId !== 'add') {
        const navItem = Array.from(navItems).find(item =>
            item.textContent.toLowerCase().includes(pageId.toLowerCase())
        );
        if (navItem) {
            navItem.classList.add('header__nav-item--active');
        }
    }
}

// 사용자 드롭다운 토글
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('header__user-dropdown--active');
}

// 사용자 정보 모달 관련
function openEditModal() {
    document.getElementById('userModal').style.display = 'flex';
    document.querySelector('.bg-overlay').style.filter = 'blur(2px)';
}

function closeEditModal() {
    document.getElementById('userModal').style.display = 'none';
    document.querySelector('.bg-overlay').style.filter = 'none';
}

// 즐겨찾기 필터 토글
function toggleFavoritesFilter() {
    if (!checkLoginRequired()) return;

    const checkbox = document.getElementById('favoritesCheckbox');
    const itemCards = document.querySelectorAll('.item-card');

    showingFavoritesOnly = checkbox.checked;

    if (showingFavoritesOnly) {
        // 즐겨찾기만 보기 모드
        itemCards.forEach(card => {
            const heart = card.querySelector('.item-card__heart');
            if (heart.classList.contains('item-card__heart--liked')) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    } else {
        itemCards.forEach(card => {
            card.style.display = 'block';
        });
    }
}

// 스타일 추천 요청 함수
async function getStyleRecommendation() {
    const moodInput = document.getElementById('moodInput');
    const mood = moodInput.value.trim();

    if (!mood) {
        alert('기분이나 일정을 먼저 입력해주세요.');
        return;
    }

    // 로그인 확인
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('스타일 추천을 받으려면 로그인이 필요합니다.');
        showPage('login');
        return;
    }

    // 로딩 스피너 표시
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/fashion-recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId
            },
            body: JSON.stringify({
                dailyInfo: mood
            })
        });

        const result = await response.json();

        if (result.success) {
            displayRecommendation(result.recommendation.parsed);
            hideLoading();
        } else {
            hideLoading();
            alert(result.message || '추천을 받는 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('추천 요청 오류:', error);
        hideLoading();
        alert('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
}

// 로딩 스피너 표시
function showLoading() {
    document.getElementById('loadingSpinner').classList.add('show');
    document.getElementById('recommendationResult').classList.remove('show');
}

// 로딩 스피너 숨기기
function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('show');
}

// 추천 결과 표시
function displayRecommendation(recommendation) {
    // 데이터 채우기
    if (recommendation.summary) {
        document.getElementById('summaryText').textContent = recommendation.summary;
    }

    if (recommendation.outfit) {
        if (recommendation.outfit.top) {
            document.getElementById('topItem').textContent = recommendation.outfit.top;
        }
        if (recommendation.outfit.bottom) {
            document.getElementById('bottomItem').textContent = recommendation.outfit.bottom;
        }
        if (recommendation.outfit.shoes) {
            document.getElementById('shoesItem').textContent = recommendation.outfit.shoes;
        }
        if (recommendation.outfit.accessories) {
            document.getElementById('accessoriesItem').textContent = recommendation.outfit.accessories;
        }
    }

    // 결과 영역 표시
    document.getElementById('recommendationResult').classList.add('show');

    // 결과 영역으로 스크롤
    document.getElementById('recommendationResult').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// 추천 결과 닫기
function closeRecommendation() {
    document.getElementById('recommendationResult').classList.remove('show');
    document.getElementById('moodInput').value = ''; // 입력창 초기화
}

// 다이어리 날짜 필터 관련
function applyPresetRange() {
    const today = new Date();
    const preset = document.getElementById("preset-range").value;
    const startInput = document.getElementById("start-date");
    const endInput = document.getElementById("end-date");

    const formatDate = (date) => date.toISOString().split("T")[0];

    endInput.value = formatDate(today);

    let startDate = new Date(today);

    switch (preset) {
        case "1w":
            startDate.setDate(today.getDate() - 7);
            break;
        case "1m":
            startDate.setMonth(today.getMonth() - 1);
            break;
        case "6m":
            startDate.setMonth(today.getMonth() - 6);
            break;
        case "1y":
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        case "all":
        default:
            startInput.value = "";
            endInput.value = "";
            filterByDate();
            return;
    }

    startInput.value = formatDate(startDate);
    filterByDate();
}

async function showMyDiary() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('로그인이 필요합니다.');
        showPage('login');
        return;
    }

    // 드롭다운 닫기
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.remove('header__user-dropdown--active');
    }

    // 다이어리 페이지로 이동
    showPage('diary');
    await loadMyDiaries(); // 내 다이어리 목록 로드
}

// 내 다이어리 목록 로드
async function loadMyDiaries() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/posts/user/${userId}`);
        const result = await response.json();

        if (result.success) {
            displayMyDiaries(result.data.posts);
        } else {
            console.error('내 다이어리 로드 실패:', result.message);
        }
    } catch (error) {
        console.error('내 다이어리 로드 오류:', error);
    }
}

// 내 다이어리 표시
function displayMyDiaries(posts) {
    const container = document.getElementById('myDiaryGrid');
    container.innerHTML = '';

    if (!posts || posts.length === 0) {
        container.innerHTML = '<p class="no-data">작성한 다이어리가 없습니다.</p>';
        return;
    }

    // 날짜순으로 정렬 (최신순)
    const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const post of sortedPosts) {
        let diaryCard = document.createElement('div');
        diaryCard.className = 'diary-card';
        diaryCard.setAttribute('data-date', post.date);

        diaryCard.addEventListener('click', function () {
            editDiary(post);
        });

        let diaryImg = document.createElement('img');
        diaryImg.className = 'diary-card__image';
        diaryImg.src = post.imageUrl;
        diaryImg.alt = '다이어리 이미지';

        let diaryDate = document.createElement('div');
        diaryDate.className = 'diary-card__date';
        diaryDate.innerText = formatDate(post.date);

        let diaryContent = document.createElement('div');
        diaryContent.className = 'diary-card__content';
        diaryContent.innerText = post.content.length > 30 ?
            post.content.substring(0, 30) + '...' : post.content;

        diaryCard.append(diaryImg, diaryDate, diaryContent);
        container.appendChild(diaryCard);
    }
}

// 전체 삭제 모달 열기
function openDeleteAllModal() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('로그인이 필요합니다.');
        return;
    }

    // 다이어리가 있는지 확인
    const diaryCards = document.querySelectorAll('.diary-card');
    if (diaryCards.length === 0) {
        alert('삭제할 다이어리가 없습니다.');
        return;
    }

    document.getElementById('deleteAllModal').style.display = 'flex';
}

// 전체 삭제 모달 닫기
function closeDeleteAllModal() {
    document.getElementById('deleteAllModal').style.display = 'none';
}

// 전체 다이어리 삭제 확인
async function confirmDeleteAll() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('로그인이 필요합니다.');
        closeDeleteAllModal();
        return;
    }

    try {
        const deleteResponse = await fetch(`${API_BASE_URL}/posts/user/${userId}/all`, {
            method: 'DELETE',
            headers: {
                'user-id': userId
            }
        });

        const deleteResult = await deleteResponse.json();
        alert(`${deleteResult.deletedCount}개의 다이어리가 모두 삭제되었습니다.`);


        closeDeleteAllModal();
        // 다이어리 목록 새로고침
        await loadMyDiaries();
    }
    catch (error) {
        console.error('전체 삭제 오류:', error);
        alert('전체 삭제 중 오류가 발생했습니다.');
        closeDeleteAllModal();
    }
}


// 날짜 포맷팅 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

// 다이어리 편집
function editDiary(post) {
    // 편집 페이지로 이동하면서 데이터 설정
    showPage('edit');

    // 현재 편집 중인 포스트 ID 저장
    window.currentEditingPostId = post.id;

    // 폼에 데이터 채우기
    document.getElementById('edit-date').value = post.date;
    document.getElementById('edit-text').value = post.content;

    // 미리보기 이미지 표시
    const previewImg = document.getElementById('edit-preview');
    if (previewImg) {
        previewImg.src = post.imageUrl;
        previewImg.style.display = 'block';
    }
}

// 다이어리 추가 저장
async function saveDiary() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('로그인이 필요합니다.');
        showPage('login');
        return;
    }

    const date = document.getElementById('add-date').value;
    const content = document.getElementById('add-text').value;
    const photoFile = document.getElementById('add-photo').files[0];

    if (!date || !content || !photoFile) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    // 로딩 상태 표시 (선택사항)
    const saveButton = document.querySelector('#add button[onclick="saveDiary()"]');
    const originalText = saveButton ? saveButton.textContent : '';
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = '저장 중...';
    }

    try {
        // FormData 객체 생성
        const formData = new FormData();
        formData.append('date', date);
        formData.append('content', content);
        formData.append('photo', photoFile);

        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'user-id': userId
            },
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('새 다이어리가 저장되었습니다.');

            // 폼 초기화
            document.getElementById('add-date').value = '';
            document.getElementById('add-text').value = '';
            document.getElementById('add-photo').value = '';

            // 미리보기 이미지 숨기기
            const addPreview = document.getElementById('add-preview');
            if (addPreview) {
                addPreview.style.display = 'none';
            }

            // 다이어리 페이지로 이동하고 목록 새로고침
            showPage('diary');
            await loadMyDiaries();
        } else {
            alert(result.message || '다이어리 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('다이어리 저장 오류:', error);
        alert('다이어리 저장 중 오류가 발생했습니다.');
    } finally {
        // 로딩 상태 해제
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = originalText;
        }
    }
}

// 다이어리 수정 저장
async function updateDiary() {
    const userId = localStorage.getItem('userId');
    const postId = window.currentEditingPostId;

    if (!userId) {
        alert('로그인이 필요합니다.');
        showPage('login');
        return;
    }

    if (!postId) {
        alert('수정할 다이어리를 찾을 수 없습니다.');
        return;
    }

    const date = document.getElementById('edit-date').value;
    const content = document.getElementById('edit-text').value;
    const photoFile = document.getElementById('edit-photo').files[0];

    if (!date || !content) {
        alert('날짜와 내용을 입력해주세요.');
        return;
    }

    // 로딩 상태 표시 (선택사항)
    const updateButton = document.querySelector('#edit button[onclick="updateDiary()"]');
    const originalText = updateButton ? updateButton.textContent : '';
    if (updateButton) {
        updateButton.disabled = true;
        updateButton.textContent = '수정 중...';
    }

    try {
        // FormData 객체 생성
        const formData = new FormData();
        formData.append('date', date);
        formData.append('content', content);

        // 새 이미지가 선택된 경우에만 추가
        if (photoFile) {
            formData.append('photo', photoFile);
        }

        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'user-id': userId
            },
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('다이어리가 수정되었습니다.');

            // 현재 편집 중인 포스트 ID 초기화
            window.currentEditingPostId = null;

            // 다이어리 페이지로 이동하고 목록 새로고침
            showPage('diary');
            await loadMyDiaries();
        } else {
            alert(result.message || '다이어리 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('다이어리 수정 오류:', error);
        alert('다이어리 수정 중 오류가 발생했습니다.');
    } finally {
        // 로딩 상태 해제
        if (updateButton) {
            updateButton.disabled = false;
            updateButton.textContent = originalText;
        }
    }
}

// 다이어리 삭제 확인 (수정된 버전)
async function confirmDelete() {
    const userId = localStorage.getItem('userId');
    const postId = window.currentEditingPostId;

    if (!userId) {
        alert('로그인이 필요합니다.');
        closeDeleteModal();
        showPage('login');
        return;
    }

    if (!postId) {
        alert('삭제할 다이어리를 찾을 수 없습니다.');
        closeDeleteModal();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'user-id': userId
            }
        });

        const result = await response.json();

        if (result.success) {
            alert('다이어리가 삭제되었습니다.');
            closeDeleteModal();

            // 현재 편집 중인 포스트 ID 초기화
            window.currentEditingPostId = null;

            // 다이어리 페이지로 이동하고 목록 새로고침
            showPage('diary');
            await loadMyDiaries();
        } else {
            alert(result.message || '다이어리 삭제에 실패했습니다.');
            closeDeleteModal();
        }
    } catch (error) {
        console.error('다이어리 삭제 오류:', error);
        alert('다이어리 삭제 중 오류가 발생했습니다.');
        closeDeleteModal();
    }
}

// 이미지 미리보기 함수들 (추가 기능)
function previewAddImage() {
    const input = document.getElementById('add-photo');
    const preview = document.getElementById('add-preview');

    if (input.files && input.files[0]) {
        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };

        reader.readAsDataURL(input.files[0]);
    }
}

function previewEditImage() {
    const input = document.getElementById('edit-photo');
    const preview = document.getElementById('edit-preview');

    if (input.files && input.files[0]) {
        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };

        reader.readAsDataURL(input.files[0]);
    }
}

// 파일 업로드 검증 함수
function validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
        alert('JPG, PNG, GIF 형식의 이미지만 업로드 가능합니다.');
        return false;
    }

    if (file.size > maxSize) {
        alert('파일 크기는 5MB 이하만 가능합니다.');
        return false;
    }

    return true;
}

function filterByDate() {
    const startVal = document.getElementById('start-date').value;
    const endVal = document.getElementById('end-date').value;

    if (!startVal || !endVal) {
        document.querySelectorAll('.diary-card').forEach(card => card.style.display = 'flex');
        return;
    }

    const start = new Date(startVal);
    const end = new Date(endVal);
    const cards = document.querySelectorAll('.diary-card');

    cards.forEach(card => {
        const dateText = card.querySelector('.diary-card__date').textContent.trim();
        const cardDate = new Date(dateText.replace(/\./g, '-'));
        const inRange = cardDate >= start && cardDate <= end;
        card.style.display = inRange ? 'flex' : 'none';
    });
}

// 삭제 모달 관련
function openDeleteModal() {
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

// 갤러리 필터 모달 관련
function openFilterModal(tab) {
    document.getElementById('filterModal').classList.add('show');
    switchTab(tab);
    updateModalTagUI();
}

function closeFilterModal() {
    document.getElementById('filterModal').classList.remove('show');
}

function switchTab(tabName) {
    document.querySelectorAll('.modal__tab-content').forEach(div => div.classList.add('modal__tab-content--hidden'));
    document.querySelectorAll('.modal__tab').forEach(tab => tab.classList.remove('modal__tab--active'));

    document.getElementById(`content-${tabName}`).classList.remove('modal__tab-content--hidden');
    document.getElementById(`tab-${tabName}`).classList.add('modal__tab--active');
}

function updateModalTagUI() {
    const container = document.getElementById('modalSelectedTags');
    container.innerHTML = '';

    if (currentFilters.gender && currentFilters.gender !== '전체') {
        addModalTag(currentFilters.gender, 'gender');
    }
    currentFilters.styles.forEach(style => {
        addModalTag(style, `style-${style}`);
    });
    if (currentFilters.height) {
        addModalTag(`키 ${currentFilters.height}`, 'height');
    }
    if (currentFilters.weight) {
        addModalTag(`몸무게 ${currentFilters.weight}`, 'weight');
    }
}

function addModalTag(text, id) {
    const container = document.getElementById('modalSelectedTags');
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.id = `modal-tag-${id}`;
    tag.innerHTML = `${text} <button class="remove-btn">×</button>`;

    tag.addEventListener('click', () => {
        removeModalTag(id);
    });

    tag.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        removeModalTag(id);
    });

    container.appendChild(tag);
}

function removeModalTag(id) {
    if (id === 'gender') {
        currentFilters.gender = null;
        document.querySelector('input[name="gender"][value="전체"]').checked = true;
    } else if (id.startsWith('style-')) {
        const val = id.replace('style-', '');
        currentFilters.styles = currentFilters.styles.filter(s => s !== val);
        document.querySelector(`#content-style input[value="${val}"]`).checked = false;
    } else if (id === 'height') {
        currentFilters.height = null;
        document.getElementById('heightMin').value = '';
        document.getElementById('heightMax').value = '';
    } else if (id === 'weight') {
        currentFilters.weight = null;
        document.getElementById('weightMin').value = '';
        document.getElementById('weightMax').value = '';
    }
    updateModalTagUI();
}

function applyHeight() {
    const min = document.getElementById('heightMin').value || document.getElementById('heightMin').placeholder.replace(/\D/g, '');
    const max = document.getElementById('heightMax').value || document.getElementById('heightMax').placeholder.replace(/\D/g, '');
    currentFilters.height = `${min}-${max}cm`;
    updateModalTagUI();
}

function applyWeight() {
    const min = document.getElementById('weightMin').value || document.getElementById('weightMin').placeholder.replace(/\D/g, '');
    const max = document.getElementById('weightMax').value || document.getElementById('weightMax').placeholder.replace(/\D/g, '');
    currentFilters.weight = `${min}-${max}kg`;
    updateModalTagUI();
}

function applyFilters() {
    appliedFilters = JSON.parse(JSON.stringify(currentFilters));
    console.log("✅ 적용된 필터:", appliedFilters);
    closeFilterModal();
    updateMainTagUI();

    // 필터 적용 후 사용자 목록 다시 로드
    getUsers();
}

function updateMainTagUI() {
    const container = document.getElementById('selectedFilters');
    container.innerHTML = '';
    if (appliedFilters.gender && appliedFilters.gender !== '전체') addMainTag(appliedFilters.gender, 'gender');
    appliedFilters.styles?.forEach(s => addMainTag(s, `style-${s}`));
    if (appliedFilters.height) addMainTag(`키 ${appliedFilters.height}`, 'height');
    if (appliedFilters.weight) addMainTag(`몸무게 ${appliedFilters.weight}`, 'weight');
}

function addMainTag(text, id) {
    const container = document.getElementById('selectedFilters');
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.id = `tag-${id}`;
    tag.innerHTML = `${text} <button class="remove-btn">×</button>`;

    // 전체 클릭해도 제거되도록
    tag.addEventListener('click', () => {
        removeTag(id);
    });

    // ❌ 버튼만 누르면 중복 이벤트 방지
    tag.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation(); // 상위 div 클릭 방지
        removeTag(id);
    });

    container.appendChild(tag);
}

function removeTag(id) {
    if (id === 'gender') {
        appliedFilters.gender = null;
        currentFilters.gender = null;
        document.querySelector('input[name="gender"][value="전체"]').checked = true;
    } else if (id === 'height') {
        appliedFilters.height = null;
        currentFilters.height = null;
        document.getElementById('heightMin').value = '';
        document.getElementById('heightMax').value = '';
    } else if (id === 'weight') {
        appliedFilters.weight = null;
        currentFilters.weight = null;
        document.getElementById('weightMin').value = '';
        document.getElementById('weightMax').value = '';
    }

    updateMainTagUI();
    updateModalTagUI();

    // 필터 제거 후 사용자 목록 다시 로드
    getUsers();
}

function resetAllFilters() {
    currentFilters = { gender: null, height: null, weight: null, styles: [] };
    appliedFilters = {};
    updateModalTagUI();
    updateMainTagUI();
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = r.value === '전체');
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[type="number"]').forEach(num => num.value = '');

    // 필터 리셋 후 사용자 목록 다시 로드
    getUsers();
}

// ID 검색 기능
async function searchById() {
    const searchInput = document.getElementById('idSearchInput');
    const searchQuery = searchInput.value.trim();

    if (!searchQuery) {
        // 검색어가 없으면 전체 사용자 목록 다시 로드
        await getUsers();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/search?id=${encodeURIComponent(searchQuery)}`);
        const result = await response.json();

        if (result.success) {
            if (result.data.users.length === 0) {
                displaySearchResults([], searchQuery);
            } else {
                // 로그인한 사용자 제외
                const userId = localStorage.getItem('userId');
                const filteredUsers = result.data.users.filter(user => user.id !== userId);
                displaySearchResults(filteredUsers, searchQuery);
            }
        } else {
            alert(result.message || '검색 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('ID 검색 오류:', error);
        alert('검색 중 오류가 발생했습니다.');
    }
}

// 검색 결과 표시
function displaySearchResults(users, searchQuery) {
    const container = document.getElementById('galleryGrid');
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = `
            <div class="search-no-results">
                <h3>검색 결과가 없습니다</h3>
                <p>"${searchQuery}"와 일치하는 사용자를 찾을 수 없습니다.</p>
                <button onclick="clearSearch()" class="clear-search-btn">전체 목록 보기</button>
            </div>
        `;
        return;
    }

    // 검색 결과 헤더 추가
    const searchHeader = document.createElement('div');
    searchHeader.className = 'search-results-header';
    searchHeader.innerHTML = `
        <h3>검색 결과: "${searchQuery}" (${users.length}명)</h3>
        <button onclick="clearSearch()" class="clear-search-btn">전체 목록 보기</button>
    `;
    container.appendChild(searchHeader);

    const currentUserId = localStorage.getItem('userId');
    const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    for (const user of users) {
        let userCard = document.createElement('div');
        userCard.className = 'user-card';

        // 사용자 아이콘
        let userIcon = document.createElement('div');
        userIcon.className = 'user-card__icon';
        userIcon.style.backgroundColor = user.profileColor || '#ff69b4';

        // 사용자 정보 컨테이너
        let userInfo = document.createElement('div');
        userInfo.className = 'user-card__info';

        // 아이디 (검색어 하이라이트)
        let userIdElement = document.createElement('h3');
        userIdElement.className = 'user-card__id';
        userIdElement.innerHTML = highlightSearchTerm(user.id, searchQuery);

        // 상세 정보 컨테이너
        let userDetails = document.createElement('div');
        userDetails.className = 'user-card__details';

        // 기본 정보 (나이, 성별)
        let basicInfo = document.createElement('p');
        basicInfo.className = 'user-card__basic-info';
        basicInfo.textContent = `${user.age}세 ${user.gender}`;

        // 신체 정보 (키, 몸무게)
        let bodyInfo = document.createElement('p');
        bodyInfo.className = 'user-card__body-info';
        bodyInfo.textContent = `${user.height}cm, ${user.weight}kg`;

        // 직업
        let jobInfo = document.createElement('span');
        jobInfo.className = 'user-card__job';
        jobInfo.textContent = user.job || '직업 미공개';

        userDetails.append(basicInfo, bodyInfo, jobInfo);
        userInfo.append(userIdElement, userDetails);

        // 구독 버튼
        let subscribeBtn = document.createElement('button');
        subscribeBtn.className = 'user-card__subscribe-btn';

        // 구독 상태 확인
        const isSubscribed = currentUserInfo.subscribed &&
            currentUserInfo.subscribed.includes(user.id);

        if (isSubscribed) {
            subscribeBtn.classList.add('user-card__subscribe-btn--subscribed');
            subscribeBtn.textContent = '구독취소';
        } else {
            subscribeBtn.textContent = '구독하기';
        }

        subscribeBtn.onclick = (e) => {
            e.stopPropagation();
            toggleSubscribe(user.id, subscribeBtn);
        };

        // 카드 클릭 이벤트 (사용자 상세 페이지로)
        userCard.addEventListener('click', function (e) {
            if (e.target === subscribeBtn || e.target.closest('.clear-search-btn')) return;
            getUser(user);
        });

        userCard.append(userIcon, userInfo, subscribeBtn);
        container.appendChild(userCard);
    }
}

// 검색어 하이라이트 함수
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

// 검색 초기화
function clearSearch() {
    const searchInput = document.getElementById('idSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    getUsers(); // 전체 사용자 목록 다시 로드
}

// 초기화 및 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', async function () {
    // 로컬 스토리지에서 세션 정보 확인
    const userId = localStorage.getItem('userId');
    const userInfo = localStorage.getItem('userInfo');

    if (userId && userInfo) {
        try {
            // 사용자 정보가 있으면 UI 업데이트
            const user = JSON.parse(userInfo);
            updateUserUI(user);

            // MY DIARY 메뉴 표시
            const diaryNav = document.querySelector('.header__nav-item:nth-child(4)');
            if (diaryNav) {
                diaryNav.style.display = 'block';
            }
        } catch (error) {
            console.error('사용자 정보 파싱 실패:', error);
            // 파싱 실패 시 로그아웃 처리
            logout();
        }
    }

    showPage('trend');
    getTrends();

    // 네비게이션 이벤트 리스너 추가
    const navItems = document.querySelectorAll('.header__nav-item');
    navItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const text = item.textContent.toLowerCase();
            if (text.includes('trend')) {
                showPage('trend');
                getTrends();
            } else if (text.includes('stylist')) {
                showPage('discover');
            } else if (text.includes('gallery')) {
                getUsers();
            } else if (text.includes('diary')) {
                showMyDiary();
            }
        });
    });

    // Favorites Only 체크박스 이벤트
    const favoritesCheckbox = document.getElementById('favoritesCheckbox');
    if (favoritesCheckbox) {
        favoritesCheckbox.addEventListener('change', toggleFavoritesFilter);
    }

    // 검색 기능 설정
    const searchInput = document.querySelector('.search-section__input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                console.log('Searching for:', this.value);
                // Add search functionality here
            }
        });
    }

    // 스타일 추천 버튼 설정
    const recommendButton = document.querySelector('.search-section__btn');
    if (recommendButton) {
        recommendButton.addEventListener('click', function () {
            getStyleRecommendation();
        });
    }

    // 스타일 추천 입력창 Enter 키 이벤트
    const moodInput = document.getElementById('moodInput');
    if (moodInput) {
        moodInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                getStyleRecommendation();
            }
        });
    }

    // 갤러리 필터 이벤트 리스너 설정
    document.querySelectorAll('input[name="gender"]').forEach(radio => {
        radio.addEventListener('change', () => {
            currentFilters.gender = radio.value;
            updateModalTagUI();
        });
    });

    document.querySelectorAll('#content-style input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            const val = cb.value;
            if (cb.checked && !currentFilters.styles.includes(val)) {
                currentFilters.styles.push(val);
            } else {
                currentFilters.styles = currentFilters.styles.filter(s => s !== val);
            }
            updateModalTagUI();
        });
    });

    // 다이어리 관련 이벤트 리스너
    const presetRange = document.getElementById('preset-range');
    if (presetRange) {
        presetRange.addEventListener('change', applyPresetRange);
    }

    const startDate = document.getElementById('start-date');
    if (startDate) {
        startDate.addEventListener('change', filterByDate);
    }

    const endDate = document.getElementById('end-date');
    if (endDate) {
        endDate.addEventListener('change', filterByDate);
    }

    // ID 검색 입력창 Enter 키 이벤트
    const idSearchInput = document.getElementById('idSearchInput');
    if (idSearchInput) {
        idSearchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                searchById();
            }
        });

        // 입력값이 변경될 때마다 실시간 검색 (선택사항)
        idSearchInput.addEventListener('input', function (e) {
            // 디바운싱을 위한 타이머
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                if (e.target.value.trim() === '') {
                    clearSearch();
                }
            }, 300);
        });
    }

    // 갤러리 user-card 클릭 시 user-detail 페이지로 이동
    document.querySelectorAll('#gallery .user-card').forEach(card => {
        card.addEventListener('click', function () {
            showPage('user-detail');
        });
    });

    // user-detail의 polaroid-card 클릭 시 each-detail 페이지로 이동
    document.querySelectorAll('#user-detail .polaroid-card').forEach(card => {
        card.addEventListener('click', function () {
            showPage('each-detail');
        });
    });

    document.addEventListener('click', function (event) {
        // 로그인 Enter 키
        document.getElementById('loginPW')?.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') handleLogin();
        });

        // 회원가입 Enter 키
        document.getElementById('registerBodyType')?.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') handleRegister();
        });

        const userSection = document.querySelector('.header__user-section');
        const dropdown = document.querySelector('.header__user-dropdown');

        if (dropdown && userSection && !userSection.contains(event.target)) {
            dropdown.classList.remove('header__user-dropdown--active');
        }
    });
});