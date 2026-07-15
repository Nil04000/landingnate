# HealthOS

Sistema operativo de salud personal. Local-first, dark-first, análisis 100% on-device.

> *"Todo lo que afecta mi salud debe quedar registrado, analizado y transformado en decisiones."*

## Stack

- **Expo SDK 57** + React Native + TypeScript strict
- **Expo Router** (tabs + modales) · **NativeWind 4** (Tailwind)
- **expo-sqlite + Drizzle ORM** (schema sync-ready para Supabase futuro)
- **TanStack React Query** (todas las lecturas de DB) · **Zustand** (solo estado UI)
- **Reanimated 4 + Skia** · **Victory Native XL** (gráficos)
- **Vitest + better-sqlite3** (motores y repositorios testeados en Node, sin simulador)

## Comandos

```bash
npm start            # expo start (Expo Go / dev build)
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint
npm test             # vitest run
npm run db:generate  # drizzle-kit generate (tras cambiar src/core/db/schema/)
```

## Arquitectura

```
src/
├── app/            # SOLO rutas expo-router (shells que importan de features/)
├── core/
│   ├── db/         # schema Drizzle, migraciones, repositorios, seeds
│   ├── design-system/  # tokens, componentes, hápticos
│   ├── lib/        # dates (LocalDate), units, stats, ids
│   └── state/      # stores Zustand (solo UI/prefs)
├── features/       # dashboard, daily-log, nutrition, workouts, labs,
│                   # stats, calendar, health-score, insights, assistant
└── queries/        # capa React Query (keys, hooks, mutations)
```

Reglas:

- Ninguna pantalla toca la DB directo: **UI → React Query → repositorio → Drizzle**.
- Toda tabla sincronizable usa `syncColumns` (`_base.ts`): uuid PK, `updated_at`,
  soft delete (`deleted_at`), `is_dirty`. Ver `docs/adr/0002`.
- `daily_aggregates` es cache derivada local (nunca se sincroniza, siempre reconstruible).
- Colores/tipografía/espaciado SOLO vía tokens (`design-system/tokens/` ↔ `tailwind.config.js`).
- Roadmap por fases y decisiones: ver `docs/adr/`.

## Renombrar la app

"HealthOS" es placeholder: cambiar `src/core/brand.ts` + `name`/`slug` en `app.json`.
