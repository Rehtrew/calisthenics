# Cali

Digital udgave af Caliathletics-programmet (Beginner og Intermediate, level 1 til 8) som en lille web-app.

- Vælg dag, spring ben over, sæt pause mellem sæt og byt om på rækkefølgen inden du starter.
- Under træningen: aktuel øvelse, sæt-tæller, mål, næste øvelse, forløbet tid og pausetimer med lyd og vibration.
- Log om du nåede alle reps eller færre. Afbryd når som helst.
- Opsummering efter hver træning og et dashboard med historik og progression.
- Data gemmes i browseren og, når synkronisering er slået til, også på serveren, så telefon og computer deler historik.

## Kør lokalt

```bash
npm install
npm run dev
```

I udvikling svarer en indbygget udgave af `/api/state` fra hukommelsen med sync-koden `dev`.

## Byg og test

```bash
npm run build
npm test
```

## Deploy til Vercel

Importér repoet i Vercel. Det er et Vite-projekt med en serverless-funktion i `api/`, så Vercel finder selv build og output.

## Synkronisering mellem enheder

Appen gemmer hele sin tilstand som ét JSON-dokument via `api/state.ts`. Det kræver en Redis-database og en hemmelig kode:

1. I Vercel: åbn projektet, fanen **Storage**, opret en **Redis**-database og tilslut den projektet.
   Vercels egen Redis giver `REDIS_URL`; Upstash via Marketplace giver `KV_REST_API_URL` og `KV_REST_API_TOKEN`.
   Funktionen understøtter begge dele.
2. I Vercel: **Settings → Environment Variables → Add**: Key `APP_SECRET`, Value = en kode, du selv vælger (mindst 6 tegn),
   alle environments markeret. Gem.
3. Redeploy projektet (Deployments → de tre prikker på seneste deployment → Redeploy), så de nye variabler er med.
4. I appen: **Indstillinger → Synkronisering**, skriv den samme kode og tryk Gem. Gør det samme på de andre enheder.

Synkronisering sker automatisk efter hver ændring, når appen åbnes, og når den får net igen. Træninger flettes på tværs
af enheder; for indstillinger og en igangværende træning vinder den enhed, der sidst ændrede noget.
