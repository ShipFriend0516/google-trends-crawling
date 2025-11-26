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
3. **Data extraction**: Navigates to Google Trends, clicks "Export" → "Copy to clipboard" buttons
4. **Data persistence**: Saves clipboard content to `./data/` directory

### Output file naming
Files are saved as: `{geo}_{category}_{range}days_{timestamp}.txt`
- Example: `KR_0_7days_2025-11-26T03-45-12.txt`
- The `./data` directory is created automatically if it doesn't exist

### Browser automation flow
The tool uses Playwright's text selector strategy:
- `button:has-text("내보내기")` - Export button (Korean UI)
- `button:has-text("클립보드에 복사")` - Copy to clipboard button
- Uses `navigator.clipboard.readText()` to retrieve copied data

## Package Manager

This project uses **pnpm** (version 10.17.0) as specified in package.json. Always use `pnpm` or `pnpx` commands, not npm or npx.
