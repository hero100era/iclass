import { z } from "zod";
import crypto from "crypto";
import { type Session } from "react-router";
import { getEnvOrDie } from "~/.server/lib/env";
import type { OAuthProvider } from "~/definitions/auth_scheme";
import { createGithubOAuthClient } from "./github";
import { createDiscordOAuthClient } from "./discord";
import { createMicrosoftOAuthClient } from "./microsoft";
import { createGoogleOAuthClient } from "./google";

export type Cookies = Record<string, string | undefined>;

export class OAuthClient<T> {
  private readonly provider: OAuthProvider;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scopes: string[];
  private readonly urls: {
    auth: string;
    token: string;
    user: string;
  };
  private readonly userInfo: {
    schema: z.ZodSchema<T>;
    parser: (data: T) => { id: string; email: string; name: string };
  };
  private readonly tokenSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
  });

  constructor({
    provider,
    clientId,
    clientSecret,
    scopes,
    urls,
    userInfo,
  }: {
    provider: OAuthProvider;
    clientId: string;
    clientSecret: string;
    scopes: string[];
    urls: {
      auth: string;
      token: string;
      user: string;
    };
    userInfo: {
      schema: z.ZodSchema<T>;
      parser: (data: T) => { id: string; email: string; name: string };
    };
  }) {
    this.provider = provider;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.urls = urls;
    this.userInfo = userInfo;
  }

  private get redirectUrl() {
    const baseUrl = getEnvOrDie("OAUTH_REDIRECT_URL_BASE");
    // Ensure proper trailing slash
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    return new URL(normalizedBaseUrl + `oauth/callback/${this.provider}`);
  }

  /**
   * Create authorization URL and PKCE verifier.
   * under the key `codeVerifier` as the PKCE verifier (the raw verifier). The actual `code_challenge`
   * parameter sent to the provider is the SHA256-base64url of that verifier.
   */
  async createAuthData() {
    const oAuthState = crypto.randomBytes(32).toString("hex");
    // generate a high-entropy random verifier and its SHA256-based challenge
    // Use standard base64 + a helper to convert to base64url to avoid depending on
    // Node's optional 'base64url' encoding name across environments.
    const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
    const codeChallengeHashed = base64UrlEncode(
      crypto.createHash("sha256").update(codeVerifier).digest(),
    );

    const url = new URL(this.urls.auth);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUrl.toString());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.scopes.join(" "));
    url.searchParams.set("state", oAuthState);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", codeChallengeHashed);

    const redirectUrl = url.toString();
    return { redirectUrl, oAuthState, codeVerifier };
  }

  async fetchUser(code: string, state: string | null, session: Session) {
    const isValidState = validateState(state, session);
    if (!isValidState) throw new InvalidStateError();

    const { accessToken, tokenType } = await this.fetchToken(
      code,
      getCodeVerifier(session),
    );

    const res = await fetch(this.urls.user, {
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
        Accept: "application/json",
      },
    });
    const rawData = await res.json();
    const result = this.userInfo.schema.safeParse(rawData);
    if (!result.success) throw new InvalidUserError(result.error);
    const data = this.userInfo.parser(result.data);
    return data;
  }

  private async fetchToken(code: string, verifier: string) {
    const res = await fetch(this.urls.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        redirect_uri: this.redirectUrl.toString(),
        grant_type: "authorization_code",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code_verifier: verifier,
      }),
    });
    const rawData = await res.json();
    const parsed = this.tokenSchema.safeParse(rawData);
    if (!parsed.success) throw new InvalidTokenError(parsed.error);
    return {
      accessToken: parsed.data.access_token,
      tokenType: parsed.data.token_type,
    };
  }
}

export function getOAuthClient(provider: OAuthProvider) {
  switch (provider) {
    case "discord":
      return createDiscordOAuthClient();
    case "github":
      return createGithubOAuthClient();
    case "microsoft":
      return createMicrosoftOAuthClient();
    case "google":
      return createGoogleOAuthClient();

    default:
      throw new Error(`Invalid provider: ${provider satisfies never}`);
  }
}

class InvalidTokenError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid Token");
    this.cause = zodError;
  }
}

class InvalidUserError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid User");
    this.cause = zodError;
  }
}

class InvalidStateError extends Error {
  constructor() {
    super("Invalid State");
  }
}

class InvalidCodeVerifierError extends Error {
  constructor() {
    super("Invalid Code Verifier");
  }
}

function validateState(state: string | null, session: Session) {
  const cookieState = session.get("oAuthState");
  return cookieState === state;
}

function getCodeVerifier(session: Session) {
  // The application stores the PKCE verifier in session under the key `codeVerifier`
  const codeVerifier = session.get("codeVerifier");
  if (codeVerifier == null) throw new InvalidCodeVerifierError();
  return codeVerifier;
}

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
