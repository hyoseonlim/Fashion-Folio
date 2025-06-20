const API_BASE_URL = 'http://localhost:3000/api';

function updateUserUI(user) {
    // 로그인 버튼 숨기고 유저 아이콘 표시
    const loginBtn = document.getElementById('headerLoginBtn');
    const userIcon = document.getElementById('headerUserIcon');

    if (loginBtn) loginBtn.style.display = 'none';
    if (userIcon) userIcon.style.display = 'block';

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

        console.log(response);

        const result = await response.json();


        if (result.success) {
            // 세션 정보 저장
            localStorage.setItem('sessionId', result.sessionId);
            localStorage.setItem('userId', result.user.id);
            localStorage.setItem('userInfo', JSON.stringify(result.user));

            // UI 업데이트
            updateUserUI(result.user);
            showPage('trend');

            // 성별에 맞는 트렌드로 새로고침
            getTrends();
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
    const age = document.getElementById('registerAge').value;
    const job = document.getElementById('registerJob').value;
    const height = document.getElementById('registerHeight').value;
    const weight = document.getElementById('registerWeight').value;
    const bodyType = document.getElementById('registerBodyType').value;

    // 성별 추가 (select로 변경하거나 radio button 추가 필요)
    const gender = '남성'; // 임시값

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
                id, password, age, gender, height, weight, job, bodyType
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
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        alert('로그인이 필요합니다.');
        return;
    }

    const gender = document.getElementById('genderInput').value;
    const age = document.getElementById('ageInput').value;
    const height = document.getElementById('heightInput').value;
    const weight = document.getElementById('weightInput').value;
    const job = document.getElementById('jobInput').value;

    try {
        const response = await apiCall('/user/update', {
            method: 'POST',
            body: JSON.stringify({ gender, age, height, weight, job })
        });

        if (response.success) {
            // localStorage 업데이트
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            Object.assign(userInfo, { gender, age, height, weight, job });
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // UI 업데이트
            updateUserUI(userInfo);
            closeEditModal();
            alert('정보가 수정되었습니다.');
        }
    } catch (error) {
        alert('정보 수정 중 오류가 발생했습니다.');
    }
}

function logout() {
    // 로컬 스토리지 클리어
    localStorage.removeItem('sessionId');
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
    getTrends(); // ✨ 전체 트렌드로 새로고침
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
        trendTag.onclick = () => window.open(trend.linkUrl, '_blank'); // 클릭시 새창으로 링크 열기

        let trendImg = document.createElement('img');
        trendImg.className = 'item-card__image';
        trendImg.src = trend.imageUrl;
        trendImg.alt = `${trend.category} 스타일`;

        let heartIcon = document.createElement('div');
        heartIcon.className = 'item-card__heart';
        heartIcon.onclick = (e) => {
            e.stopPropagation(); // 부모 클릭 이벤트 방지
            toggleHeart(heartIcon);
        };

        trendTag.append(trendImg, heartIcon);
        container.appendChild(trendTag);
    }
}

// 하트 토글 기능 추가
function toggleHeart(heartElement) {
    heartElement.classList.toggle('item-card__heart--liked');

    // 여기서 localStorage나 서버에 좋아요 상태 저장
    // 추후 구현 예정
}

async function getUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const result = await response.json();
        if (result.success) {
            displayUsers(result.data.users);
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        console.error('데이터 가져오기 실패', err);
    }
}

function displayUsers(users) {
    document.getElementById('galleryGrid').innerHTML = '';
    for (const user of users) {
        let userTag = document.createElement('div');
        userTag.className = 'user-card';
        let userImg = document.createElement('img');
        userImg.src = user.profileImage;
        let userIdP = document.createElement('p');
        userIdP.className = 'user-card__id';
        userIdP.innerText = user.id;
        let userTagsP = document.createElement('p');
        userTagsP.className = 'user-card__tags';
        userTagsP.innerText = user.styles;
        userTag.append(userImg, userIdP, userTagsP);
        document.getElementById('galleryGrid').appendChild(userTag);
        // TODO: 바로가기
    }
    // <div class="user-card">
    //     <img src="https://image.msscdn.net/thumbnails/snap/images/2025/05/22/f1b0f1cbf013423683a0fd59c816ad52.jpg?w=1000" alt="패션 이미지" />
    //     <p class="user-id">user1</p>
    //     <p class="user-tags">#미니멀 #클래식</p>
    // </div>
}

