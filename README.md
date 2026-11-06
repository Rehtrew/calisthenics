# Cali

The Caliathletics program (16 levels, three training days each) as a small web app that runs your workout. In English and Danish: the app follows the browser's language on first start, and you can switch under Settings.

- Pick the day, skip the leg exercises, set the rest between sets and reorder the exercises before you start.
- During the workout: one set at a time with the target, the muscles it works on a body figure, what you did last time, the time elapsed, and a rest timer with sound and vibration that lists the sets coming up.
- Log whether you hit every rep or fewer. Abort at any time.
- After each workout a story-style summary: share of the program, calories, weight moved, work against rest, streak, and your body weight.
- Home screen with the next day, a streak calendar, stats, recent sessions and a weight curve.
- Data lives in the browser and, with sync turned on, on the server too, so phone and computer share one history.

## Run it locally

```bash
npm install
npm run dev
```

In development a built-in version of `/api/state` answers from memory with the sync code `dev`.

## Build and test

```bash
npm run build
npm test
```

## Deploy to Vercel

Import the repo in Vercel. It is a Vite project with a serverless function in `api/`, so Vercel finds the build and output on its own.

## Sync between devices

The app stores its whole state as one JSON document through `api/state.ts`. That needs a Redis database and a secret code:

1. In Vercel: open the project, the **Storage** tab, create a **Redis** database and connect it to the project.
   Vercel's own Redis provides `REDIS_URL`; Upstash through the Marketplace provides `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
   The function supports both.
2. In Vercel: **Settings → Environment Variables → Add**: Key `APP_SECRET`, Value = a code of your choosing (at least 6 characters),
   all environments ticked. Save.
3. Redeploy the project (Deployments → the three dots on the latest deployment → Redeploy) so the new variables are picked up.
4. In the app: **Settings → Sync**, enter the same code and press Save. Do the same on your other devices.

Sync runs after every change, when the app opens, and when it gets back online. Workouts are merged across devices; for settings and a workout in progress, the device that changed something last wins.

## Languages

Danish is the source language; English is a dictionary in `src/lib/i18n.ts` keyed by the Danish strings. A missing entry falls back to Danish, so adding a string never breaks the app.

---

# Cali (dansk)

Digital udgave af Caliathletics-programmet (16 levels med tre træningsdage hver) som en lille web-app, der kører din træning. På dansk og engelsk: appen følger browserens sprog første gang, og du kan skifte under Indstillinger.

- Vælg dag, spring ben over, sæt pause mellem sæt og byt om på rækkefølgen inden du starter.
- Under træningen: ét sæt ad gangen med mål, musklerne på en figur, hvad du nåede sidst, forløbet tid og pausetimer med lyd og vibration, der viser de kommende sæt.
- Log om du nåede alle reps eller færre. Afbryd når som helst.
- Opsummering efter hver træning: andel af programmet, kalorier, flyttet vægt, arbejde mod pause, streak og din vægt.
- Forside med næste dag, streak-kalender, statistik, seneste træninger og vægtkurve.
- Data gemmes i browseren og, når synkronisering er slået til, også på serveren, så telefon og computer deler historik.

Opsætning af synkronisering: se afsnittet ovenfor. I appen hedder det **Indstillinger → Synkronisering**.
