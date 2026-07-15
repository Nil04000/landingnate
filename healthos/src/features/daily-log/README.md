# daily-log

Registro diario: sheets de captura rápida + timeline del día.

**Posee:** pantallas `(sheets)/log-*` y `quick-add`, tab Registro, `day/[date]`,
`DayTimeline`.

**Tablas que escribe:** `sleep_sessions`, `hydration_entries`, `substance_entries`,
`body_measurements`, `wellbeing_entries`, `daily_notes`, `compound_intakes`,
`compound_definitions`, `activity_entries` — siempre vía repositorios.

**Query keys:** lee `day`, `dayEntries`, `latestWeight`, `compoundDefinitions`;
escribe SOLO con `useLogMutation` (rebuild de agregados + invalidación incluidos).

**Invariantes:**
- Todo sheet acepta `?date=YYYY-MM-DD` para back-logging (default hoy).
- Guardar = `haptic.logged()` (lo dispara la mutación, no la pantalla).
- Los cuantitativos de sustancias (mg de cafeína, g de etanol) se resuelven
  al loguear desde presets — nunca se re-derivan después.
