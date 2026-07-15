const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Migraciones Drizzle bundleadas como fuente (.sql via babel inline-import)
config.resolver.sourceExts.push('sql');

module.exports = withNativeWind(config, { input: './src/global.css' });
