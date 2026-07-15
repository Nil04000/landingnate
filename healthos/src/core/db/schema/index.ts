/**
 * Barrel del schema completo.
 * Alimenta: el cliente Drizzle de la app, drizzle-kit (migraciones) y la DB
 * en memoria de los tests. Todo cambio de schema pasa por acá + `npm run db:generate`.
 */
export * from './activity';
export * from './aggregates';
export * from './body';
export * from './compounds';
export * from './foods';
export * from './hydration';
export * from './insights';
export * from './labs';
export * from './meals';
export * from './scores';
export * from './settings';
export * from './sleep';
export * from './substances';
export * from './sync';
export * from './wellbeing';
export * from './workouts';
