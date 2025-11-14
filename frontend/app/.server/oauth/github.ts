import { z } from "zod";
import { OAuthClient } from "./base";
import { getEnvOrDie } from "~/.server/lib/env";

export function createGithubOAuthClient() {
  return new OAuthClient({
    provider: "github",
    clientId: getEnvOrDie("GITHUB_CLIENT_ID"),
    clientSecret: getEnvOrDie("GITHUB_CLIENT_SECRET"),
    scopes: ["user:email", "read:user"],
    urls: {
      auth: "https://github.com/login/oauth/authorize",
      token: "https://github.com/login/oauth/access_token",
      user: "https://api.github.com/user",
    },
    userInfo: {
      schema: z.object({
        id: z.number(),
        name: z.string().nullable(),
        login: z.string(),
        email: z.email().nullable(),
      }),
      parser: (user) => ({
        id: user.id.toString(),
        name: user.name ?? user.login,
        email: user.email ?? user.login + "@github.com",
      }),
    },
  });
}
