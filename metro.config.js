const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("cjs");
config.resolver.packageExportsConditions = ["react-native", "browser", "require"];

module.exports = withNativeWind(config, {
  input: "./app/global.css",
});
