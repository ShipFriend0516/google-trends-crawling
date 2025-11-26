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

크롤링한 데이터는 `./data` 폴더에 CSV 파일로 저장됩니다.

### 파일명 형식
```
{국가}_{카테고리}_{날짜범위}_{날짜+시간}.csv
```

예시:
- `KR_0_7days_2025-11-26T05.csv`
- `US_20_30days_2025-11-25T14.csv`

> **중복 방지**: 동일한 파라미터로 최근 1시간 내에 수집된 데이터가 있으면 크롤링을 건너뜁니다.

### CSV 파일 포함 정보
- **Trends**: 검색 키워드
- **Search volume**: 검색량 (상대적 수치)
- **Started**: 트렌드 시작 시점
- **Trend breakdown**: 관련 주제/검색어 분석

## 사용 가능한 국가 코드

주요 국가 코드 목록:

| 국가 | 코드 |
|------|------|
| 🇰🇷 대한민국 | `KR` |
| 🇺🇸 미국 | `US` |
| 🇯🇵 일본 | `JP` |
| 🇬🇧 영국 | `GB`, `GB-ENG` (잉글랜드), `GB-SCT` (스코틀랜드), `GB-WLS` (웨일스) |
| 🇨🇳 중국 | `CN` |
| 🇩🇪 독일 | `DE` |
| 🇫🇷 프랑스 | `FR` |
| 🇪🇸 스페인 | `ES` |
| 🇮🇹 이탈리아 | `IT` |
| 🇨🇦 캐나다 | `CA` |
| 🇦🇺 호주 | `AU` |
| 🇮🇳 인도 | `IN` |
| 🇧🇷 브라질 | `BR` |
| 🇲🇽 멕시코 | `MX` |
| 🇷🇺 러시아 | `RU` |
| 🇸🇬 싱가포르 | `SG` |
| 🇹🇼 대만 | `TW` |
| 🇭🇰 홍콩 | `HK` |

> 기타 국가는 ISO 3166-1 alpha-2 코드를 사용합니다.

## 카테고리 목록

Google Trends에서 지원하는 주요 카테고리:

| 카테고리 ID | 카테고리 이름 |
|------------|------------|
| `0` | 전체 카테고리 (기본값) |
| `3` | 비즈니스 (Business) |
| `12` | 엔터테인먼트 (Entertainment) |
| `16` | 뉴스 (News) |
| `17` | 과학 기술 (Science & Tech) |
| `18` | 스포츠 (Sports) |
| `20` | 미용 & 패션 (Beauty & Fitness) |
| `22` | 금융 (Finance) |
| `45` | 게임 (Games) |
| `66` | 건강 (Health) |
| `71` | 쇼핑 (Shopping) |
| `108` | 여행 (Travel) |

> 기타 세부 카테고리는 Google Trends 웹사이트에서 확인하실 수 있습니다.

## 디버그 모드

`--debug` 플래그를 사용하면:
- 브라우저 창이 직접 표시됩니다
- 크롤링 과정을 시각적으로 확인할 수 있습니다
- 문제 해결 및 테스트에 유용합니다

디버그 모드가 아닐 경우에는 headless 모드로 실행되어 백그라운드에서 작업이 수행됩니다.
