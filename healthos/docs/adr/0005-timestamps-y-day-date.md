# ADR-0005 — Timestamps epoch-ms + `day_date` local

**Estado:** aceptada · Fase 1

## Decisión

- Todo instante puntual se guarda como **epoch ms** (integer) — sin strings ISO,
  sin timezone embebida.
- Toda fila loggeable lleva además **`day_date` texto `YYYY-MM-DD`**: la fecha
  calendario LOCAL a la que se acredita el registro. Es la clave analítica de
  agregados, score, insights y calendario.
- El sueño se acredita al **día del despertar**; la timezone del usuario vive en
  `user_profile`.

## Racional

Comparar "días" con timestamps UTC rompe alrededor de medianoche y con viajes.
Separar el instante físico (epoch) del día humano (`day_date`) resuelve ambos:
los agregados agrupan por string ordenable e indexable, y el instante exacto
queda para timelines y duraciones.
