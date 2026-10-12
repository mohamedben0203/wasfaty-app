# Wasfati App

Mobile-first web app where Wasfaty customers log in and see their body scan results, their
credit balance and credit history, and their profile (age and health goals, both editable).
It uses the same accounts as the kiosk (`wasfati-portal`): phone number + password, with an
SMS code to sign up or reset a password. Bilingual (العربية / English), Arabic by default.

## How it fits with the other repos

```
wasfati_app (this repo)
  ├── Supabase Auth + RPCs   same project and flow as wasfati-portal
  ├── Supabase `exams`        lists the logged-in user's scans
  ├── Supabase credits        balance from `users.credits`, history from `credit_transactions`
  └── health service          each result opens its PDF at /exam/<exam_no>/<lang>
```

The only thing this app writes is the user's own profile row: date of birth and goals.
Nothing here writes scan data or credits. `health` is still the only writer to `exams`, and
credits only change through the database (a scan uses one; staff add them from the admin panel).

## Getting started

Requires Node.js 20+.

```bash
cp .env.example .env   # fill in the Supabase URL and anon key (same values as the portal)
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Sign-up and codes

Sign-up is phone → code → details (name, date of birth, gender, password). Password reset is
phone → code → new password. Only Libyan mobile numbers are accepted, as in the portal.

A verification code can be requested for a number once every 5 minutes, and at most 3 times
an hour (the first code plus 2 resends). The app enforces this in `src/lib/otpLimit.js`, but
that only covers this browser. The database has its own, looser limit in `request_auth_otp`
(3 codes per 15 minutes), which the kiosk shares and this app does not change.

## Project structure

```
src/
  components/   AuthPage (login, sign-up, reset), Home (the four signed-in tabs), LatestScan,
                GoalsEditor, Results, CreditHistory, Profile, Header,
                charts (score ring, range bar), ui (buttons, cards, form pieces), icons,
                useProfileSave (shared by the two profile forms)
  lib/          supabase (API calls + session), exams, goals, format, otpLimit, phone, dob
  locales/      ar.json, en.json
  I18nProvider.jsx / i18n.js   language, direction and the t() helper
  index.css     Tailwind import, brand colours and the font
```

All user-facing text lives in `src/locales/`. Change both files together.

Signed-in users get four tabs: Summary (goals, latest scan and credit balance), Results,
Credits and Profile (name, phone and age). Goals are edited from the Summary tab; the six on
offer are the kiosk's, at most three at a time.
On phones the tabs are a bar along the bottom, and login and the summary are sized to fit the
screen without scrolling. The BMI status and normal range shown on the summary are the
scanner's own (`exams.bmi_raw`, sent as `value#status#low~high`), not worked out in the app.

The typeface is IBM Plex Sans Arabic (Arabic and Latin), bundled from `@fontsource` so no
font service is contacted.

## Docker

```bash
docker build -t wasfati-app \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key .
docker run -d -p 8080:80 wasfati-app
```

The Supabase values are baked in at build time, so they are passed as build arguments
(`.env` is not copied into the image).
