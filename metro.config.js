// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Redirect native-only packages to web stubs when bundling for web.
const WEB_STUBS = {
  "@stripe/stripe-react-native": path.resolve(
    __dirname,
    "src/shared/stubs/stripe-react-native.web.tsx",
  ),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && WEB_STUBS[moduleName]) {
    return {
      filePath: WEB_STUBS[moduleName],
      type: "sourceFile",
    };
  }
  // Fall back to default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
