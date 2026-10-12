# cali

Digital udgave af Caliathletics-programmet (beginner og intermediate, level 1–8) som en lille web-app.

- Vælg dag, spring ben over, sæt pause mellem sæt og byt om på rækkefølgen inden du starter.
- Under træningen: aktuel øvelse, sæt-tæller, mål, næste øvelse, pausetimer med lyd og vibration.
- Log om du nåede alle reps eller færre. Afbryd når som helst.
- Opsummering efter hver træning og et dashboard med historik og progression.
- Data gemmes i browserens localStorage. Backup via eksport/import under indstillinger.

## Kør lokalt

```bash
npm install
npm run dev
```

## Byg og test

```bash
npm run build
npm test
```

## Deploy til Vercel

Importér repoet i Vercel. Det er et rent Vite-projekt, så Vercel finder selv `npm run build` og `dist/`.
