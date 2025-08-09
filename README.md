# MNO Chapter Reports Toolkit (CLI)

![Node](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FBitwise-Forge%2Fmno-toolbox%2Frefs%2Fheads%2Fmain%2Fpackage.json&label=Node&query=%24.engines.node&logo=node.js&logoColor=white&color=339933&cacheSeconds=300)
![pnpm](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FBitwise-Forge%2Fmno-toolbox%2Frefs%2Fheads%2Fmain%2Fpackage.json&label=pnpm&query=%24.packageManager&logo=pnpm&logoColor=white&color=ffd34e&cacheSeconds=300)
![TypeScript](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FBitwise-Forge%2Fmno-toolbox%2Frefs%2Fheads%2Fmain%2Fpackage.json&label=TypeScript&query=%24.devDependencies.typescript&logo=typescript&logoColor=white&color=3178C6&cacheSeconds=300)

## Overview

MNO (Music Network One) is a referral-focused networking organization made up of business professionals and musicians. Members meet weekly — via Zoom or in person — to pass referrals, stay visible, and support one another by “Playing It Forward”. This philosophy means promoting others without expecting anything in return, primarily through online visibility and real-world referrals.

MNO members are expected to remain top-of-mind by showing up weekly in meetings and posting three times per week on social media. These posts are distributed through the MNO Member App and published to Facebook.

This toolkit automates the chapter performance chair reports that get sent out at various times throughout the week.

---

## Table of contents

- [Overview](#overview)
- [What this tool does](#what-this-tool-does)
- [How it works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running reports](#running-reports)
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
- **TypeScript** interfaces ensure consistent output shapes.
- Each report has a dedicated processor; generators render the final report text.

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

Or create a `.env` file in the project root with:

```bash
# General
NODE_ENV=development
REPORT_START_DATE=yyyy/mm/dd
REPORT_END_DATE=yyyy/mm/dd

# Puppeteer
PUPPETEER_HEADLESS_MODE=true

# MNO Web App Credentials
MNO_USERNAME=you@example.com
MNO_PASSWORD=yourpassword

# MNO Web App Routes
MNO_BASE_URL=https://example.mnoapp.com
MNO_DASHBOARD_PATH=dashboard
MNO_EVENT_REPORT_PATH=reports/events
MNO_LOGIN_PATH=auth/login
MNO_SESSION_REPORT_PATH=reports/sessions
MNO_SM_REPORT_PATH=reports/social-media
MNO_WEEKLY_CHECKLIST_PATH=reports/weekly-checklist
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

- `src/lib/Scraper.ts` — Shared browser/session management and auth (persistent profile, single-login)
- `src/lib/processors/MemberDataProcessor.ts` — Social media/member activity parsing
- `src/lib/processors/SessionDataProcessor.ts` — Session report parsing
- `src/lib/processors/EventDataProcessor.ts` — Events report parsing
- `src/lib/processors/WeeklyChecklistProcessor.ts` — Weekly checklist scraping/parsing
- `src/lib/reportGenerators/ChapterReportGenerator.ts` — Chapter performance text output
- `src/lib/reportGenerators/ChecklistReportGenerator.ts` — Weekly checklist text output
- `src/index.ts` — CLI entrypoint and report routing
- `src/interfaces/` — Strongly-typed data contracts

---

## Extending with new reports

1. Add a processor under `src/lib/processors/YourNewProcessor.ts` using the established pattern:
   - `init()` → `parse()` → optional validate/aggregate → typed getter
2. (Optional) Add a report generator in `src/lib/reportGenerators/YourReportGenerator.ts`.
3. Wire it up in `src/index.ts` and add a script in `package.json`:

```json
{
  "scripts": {
    "gen-new-report": "tsx --env-file=./.env -r dotenv/config src/index.ts new"
  }
}
```

---

## Security

- Credentials live only in your local `.env` and never leave your machine.
- Everything runs locally; nothing is deployed or shared.
- Avoid committing `.env` or `.session` data to version control.

### License

This project is licensed under the MIT License. See `LICENSE` for details.
