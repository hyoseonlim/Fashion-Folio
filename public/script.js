const API_BASE_URL = 'http://localhost:3000/api';

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
        const response = await fetch(`${API_BASE_URL}/trends`);
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
    for (const trend of trends) {
        let trendTag = document.createElement('div');
        trendTag.className = 'item-card';
        let trendImg = document.createElement('img');
        trendImg.src = trend.imageUrl;
        let heartIcon = document.createElement('div');
        heartIcon.className = 'heart-icon'
        trendTag.append(trendImg, heartIcon);
        document.getElementById('trends').appendChild(trendTag);
        // TODO: 위시리스트 추가 기능, 바로가기 기능 (trend.linkUrl을 href로)
    }
    // <div class="item-card" onclick="toggleHeart(this)">
    //     <img src="https://image.msscdn.net/thumbnails/snap/images/2025/05/22/f1b0f1cbf013423683a0fd59c816ad52.jpg?w=1000" />
    //     <div class="heart-icon"></div>
    // </div>
    document.getElementById('trends').appendChild(trendTag);
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

// 하트 아이콘 토글
function toggleHeart(card) {
    const heart = card.querySelector('.item-card__heart');
    heart.classList.toggle('item-card__heart--liked');
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
    } else if (id.startsWith('style-')) {
        const val = id.replace('style-', '');
        appliedFilters.styles = appliedFilters.styles.filter(s => s !== val);
        currentFilters.styles = currentFilters.styles.filter(s => s !== val);
        document.querySelector(`#content-style input[value="${val}"]`).checked = false;
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
    currentFilters = { gender: null, styles: [], height: null, weight: null };
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

// 인증 관련 함수들 (추가 예정)
function handleLogin() {
    // TODO: 로그인 처리
    console.log('로그인 처리 예정');
}

function handleRegister() {
    // TODO: 회원가입 처리
    console.log('회원가입 처리 예정');
}

function checkDuplicateId() {
    // TODO: 아이디 중복 확인
    console.log('아이디 중복 확인 예정');
}

// 초기화 및 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function () {
    // 기본 페이지 표시
    showPage('trend');

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
        const userSection = document.querySelector('.header__user-section');
        const dropdown = document.querySelector('.header__user-dropdown');

        if (dropdown && userSection && !userSection.contains(event.target)) {
            dropdown.classList.remove('header__user-dropdown--active');
        }
    });
});