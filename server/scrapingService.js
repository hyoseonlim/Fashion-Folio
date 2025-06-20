const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// 스크래핑할 URL 목록
const TARGET_URLS = [
    { name: 'all', url: 'https://www.musinsa.com/snap/main/recommend' },
    { name: 'men', url: 'https://www.musinsa.com/snap/main/recommend?genders=MEN' },
    { name: 'women', url: 'https://www.musinsa.com/snap/main/recommend?genders=WOMEN' },
];

async function scrapeMusinsaPage(page, url) {
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        try {
            await page.waitForSelector('div[data-testid="virtuoso-item-list"]', { timeout: 10000 });
        } catch (error) {
            console.log('선택자를 찾는 중 시간 초과. 계속 진행합니다.');
        }

        await page.evaluate(() => {
            window.scrollBy(0, 500);
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const results = await page.evaluate(() => {
            const virtualList = document.querySelector('div[data-testid="virtuoso-item-list"]');
            if (!virtualList) return [];

            const divBList = Array.from(virtualList.children).slice(0, 4);
            const trends = [];

            divBList.forEach((divB) => {
                const divCList = Array.from(divB.children);

                divCList.forEach((divC) => {
                    const imgTag = divC.querySelector('div a div img');
                    const aTag = divC.querySelector('div a');

                    if (imgTag && imgTag.src && aTag && aTag.href) {
                        trends.push({
                            imageUrl: imgTag.src,
                            linkUrl: aTag.href
                        });
                    }
                });
            });

            return trends;
        });

        return results;
    } catch (error) {
        console.error(`페이지 스크래핑 오류 (${url}):`, error.message);
        return [];
    }
}

async function scrapeMusinsa() {
    console.log('무신사 스냅 스크래핑 시작...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const categorizedTrends = {}; // 카테고리별로 분리

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        for (const target of TARGET_URLS) {
            console.log(`${target.name} 스크래핑 중...`);
            const results = await scrapeMusinsaPage(page, target.url);

            // 카테고리별로 저장
            categorizedTrends[target.name] = results.map(item => ({
                ...item,
                category: target.name
            }));

            console.log(`${target.name}: ${results.length}개 아이템 수집 완료`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 카테고리별로 분리된 형태로 저장
        const dataDir = path.join(__dirname, 'data');
        const dataPath = path.join(dataDir, 'trends.json');
        await fs.writeFile(dataPath, JSON.stringify({
            all: categorizedTrends.all || [],
            men: categorizedTrends.men || [],
            women: categorizedTrends.women || [],
            lastUpdated: new Date().toISOString()
        }, null, 2));

        return categorizedTrends;
    } catch (error) {
        console.error('스크래핑 오류:', error.message);
        return {};
    } finally {
        await browser.close();
    }
}

module.exports = {
    scrapeMusinsa
};