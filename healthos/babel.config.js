module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // Inlinea los .sql de las migraciones Drizzle en el bundle (ver migrations.js)
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
