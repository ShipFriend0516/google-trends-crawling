# Google Trends Keywords Crawling

Google Trends에서 국가별 인기 키워드를 크롤링하는 CLI 도구입니다.

## 설치

```bash
pnpm install
```

## 사용 방법

### 기본 사용

```bash
pnpx tsx main.ts
```

### 옵션

- `--geo <geo>`: 검색 지역 (기본값: KR)
- `--range <range>`: 기간(일) (기본값: 7)
- `--category <cat>`: 카테고리 (기본값: 0, 전체 카테고리)
- `--debug`: 디버그 모드 활성화 (브라우저 창 표시)

### 예제

#### 기본 실행 (한국, 7일, headless 모드)
```bash
pnpx tsx main.ts
```

#### 미국 지역, 30일간 데이터 수집
```bash
pnpx tsx main.ts --geo US --range 30
```

#### 디버그 모드로 실행 (브라우저 창 표시)
```bash
pnpx tsx main.ts --debug
```

#### 특정 카테고리로 실행
```bash
pnpx tsx main.ts --geo KR --category 20 --range 7
```

## 출력

크롤링한 데이터는 `./data` 폴더에 다음 형식으로 저장됩니다:

```
{국가}_{카테고리}_{날짜범위}_{크롤링 진행시간}.txt
```

예시:
- `KR_0_7days_2025-11-26T03-45-12.txt`
- `US_20_30days_2025-11-26T03-50-00.txt`

## 디버그 모드

`--debug` 플래그를 사용하면:
- 브라우저 창이 직접 표시됩니다
- 크롤링 과정을 시각적으로 확인할 수 있습니다
- 문제 해결 및 테스트에 유용합니다

디버그 모드가 아닐 경우에는 headless 모드로 실행되어 백그라운드에서 작업이 수행됩니다.
