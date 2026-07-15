# dashboard

Inicio: Health Score + grilla de métricas del día.

**Posee:** `HomeScreen` (tab index).

**Lee:** `day` (agregado de hoy), `range` (sparklines 7d), `latestWeight`.
No escribe nada — las cards navegan al sheet de registro correspondiente.

**Invariantes:**
- Dato faltante = "—" (null), nunca 0: la ausencia no es un valor.
- Cada card muestra UN solo adorno (anillo, sparkline o trend).
- Los objetivos vienen de `core/lib/defaults.ts` hasta que la tabla `goals`
  tenga editor (fase posterior).
