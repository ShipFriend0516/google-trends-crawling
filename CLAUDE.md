# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CLI tool for crawling trending keywords from Google Trends by country using Playwright for browser automation.

## Development Commands

### Installation
```bash
pnpm install
```

### Running the crawler
```bash
# Basic usage (headless mode, KR region, 7 days)
pnpx tsx main.ts

# With debug mode (shows browser window)
pnpx tsx main.ts --debug

# Custom parameters
pnpx tsx main.ts --geo US --range 30 --category 20
```

### CLI Options
- `--geo <geo>`: Region code (default: KR)
- `--range <range>`: Number of days (default: 7)
- `--category <cat>`: Category ID (default: 0 for all categories)
- `--debug`: Enable debug mode (shows browser window instead of headless)

## Architecture

### Single-file CLI tool
The entire application is contained in [main.ts](main.ts) with a straightforward flow:

1. **CLI parsing**: Uses Commander.js to parse command-line arguments
2. **Browser automation**: Launches Playwright Chromium browser
   - Headless mode by default
   - Visible browser window in debug mode (`--debug` flag)
3. **Data extraction**: Navigates to Google Trends, clicks "Export" → "CSV 다운로드" buttons
4. **Data persistence**: Downloads CSV file to `./data/` directory with structured naming

### Output file naming
Files are saved as: `{geo}_{category}_{range}days_{date+hour}.csv`
- Example: `KR_0_7days_2025-11-26T05.csv`
- Timestamp format: `YYYY-MM-DDTHH` (date + hour only)
- The `./data` directory is created automatically if it doesn't exist
- **Duplicate prevention**: Skips crawling if data with the same parameters was collected within the last hour

### CSV file contents
The downloaded CSV includes:
- **Trends**: Search keywords
- **Search volume**: Relative search volume
- **Started**: When the trend started
- **Trend breakdown**: Related topics and queries

### Browser automation flow
The tool uses Playwright for browser automation with informative CLI logging:

1. **Preparation**: Checks for recent duplicate data
2. **Navigation**: Navigates to Google Trends with specified parameters
3. **Export**: Clicks Export button (multilingual support: "Export" / "내보내기")
4. **Download**: Clicks "CSV 다운로드" / "Download CSV" from dropdown menu
5. **Save**: Waits for download completion and saves with formatted filename

**CLI Output Example**:
```
🚀 Preparing crawling...
🌍 Researching trends in KR...
📊 Category: 18 | Period: 7 days
🔍 Navigating to Google Trends...
📤 Exporting data...
⬇️  Downloading CSV file...
💾 Saving data...
✅ Successfully saved to: data/KR_18_7days_2025-11-26T05.csv
```

## Package Manager

This project uses **pnpm** (version 10.17.0) as specified in package.json. Always use `pnpm` or `pnpx` commands, not npm or npx.
