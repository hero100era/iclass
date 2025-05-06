import { createCookieSessionStorage } from "react-router";

export type SessionData = {
  token: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>(
    {
      // a Cookie from `createCookie` or the CookieOptions to create one
      cookie: {
        name: "session",

        // all of these are optional
        // domain: "reactrouter.com",
        // Expires can also be set (although maxAge overrides it when used in combination).
        // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
        //
        // expires: new Date(Date.now() + 60_000),
        httpOnly: true,
        maxAge: 60 * 60, // 1 hour in seconds
        path: "/",
        sameSite: "lax",
        secrets: [process.env.SECRET_KEY || "19EATQqePeGfrxEkHGTzX8MdtCY6LQfz"],
        secure: process.env.NODE_ENV === "production",
      },
    }
  );

export { getSession, commitSession, destroySession };
