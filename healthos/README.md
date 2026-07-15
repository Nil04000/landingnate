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

## Estado del roadmap

| Fase | Estado |
|---|---|
| 1 — Fundación (schema, seeds, design system, shell) | ✅ |
| 2 — Registro diario (10 sheets, Inicio vivo, timeline) | ✅ |
| 3 — Nutrición (biblioteca, comidas, micros, plantillas) | ✅ |
| 4 — Entrenamiento (logger en vivo, PRs, e1RM, historial) | ✅ |
| 5 — Laboratorios (paneles, flags, rangos, gráficos) | ✅ |
| 6 — Estadísticas (D/S/M/A, récords, rachas, Victory XL) | ✅ |
| 7 — Health Score explicable + calendario heatmap | ✅ |
| 8 — Motor de insights (~250 reglas con guardas) | ✅ |
| 9 — Asistente local (intents + herramientas, offline) | ✅ |
| 10 — Hardening (conformidad sync, export, perfil) | ✅ |

**Pendientes conocidos** (deuda declarada, no bloqueante):

- Modo claro: los tokens son dark-first directos; migrar a variables por
  tema es un refactor acotado de `tokens/` + `tailwind.config.js`.
- Editor de objetivos: la tabla `goals` existe y tiene semántica de vigencia,
  pero las cards/score leen `core/lib/defaults.ts`; falta la UI y el resolver.
- Tests de componentes (jest-expo + RNTL): los motores y repositorios están
  cubiertos por Vitest (74 tests); las pantallas se validan manualmente.
- Import del export JSON (el backup ya se genera; falta el camino inverso).
- Sync con Supabase: el schema y los repos ya cumplen el contrato
  (ADR-0002 + test de conformidad); falta solo el worker de push/pull.

## Renombrar la app

"HealthOS" es placeholder: cambiar `src/core/brand.ts` + `name`/`slug` en `app.json`.
