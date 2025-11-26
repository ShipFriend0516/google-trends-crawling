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
  const page = await browser.newPage();

  // URL 생성
  const url =
    `https://trends.google.com/trending?geo=${opts.geo}` +
    `&sort=search-volume` +
    `&hours=${Number(opts.range) * 24}` +
    `&category=${opts.category}`;
  await page.goto(url);

  // 내보내기 버튼 클릭
  await page.waitForSelector('button:has-text("내보내기")', {timeout: 10000});
  await page.click('button:has-text("내보내기")');

  // '클립보드에 복사' 버튼 클릭
  await page.waitForSelector('button:has-text("클립보드에 복사")', {timeout: 10000});
  await page.click('button:has-text("클립보드에 복사")');

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
