# Wasfati App

Mobile-first web app where Wasfaty customers log in and see their body scan results.
It uses the same accounts as the kiosk (`wasfati-portal`): phone number + password, with an
SMS code to sign up or reset a password. Bilingual (العربية / English), Arabic by default.

## How it fits with the other repos

```
wasfati_app (this repo)
  ├── Supabase Auth + RPCs   same project and flow as wasfati-portal
  ├── Supabase `exams`        lists the logged-in user's scans
  └── health service          each result opens its PDF at /exam/<exam_no>/<lang>
```

Nothing here writes scan data. `health` is still the only writer to `exams`.

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
  components/   AuthPage (login, sign-up, reset), Results, Header, ui (form pieces)
  lib/          supabase (API calls + session), otpLimit, phone, dob
  locales/      ar.json, en.json
  I18nProvider.jsx / i18n.js   language, direction and the t() helper
  index.css     Tailwind import + brand colours
```

All user-facing text lives in `src/locales/`. Change both files together.

## Docker

```bash
docker build -t wasfati-app \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key .
docker run -d -p 8080:80 wasfati-app
```

The Supabase values are baked in at build time, so they are passed as build arguments
(`.env` is not copied into the image).
