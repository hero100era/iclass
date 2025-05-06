function dieForEnv(key: string): never {
  throw new Error(`environment variable ${key} must be set`);
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

function getOriginSandbox() {
  const {
    ports: { http },
  } = JSON.parse(getEnvOrDie("ARC_SANDBOX"));
  return `http://localhost:${http}`;
}

function getOrigin() {
  return getEnvOrDieInProduction("ORIGIN") || getOriginSandbox();
}

function getHostname() {
  return new URL(getOrigin()).hostname;
}

function getDomain() {
  const hostname = getHostname();
  if (hostname === "gcn.nasa.gov") {
    return undefined;
  } else if (hostname === "dev.gcn.nasa.gov") {
    return "dev.gcn.nasa.gov";
  } else {
    return "test.gcn.nasa.gov";
  }
}

function getSessionSecret() {
  return getEnvOrDieInProduction("SESSION_SECRET") || "fallback-secret-for-dev";
}

function getRegion() {
  const result = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!result)
    throw new Error("Either AWS_REGION or AWS_DEFAULT_REGION must be defined");
  return result;
}

export {getEnvOrDie,getEnvOrDieInProduction, getDomain, getOrigin, getHostname, getSessionSecret, getRegion };