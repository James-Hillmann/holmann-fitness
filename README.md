# HolMann Fitness

A family workout tracker. Everyone logs workouts and sees each other's activity;
body numbers stay private — the family only ever sees how much you've lost.

**Live site:** https://holmann-fitness.vercel.app

## How it works

- **Join** with just your name and a 4–6 digit PIN. No emails, no passwords, no
  invite codes — it's one big family.
- **Log in** by tapping your name and entering your PIN on a keypad.
- **Workouts** appear in a shared feed with emoji reactions (💪🔥👏🎉❤️) and
  comments.
- **Board tab**: daily streaks (any day with a workout *or* logged steps keeps
  the 🔥 alive, with best-ever shown), workouts this week, weight lost,
  centimeters/inches lost, and steps this week.
- **Steps** (optional): log your daily step count on the Log page; totals show
  on the weekly steps board.
- **Body page** (private per person):
  - *Weight* — weigh-ins, chart, and change since your first entry.
  - *Measurements* — tape-measure readings in cm/inches for waist, hips,
    chest, thigh, and arm, each with its own chart.
  - Others only ever see your total lost (weight and centimeters), converted
    to *their* preferred unit system (kg/cm ↔ lbs/in, exact factors) — half
    the family is in South Africa, half in the US.
- **Theme** follows your device's light/dark setting by default; override with
  the toggle in the nav or Light/Auto/Dark in settings.

## Development

```bash
npm install
npm run db:push   # creates/updates the schema in the local embedded database
npm run dev
```

Local dev always uses a zero-setup embedded Postgres (PGlite) in `.pglite/` —
`.env.development.local` blanks `DATABASE_URL` on purpose because the value
`vercel env pull` writes to `.env.local` points at the **production** Neon
database. Don't remove that override.

```bash
npm run test      # vitest: unit conversions (kg/lbs, cm/in) + streak logic
npm run lint
npm run build
```

## Deployment

Hosted on Vercel (`holmann-fitness`) with Neon Postgres from the Vercel
Marketplace. Production env vars: `DATABASE_URL` (auto-provisioned) and
`SESSION_SECRET`.

```bash
vercel --prod                                            # deploy
vercel env pull <file> --environment=production --yes    # get prod env
npx dotenv -e <file> -- npx drizzle-kit push             # schema changes
```

## Stack

Next.js 16 (App Router, server actions) · Tailwind 4 + shadcn/ui (Base UI) ·
next-themes · Drizzle ORM · Neon Postgres / PGlite · jose sessions (httpOnly
cookie, 90 days) · bcrypt-hashed PINs · Recharts.
