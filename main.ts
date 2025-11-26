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
  const browser = await chromium.launch({
    headless: !opts.debug
  });

  // 클립보드 권한을 가진 context 생성
  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write']
  });

  const page = await context.newPage();

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

  // '클립보드에 복사' 메뉴 항목 클릭 (다국어 대응)
  const copyMenuItem = page.locator('[role="menuitem"][aria-label="클립보드에 복사"], [role="menuitem"][aria-label="Copy to clipboard"]').last();
  await copyMenuItem.waitFor({ state: 'attached', timeout: 10000 });
  await copyMenuItem.click({ force: true });

  // 클립보드에서 데이터 가져오기
  // (Playwright context에서만 clipboard API 사용 가능)
  const clipboardText = await page.evaluate(() =>
    navigator.clipboard.readText()
  );

  // 데이터 디렉토리 생성
  const dataDir = './data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 파일명 생성: {국가}_{카테고리}_{날짜범위}_{크롤링 진행시간}.txt
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `${opts.geo}_${opts.category}_${opts.range}days_${timestamp}.txt`;
  const filepath = path.join(dataDir, filename);

  // 파일에 저장
  fs.writeFileSync(filepath, clipboardText, 'utf-8');
  console.log(`✔ 인기 검색어를 ${filepath}에 저장 완료!`);

  await browser.close();
}

run();
