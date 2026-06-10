const fs = require("fs");
const path = require("path");

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  return fileContents.split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return env;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) {
      return env;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!key || env[key] !== undefined) {
      return env;
    }

    env[key] = value;
    return env;
  }, {});
};

const projectRoot = __dirname;
const fileEnv = {
  ...parseEnvFile(path.join(projectRoot, ".env")),
  ...parseEnvFile(path.join(projectRoot, ".env.local")),
};

module.exports = ({ config }) => {
  const apiUrl = (process.env.EXPO_PUBLIC_API_URL || fileEnv.EXPO_PUBLIC_API_URL || "").trim();

  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl,
    },
  };
};
