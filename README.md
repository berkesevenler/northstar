<p align="center">
  <img src="public/logo.png" alt="Northstar" width="96" />
</p>

<h1 align="center">Northstar</h1>

<p align="center">
  A self-hosted, no-login startup metrics dashboard. <br/>
  Track <b>MRR</b>, <b>ARR</b>, customers, projects, and targets — all stored in your own Google Sheet.
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#license">License</a>
</p>

---

## Why

Most startup-tracking tools either lock you in, want a login, or are overkill for a small team that just needs to see _are we growing?_ at a glance.

Northstar takes the opposite approach:

- **No login.** Open it and use it. No accounts, no sessions, no SaaS bill.
- **Your data, your sheet.** Everything is stored in a Google Sheet you own. Open it, edit it, export it, share it with your accountant — it's just a spreadsheet.
- **Practical.** Designed for a founder/operator who wants to glance at the numbers that matter.

## Features

- **Dashboard** with KPI cards (MRR, ARR, total revenue, active projects), MRR trend chart, monthly revenue chart, and live target progress.
- **Projects** — name, status (planning / active / on-hold / completed), linked customer, dates, budget. Filter by status.
- **Customers** — billing cycle (monthly / yearly / one-time), monthly value, status (lead / active / churned). MRR & ARR are computed automatically from active customers.
- **Revenue** — log every transaction (subscription, one-time, service, other) with optional links to a customer or project. See this-month / this-year / all-time totals plus a 12-month chart.
- **Targets** — set goals on any metric (MRR, ARR, active customers, active projects, total revenue) with a due date. Progress bars and "days left" update live.
- **Sample data** button to seed a realistic dataset so you can try things instantly.
- **Auto-init** — the app creates the four needed sheet tabs with the right headers on first request. You don't have to set up the spreadsheet manually.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zustand](https://github.com/pmndrs/zustand) for client state
- [Recharts](https://recharts.org/) for the charts
- [lucide-react](https://lucide.dev/) for icons
- [googleapis](https://github.com/googleapis/google-api-nodejs-client) for the Sheets backend

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/northstar.git
cd northstar
npm install
```

### 2. Create a Google service account

1. Go to <https://console.cloud.google.com/> and create (or pick) a project.
2. **APIs & Services → Library** → enable the **Google Sheets API**.
3. **IAM & Admin → Service Accounts** → **Create service account**. Give it any name.
4. Open the service account → **Keys** → **Add key → Create new key** → **JSON**. A JSON file downloads.
5. From that JSON, copy `client_email` and `private_key`.

### 3. Create the spreadsheet

1. Create a new Google Sheet. Copy the long ID from the URL: `https://docs.google.com/spreadsheets/d/THIS_PART/edit`.
2. Click **Share**, paste the service account's `client_email`, set role to **Editor**, click **Share**. (You can ignore the "no email" warning — it's a service account.)

### 4. Configure environment variables

Create `.env.local` in the project root:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-bot@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=the-id-from-step-3
```

> Keep the surrounding double quotes and the literal `\n` characters in the private key — that's how Next.js reads multi-line env values. Northstar converts them back to real newlines at runtime.

See `.env.example` for a template.

### 5. Run it

```bash
npm run dev
```

Open <http://localhost:3000>. On first load Northstar will create the `projects`, `customers`, `revenue`, and `targets` tabs in your sheet with the right headers. Click **Load sample data** on the dashboard if you want a populated demo to play with, or just start adding your own.

## How it works

Each entity type is one tab in the spreadsheet:

| Tab         | Primary key | Notes                                     |
|-------------|-------------|-------------------------------------------|
| `projects`  | `id`        | One project per row                       |
| `customers` | `id`        | MRR/ARR computed from `status = active`   |
| `revenue`   | `id`        | One revenue entry per row                 |
| `targets`   | `id`        | Goals on any computed metric              |

Row 1 of each tab holds the column headers; subsequent rows are records. The `id` column (column A) is used as the primary key for updates and deletes.

All reads/writes happen in Next.js API routes (`/api/data`, `/api/projects/[id]`, etc.) authenticated via JWT using your service account. The browser never sees the credentials.

```
src/
├── app/
│   ├── api/                      # Next.js route handlers (Sheets I/O)
│   ├── page.tsx                  # Dashboard
│   ├── projects/page.tsx
│   ├── customers/page.tsx
│   ├── revenue/page.tsx
│   └── targets/page.tsx
├── components/                   # Sidebar, KPI cards, modal, etc.
└── lib/
    ├── types.ts                  # Entity types
    ├── sheets.ts                 # Authenticated Google Sheets client (CRUD + auto-init)
    ├── schemas.ts                # Row <-> object mapping for each entity
    ├── api-helpers.ts            # Shared list/create/update/delete handlers
    ├── store.ts                  # Zustand client cache + API calls
    └── metrics.ts                # MRR/ARR/series calculations
```

## Currency formatting

By default numbers are formatted in euro using German formatting (`10.000 €`). To change locale or currency, edit the two formatters in `src/lib/metrics.ts`:

```ts
export const currency = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n || 0);
```

## Deployment

Northstar is a plain Next.js app — deploy it like any other.

### Vercel

1. Push the repo to GitHub.
2. Import into Vercel.
3. Add the three env vars (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`) in **Project Settings → Environment Variables**. For the private key, paste it exactly as in your `.env.local` (with the `\n` literals).
4. Deploy.

### Self-host

```bash
npm run build
npm run start
```

Behind a reverse proxy / cloud host of your choice.

> **Reminder:** there is no auth in Northstar. If you put it on the public internet, put it behind a reverse proxy with HTTP Basic Auth, a VPN, Cloudflare Access, or similar — otherwise anyone with the URL can edit your sheet.

## Security

- Credentials live only in environment variables. They are read server-side and never sent to the browser.
- `.env*.local` is gitignored. **Never** commit your private key.
- If you ever leak a service-account key, **rotate it immediately**: Google Cloud Console → IAM & Admin → Service Accounts → Keys → delete the leaked key → create a new one → update `.env.local`.

## Roadmap / ideas

PRs welcome.

- [ ] Optional simple password protection (one shared secret)
- [ ] Per-customer revenue view
- [ ] CSV export
- [ ] Cohort retention chart
- [ ] Dark mode
- [ ] Multi-currency support

## License

MIT. See [LICENSE](./LICENSE).
