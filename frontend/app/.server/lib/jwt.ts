import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "jose";
import { getEnvOrDie } from "./env";

export async function encrypt(payload: JWTPayload) {
  const secret = getEnvOrDie("SECRET");
  const key = new TextEncoder().encode(secret);
  const expires = Math.floor(Date.now() / 1000) + 900; // current time + 15 minutes
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key);
}

export async function decrypt(token: string | undefined = "") {
  const secret = getEnvOrDie("SECRET");
  const key = new TextEncoder().encode(secret);
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}
