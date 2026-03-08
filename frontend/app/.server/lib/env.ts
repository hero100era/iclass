function dieForEnv(key: string): never {
  throw new Error(`environment variable ${key} must be set in .env file.`);
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

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvAsInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

export { getEnvOrDie, getEnvOrDieInProduction, getEnvOrDefault, getEnvAsInt };
