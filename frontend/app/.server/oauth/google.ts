import { z } from "zod";
import { OAuthClient } from "./base";
import { getEnvOrDie } from "~/.server/lib/env";

export function createGoogleOAuthClient() {
  return new OAuthClient({
    provider: "google",
    clientId: getEnvOrDie("GOOGLE_CLIENT_ID"),
    clientSecret: getEnvOrDie("GOOGLE_CLIENT_SECRET"),
    scopes: ["openid", "email", "profile"],
    urls: {
      auth: "https://accounts.google.com/o/oauth2/v2/auth",
      token: "https://oauth2.googleapis.com/token",
      user: "https://www.googleapis.com/oauth2/v2/userinfo",
    },
    userInfo: {
      schema: z.object({
        id: z.string(),
        name: z.string(),
        email: z.email(),
        picture: z.string().optional(),
      }),
      parser: (user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }),
    },
  });
}