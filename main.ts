// trends-crawler.ts
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const program = new Command();

program
  .name('google-trends-crawler')
  .description('Google Trends 인기 키워드 크롤링 도구')
  .version('1.0.0')
  .requiredOption('--geo <geo>', '검색 지역 (필수)')
  .option('--range <range>', '기간(일)', '7')
  .option('--category <cat>', '카테고리', '0')
  .option('--debug', '디버그 모드 (브라우저 창 표시)', false)
  .addHelpText('after', `

📍 사용 가능한 국가 코드:
  all 모든 주요 국가 (아래 18개국)

  KR  🇰🇷 대한민국        US  🇺🇸 미국           JP  🇯🇵 일본
  GB  🇬🇧 영국           CN  🇨🇳 중국           DE  🇩🇪 독일
  FR  🇫🇷 프랑스         ES  🇪🇸 스페인         IT  🇮🇹 이탈리아
  CA  🇨🇦 캐나다         AU  🇦🇺 호주           IN  🇮🇳 인도
  BR  🇧🇷 브라질         MX  🇲🇽 멕시코         RU  🇷🇺 러시아
  SG  🇸🇬 싱가포르       TW  🇹🇼 대만           HK  🇭🇰 홍콩

  기타: ISO 3166-1 alpha-2 코드 사용 (예: GB-ENG, GB-SCT)

📊 카테고리 ID:
  0   전체 카테고리 (기본값)    3   비즈니스
  12  엔터테인먼트              16  뉴스
  17  과학 기술                 18  스포츠
  20  미용 & 패션               22  금융
  45  게임                      66  건강
  71  쇼핑                      108 여행

예시:
  $ pnpx tsx main.ts --geo KR
  $ pnpx tsx main.ts --geo US --category 18 --range 30
  $ pnpx tsx main.ts --geo JP --category 12 --debug
  $ pnpx tsx main.ts --geo all                    (모든 주요 국가 크롤링)
  $ pnpx tsx main.ts --geo all --category 18      (모든 국가의 스포츠 카테고리)
`);

program.parse(process.argv);
const opts = program.opts();

// 주요 국가 코드 목록
const ALL_COUNTRIES = [
  'KR', 'US', 'JP', 'GB', 'CN', 'DE', 'FR', 'ES', 'IT',
  'CA', 'AU', 'IN', 'BR', 'MX', 'RU', 'SG', 'TW', 'HK'
];

async function crawlSingleCountry(geo: string, category: string, range: string, debug: boolean) {
  console.log('🚀 Preparing crawling...');

  // 데이터 디렉토리 경로
  const dataDir = './data';

  // 최근 1시간 이내 동일 파라미터 파일 체크
  if (fs.existsSync(dataDir)) {
    const now = new Date();
    const currentHour = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH

    const existingFile = `${geo}_${category}_${range}days_${currentHour}.csv`;
    const existingPath = path.join(dataDir, existingFile);

    if (fs.existsSync(existingPath)) {
      console.log('⚠️  Recent data already exists!');
      console.log(`📁 File: ${existingPath}`);
      console.log('ℹ️  Data was collected within the last hour. Skipping crawl.');
      return;
    }
  }

  console.log(`🌍 Researching trends in ${geo}...`);
  console.log(`📊 Category: ${category} | Period: ${range} days`);

  const browser = await chromium.launch({
    headless: !debug
  });

  // 다운로드를 허용하는 context 생성
  const context = await browser.newContext({
    acceptDownloads: true
  });

  const page = await context.newPage();

  console.log('🔍 Navigating to Google Trends...');

  // URL 생성
  const url =
    `https://trends.google.com/trending?geo=${geo}` +
    `&sort=search-volume` +
    `&hours=${Number(range) * 24}` +
    `&category=${category}`;

  // 페이지 로딩 대기
  await page.goto(url, { waitUntil: 'networkidle' });

  // 페이지가 완전히 렌더링될 때까지 추가 대기
  await page.waitForTimeout(3000);

  // 쿠키 배너가 있으면 처리
  try {
    const cookieButton = page.locator('button:has-text("Got it"), button:has-text("확인")').first();
    await cookieButton.click({ timeout: 2000 });
    await page.waitForTimeout(500);
  } catch (e) {
    // 쿠키 배너가 없으면 무시
  }

  console.log('📤 Exporting data...');

  // 내보내기 버튼 클릭 (다국어 대응)
  // 페이지 맨 위로 스크롤
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // "ios_share" 아이콘이 있고 "Export" 또는 "내보내기" 텍스트가 포함된 버튼 찾기
  const exportButton = page.locator('button:has-text("Export"), button:has-text("내보내기")').filter({ hasText: /Export|내보내기/ }).first();
  await exportButton.waitFor({ state: 'visible', timeout: 20000 });
  await exportButton.click();

  // 드롭다운 메뉴가 나타날 때까지 대기
  await page.waitForTimeout(2000);

  console.log('⬇️  Downloading CSV file...');

  // 'CSV 다운로드' 메뉴 항목 클릭 (다국어 대응)
  const csvMenuItem = page.locator('[role="menuitem"][aria-label="CSV 다운로드"], [role="menuitem"][aria-label="Download CSV"]').last();
  await csvMenuItem.waitFor({ state: 'attached', timeout: 10000 });

  // 다운로드 이벤트 리스너 설정
  const downloadPromise = page.waitForEvent('download');
  await csvMenuItem.click({ force: true });

  // 다운로드 완료 대기
  const download = await downloadPromise;

  // 데이터 디렉토리 생성
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 파일명 생성: {국가}_{카테고리}_{날짜범위}_{날짜+시간}.csv
  const timestamp = new Date().toISOString().slice(0, 13).replace('T', 'T'); // YYYY-MM-DDTHH
  const filename = `${geo}_${category}_${range}days_${timestamp}.csv`;
  const filepath = path.join(dataDir, filename);

  // CSV 파일 저장
  await download.saveAs(filepath);
  console.log('💾 Saving data...');
  console.log(`✅ Successfully saved to: ${filepath}`);

  await browser.close();
}

async function run() {
  const { geo, category, range, debug } = opts;

  // --geo all 옵션 처리
  if (geo.toLowerCase() === 'all') {
    console.log('🌐 Starting crawl for all major countries...');
    console.log(`📊 Total countries to process: ${ALL_COUNTRIES.length}`);
    console.log('');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < ALL_COUNTRIES.length; i++) {
      const countryGeo = ALL_COUNTRIES[i];
      console.log(`\n[${ i + 1}/${ALL_COUNTRIES.length}] Processing ${countryGeo}...`);
      console.log('─'.repeat(50));

      try {
        await crawlSingleCountry(countryGeo, category, range, debug);
        successCount++;
      } catch (error) {
        console.error(`❌ Error crawling ${countryGeo}:`, error);
        errorCount++;
      }

      // 다음 크롤링 전 대기 (rate limiting 방지)
      if (i < ALL_COUNTRIES.length - 1) {
        console.log('⏳ Waiting 3 seconds before next country...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Crawling Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📁 Total: ${ALL_COUNTRIES.length}`);
    console.log('='.repeat(50));
  } else {
    // 단일 국가 크롤링
    await crawlSingleCountry(geo, category, range, debug);
  }
}

run();