// 페이지 전환 함수
function showPage(pageId) {
    // 모든 페이지 숨기기
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('page--active'));

    // 모든 네비게이션 아이템 비활성화
    const navItems = document.querySelectorAll('.header__nav-item');
    navItems.forEach(item => item.classList.remove('header__nav-item--active'));

    // 선택된 페이지 표시
    document.getElementById(pageId).classList.add('page--active');

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

function saveUserInfo() {
    const gender = document.getElementById('genderInput').value;
    const age = document.getElementById('ageInput').value;
    const height = document.getElementById('heightInput').value;
    const weight = document.getElementById('weightInput').value;
    const job = document.getElementById('jobInput').value;

    document.getElementById('userInfo').innerHTML = `${age}세 ${gender}<br>${height}cm, ${weight}kg<br>${job}`;
    closeEditModal();
}

// 즐겨찾기 필터 토글
function toggleFavoritesFilter() {
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
function getStyleRecommendation() {
    const moodInput = document.getElementById('moodInput');
    const mood = moodInput.value.trim();

    if (!mood) {
        alert('기분이나 일정을 먼저 입력해주세요.');
        return;
    }

    // 로딩 스피너 표시
    showLoading();

    // 실제 서버 연결 전이므로 예시 데이터로 시뮬레이션
    setTimeout(() => {
        const exampleRecommendation = {
            summary: '청량한 대학생 발표룩, 어깨 넓은 상체에 잘 어울리는 슬림핏 코디',
            outfit: {
                top: '블랙 컬러의 오버핏 티셔츠',
                bottom: '네이비 컬러의 슬림핏 청바지',
                shoes: '화이트 컬러의 스니커즈',
                accessories: '심플한 블랙 컬러의 소가죽 스트랩 시계, 실버 컬러의 체인 목걸이'
            }
        };

        displayRecommendation(exampleRecommendation);
        hideLoading();
    }, 2000); // 2초 후 결과 표시 (서버 응답 시뮬레이션)
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
    document.getElementById('summaryText').textContent = recommendation.summary;
    document.getElementById('topItem').textContent = recommendation.outfit.top;
    document.getElementById('bottomItem').textContent = recommendation.outfit.bottom;
    document.getElementById('shoesItem').textContent = recommendation.outfit.shoes;
    document.getElementById('accessoriesItem').textContent = recommendation.outfit.accessories;

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

function showMyDiary() {
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
    loadMyDiaries(); // 내 다이어리 목록 로드
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

function confirmDelete() {
    alert("삭제 완료되었습니다.");
    closeDeleteModal();
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
    updateModalTagUI(); // ❗ 모달 태그 UI도 업데이트해줘야 함
}

function resetAllFilters() {
    currentFilters = { gender: null, height: null, weight: null };
    appliedFilters = {};
    updateModalTagUI();
    updateMainTagUI();
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = r.value === '전체');
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[type="number"]').forEach(num => num.value = '');
}

// 검색 기능 (추가 예정)
function searchById() {
    // TODO: 서버와 연동하여 ID 검색 기능 구현
    console.log('ID 검색 기능 구현 예정');
}

// 초기화 및 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', async function () {
    // 로컬 스토리지에서 세션 정보 확인
    const sessionId = localStorage.getItem('sessionId');
    const userInfo = localStorage.getItem('userInfo');

    if (sessionId && userInfo) {
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

    // 다이어리 카드 클릭 시 수정 페이지로 이동
    document.querySelectorAll('.diary-card').forEach(card => {
        card.addEventListener('click', () => {
            showPage('edit');
        });
    });

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

    // 외부 클릭시 드롭다운 닫기
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