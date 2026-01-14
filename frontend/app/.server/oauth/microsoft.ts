import { z } from "zod";
import { OAuthClient } from "./base";
import { getEnvOrDie } from "~/.server/lib/env";

export function createMicrosoftOAuthClient() {
  return new OAuthClient({
    provider: "microsoft",
    clientId: getEnvOrDie("MICROSOFT_CLIENT_ID"),
    clientSecret: getEnvOrDie("MICROSOFT_CLIENT_SECRET"),
    scopes: ["User.Read", "email", "openid", "profile"],
    urls: {
      auth: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      user: "https://graph.microsoft.com/v1.0/me",
    },
    userInfo: {
      schema: z.object({
        id: z.string(),
        displayName: z.string().nullable(),
        mail: z.email().nullable(),
        userPrincipalName: z.email(),
      }),
      parser: (user) => ({
        id: user.id,
        name: user.displayName ?? user.userPrincipalName.split("@")[0],
        email: user.mail ?? user.userPrincipalName,
      }),
    },
  });
}