# MNO Chapter Reports Toolkit (CLI)

![Node](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FBitwise-Forge%2Fmno-toolbox%2Frefs%2Fheads%2Fmain%2Fpackage.json&label=Node&query=%24.engines.node&logo=node.js&logoColor=white&color=339933&cacheSeconds=300)
![pnpm](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FBitwise-Forge%2Fmno-toolbox%2Frefs%2Fheads%2Fmain%2Fpackage.json&label=pnpm&query=%24.packageManager&logo=pnpm&logoColor=white&color=ffd34e&cacheSeconds=300)
![TypeScript](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FBitwise-Forge%2Fmno-toolbox%2Frefs%2Fheads%2Fmain%2Fpackage.json&label=TypeScript&query=%24.devDependencies.typescript&logo=typescript&logoColor=white&color=3178C6&cacheSeconds=300)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)

## Overview

MNO (Music Network One) is a referral-focused networking organization made up of business professionals and musicians. Members meet weekly — via Zoom or in person — to pass referrals, stay visible, and support one another by “Playing It Forward”. This philosophy means promoting others without expecting anything in return, primarily through online visibility and real-world referrals.

MNO members are expected to remain top-of-mind by showing up weekly in meetings and posting three times per week on social media. These posts are distributed through the MNO Member App and published to whichever social media platforms the member has specified in their Feature Link (FL) preferences.

This toolkit automates the chapter performance chair reports that get sent out at various times throughout the week.

---

## Table of contents

- [Overview](#overview)
- [What this tool does](#what-this-tool-does)
- [How it works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running reports](#running-reports)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Operational notes](#operational-notes)
- [Troubleshooting](#troubleshooting)
- [Project structure (high level)](#project-structure-high-level)
- [Extending with new reports](#extending-with-new-reports)
- [Security](#security)

---

## What this tool does

- Logs into the MNO portal with your credentials
- Scrapes report pages using a headless browser
- Parses HTML into strongly-typed data
- Generates clean, paste-ready report outputs to stdout

Current reports:

- **Chapter Performance Report**
  - Members (totals, zero/low activity, lists)
  - Social media (total posts, averages, rounds)
  - Sessions (type breakdowns, submitted-by details)
  - Events (type breakdowns, submitted-by details)
  - Referrals and Business Bucks
- **Weekly Checklist Report**
  - Member checklists within a date range

---

## How it works

- **Puppeteer** launches a single shared browser with a persistent profile under `.session/chrome-profile`.
  - A single login happens once per run (guarded by a shared promise); each processor gets its own tab (Page) in parallel.
- **Cheerio** parses HTML tables into typed objects.
- Each report has a dedicated processor; generators render the final report text to stdout.

---

## Prerequisites

- Node 20+
- pnpm
- An MNO account with access to the report pages

---

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy the example environment file and fill in your values (recommended):

```bash
cp .env.example .env
# then edit .env
```

---

## Running reports

- Chapter performance:

```bash
pnpm gen-chapter-report
```

- Weekly checklist (uses `REPORT_START_DATE`/`REPORT_END_DATE`):

```bash
pnpm gen-checklist-report
```

---

## Testing

This project includes comprehensive testing with [**Vitest**](https://vitest.dev/):

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode (development)
pnpm test:watch
```

---

## Code Quality

This project maintains high code quality through automated tools:

### **ESLint + Prettier**

- **ESLint v9** with flat config for modern JavaScript/TypeScript
- **Prettier** for consistent code formatting
- **Import sorting** and destructuring rules
- **TypeScript-specific** linting rules

### **Husky Git Hooks**

- **Pre-commit hooks** automatically run formatting and linting
  - **Ensures code quality** before commits
  - **Consistent code style** across the project
- **Pre-push hook** runs tests
  - **Ensures tests pass** before pushing

### **Available Scripts**

```bash
# Format code
pnpm format

# Lint and auto-fix
pnpm lint

# Clean dependencies and session data
pnpm clean
```

---

## Operational notes

- A single Chromium instance is launched per run and shared across processors; session persists in `.session/chrome-profile/`.
- Processors run in parallel using separate tabs; login occurs once and is reused.
- The tool waits for pages to reach network idle before scraping for stability.
- Keep runs reasonable to avoid hammering the MNO site; prefer `PUPPETEER_HEADLESS_MODE=true`.

---

## Troubleshooting

- **Login failed or timed out**
  - Verify `.env` credentials and all URLs/paths
  - Remove the `.session/chrome-profile/` directory to reset the browser session
- **Report table not found**
  - The MNO page structure may have changed; update selectors in the corresponding processor
- **Date input issues (weekly checklist)**
  - Ensure dates are valid and parseable (e.g., `YYYY-MM-DD`)

---

## Project structure (high level)

- `src/index.ts` — CLI entrypoint and report routing
- `src/interfaces/` — Strongly-typed data contracts
- `src/lib/Scraper.ts` — Shared browser/session/auth management
- `src/lib/processors/*.ts` — Report processors for each report type
- `src/lib/reportGenerators/*.ts` — Report generators for each report type (text output)
- `src/utils/` — Utility functions (number formatting, string processing, etc.)
- `tests/` — Comprehensive test suite

---

## Extending with new reports

1. Add a processor under `src/lib/processors/YourNewProcessor.ts` using the established pattern:
   - `init()` → `parse()` → optional validate/aggregate → typed getter
2. Add a report generator in `src/lib/reportGenerators/YourReportGenerator.ts`.
3. Wire it up in `src/index.ts` and add a script in `package.json`:

```json
{
  "scripts": {
    "gen-new-report": "tsx --env-file=./.env -r dotenv/config src/index.ts yourReportType"
  }
}
```

4. **Add tests** for your new functionality in the `tests/` directory

---

## Security

- Credentials live only in your local `.env` and never leave your machine.
- Everything runs locally; nothing is deployed or shared.
- Avoid committing `.env` or `.session` data to version control.

### License

This project is licensed under the MIT License. See `LICENSE` for details.
