# workouts

Logger de fuerza en vivo + resumen de sesión + historial por ejercicio.

**Posee:** pantallas `workout/active?id=` (logger fullScreenModal),
`workout/[id]` (resumen) y `workout/exercise/[id]` (historial);
componentes `ExerciseCard`, `SetRow`, `RestTimer`, `ExercisePicker`.

**Tablas que escribe:** `workouts`, `workout_exercises`, `workout_sets` —
siempre vía `WorkoutsRepository`.

**Query keys:** lee `workout`, `ghostSets`, `exerciseHistory`, `exerciseSearch`;
escribe SOLO con `useWorkoutMutation` (rebuild de agregados + invalidación +
detección de PR con `checkPr` incluidos).

**Invariantes:**
- Toda mutación lleva `dayDate` (sale del row del workout) y `workoutId`
  cuando aplica.
- PR = e1RM (Epley) del set nuevo > mejor histórico ANTES del write; el badge
  "PR" dorado vive en estado local (`lastPrSetId`), nunca en la DB. Los
  warmups no compiten por PR.
- Rest timer (90 s, ±15 s, ticks hápticos finales) y cronómetro de sesión son
  estado local de la pantalla — no se persisten.
- Una sesión sin series no se guarda: "Terminar" la soft-deletea y vuelve.
- "+ Serie" copia reps/kg del último set del ejercicio (o del ghost de la
  última sesión si todavía no hay sets).
