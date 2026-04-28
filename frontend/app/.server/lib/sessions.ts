import { createCookieSessionStorage } from "react-router";
import { getEnvOrDie, getEnvAsInt } from "./env";

type SessionData = {
  jwt?: string;
  oAuthState?: string;
  codeVerifier?: string;
};

type SessionFlashData = {
  error: string;
};

const SESSION_MAX_AGE = getEnvAsInt("SESSION_MAX_AGE", 60 * 60); // default 1 hour

const { getSession, commitSession, destroySession } = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secrets: [getEnvOrDie("SECRET_KEY")],
    secure: process.env.NODE_ENV === "production",
  },
});

export { getSession, commitSession, destroySession };
