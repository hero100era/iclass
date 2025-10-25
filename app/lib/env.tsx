function dieForEnv(key: string): never {
  throw new Error(`environment variable ${key} must be set.`);
}

function getEnvOrDie(key: string) {
  const result = process.env[key];
  if (!result) dieForEnv(key);
  return result;
}

function getEnvOrDieInProduction(key: string) {
  const result = process.env[key];
  if (!result && process.env.NODE_ENV === "production") {
    dieForEnv(key);
  }
  return result;
}

export { getEnvOrDie, getEnvOrDieInProduction };
