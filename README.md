# Growth AI

혁신·벤처기업 300개를 대상으로 재무, 특허, 고용, 뉴스 이벤트, 산업 데이터를 종합해 성장 가능성을 보여주는 Next.js 풀스택 MVP입니다.

## Stack

- Next.js App Router, React, TypeScript
- CSS Modules
- Pretendard, Phosphor Icons
- MySQL 8.x, `mysql2/promise`
- CSV import scripts with deterministic mock scores

## Environment

```bash
cp .env.example .env.local
```

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=growth_ai_db
USE_CSV_FALLBACK=true
```

`USE_CSV_FALLBACK=true` lets the app run from `data/source` when DB variables are not configured. Set it to `false` to require MySQL.

## Database

Create and load the schema:

```bash
mysql -u root -p < database/schema.sql
```

Import source CSVs:

```bash
npm run import:data
```

If `data/source/news_growth_event_raw.csv` exists, valid matched raw news events are imported into `growth_events` during the same command. The import is idempotent and filters out duplicate, out-of-window, unmatched, or invalid news rows.

Generate deterministic mock scores:

```bash
npm run generate:mock-scores
```

Later, place real model outputs in `data/model-output/`:

```text
growth_scores.csv
growth_score_factors.csv
```

Then import them:

```bash
npm run import:growth-scores
```

API queries prefer the latest non-mock score. If no real score exists, `mock-v1` is used.

## Development

Inspect CSV shape and keys:

```bash
npm run inspect:data
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```

## Routes

- `/` landing page with company search
- `/company/[companyId]` company growth dashboard
- `/api/companies?search=`
- `/api/companies/[companyId]`
- `/api/companies/[companyId]/dashboard`
