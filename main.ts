// trends-crawler.ts
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const program = new Command();

program
  .option('--geo <geo>', '검색 지역', 'KR')            // Default: 한국
  .option('--range <range>', '기간(일)', '7')           // Default: 7일
  .option('--category <cat>', '카테고리', '0')          // Default: 전체 카테고리
  .option('--debug', '디버그 모드 (브라우저 창 표시)', false);

program.parse(process.argv);
const opts = program.opts();

async function run() {
  console.log('🚀 Preparing crawling...');

  // 데이터 디렉토리 경로
  const dataDir = './data';

  // 최근 1시간 이내 동일 파라미터 파일 체크
  if (fs.existsSync(dataDir)) {
    const now = new Date();
    const currentHour = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH

    const existingFile = `${opts.geo}_${opts.category}_${opts.range}days_${currentHour}.csv`;
    const existingPath = path.join(dataDir, existingFile);

    if (fs.existsSync(existingPath)) {
      console.log('⚠️  Recent data already exists!');
      console.log(`📁 File: ${existingPath}`);
      console.log('ℹ️  Data was collected within the last hour. Skipping crawl.');
      return;
    }
  }

  console.log(`🌍 Researching trends in ${opts.geo}...`);
  console.log(`📊 Category: ${opts.category} | Period: ${opts.range} days`);

  const browser = await chromium.launch({
    headless: !opts.debug
  });

  // 다운로드를 허용하는 context 생성
  const context = await browser.newContext({
    acceptDownloads: true
  });

  const page = await context.newPage();

  console.log('🔍 Navigating to Google Trends...');

  // URL 생성
  const url =
    `https://trends.google.com/trending?geo=${opts.geo}` +
    `&sort=search-volume` +
    `&hours=${Number(opts.range) * 24}` +
    `&category=${opts.category}`;

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
  const filename = `${opts.geo}_${opts.category}_${opts.range}days_${timestamp}.csv`;
  const filepath = path.join(dataDir, filename);

  // CSV 파일 저장
  await download.saveAs(filepath);
  console.log('💾 Saving data...');
  console.log(`✅ Successfully saved to: ${filepath}`);

  await browser.close();
}

run();
