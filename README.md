# For Hearing Schedule Dashboard

A Next.js dashboard for the **For Hearing Schedule** Google Sheet.

## Features
- Server-side Google Sheets API integration for five tabs
- 60-second cache/revalidation for automatic updates without redeploys
- Manual refresh endpoint and dashboard refresh button
- On-demand revalidation endpoint for Google Apps Script
- Overview metrics, schedule, centre-wise, date-wise, entries, and raw-data views
- Search, centre/date filters, CSV export, responsive layout, dark mode

## Google Sheet

Sheet ID:
`1KRfUfvw0JmbNBolkVDHyevutOv8nd3JYPgngT5xchFI`

Expected tabs:
- Rough Data
- For Hearing Entry
- Centre Wise Report
- Hearing Schedule Report
- Date wise Report

## Environment variables

Create `.env.local` locally or add these to Vercel:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_SHEET_ID=1KRfUfvw0JmbNBolkVDHyevutOv8nd3JYPgngT5xchFI
REVALIDATE_SECRET=choose-a-long-random-secret
```

## Google Cloud setup

1. Create a Google Cloud project.
2. Enable **Google Sheets API**.
3. Create a service account.
4. Create/download a JSON key.
5. Share the Google Sheet with the service account email as **Viewer**.
6. Put the service-account email and private key into Vercel environment variables.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

Import this GitHub repository into Vercel and add the environment variables above. Every push to `main` deploys automatically.

## Instant updates from Google Sheets

The app uses a 60-second server cache/revalidation. For near-instant updates, add a Google Apps Script installable `onEdit` trigger that calls:

```text
https://YOUR-VERCEL-DOMAIN/api/revalidate?secret=YOUR_REVALIDATE_SECRET
```

The endpoint revalidates the dashboard data tags.

## Data shape

The dashboard intentionally reads each tab as a generic header/value table so it can work before all production column names are finalized. The UI performs best-effort detection of common date, centre, status, and count fields.

Once exact production column names are known, update `lib/normalize.ts` to make the derived metrics deterministic.
