import { redirect } from "react-router";
import { type OAuthProvider } from "~/definitions/auth_scheme";
import { getSession, commitSession } from "~/.server/lib/sessions";
import { getOAuthClient } from "~/.server/oauth/base";
import { encrypt } from "~/.server/lib/jwt";
import type { Route } from "./+types/oauth";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const provider = params.provider as OAuthProvider;
  const oAuthClient = getOAuthClient(provider);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // If there is no `code` param, initiate the OAuth flow (redirect to provider).
  if (!code) {
    return redirect("/login");
  }
  try {
    const user = await oAuthClient.fetchUser(code, state, session);

    // 1. Generate a privileged token to access the protected RPC
    // 'admingrp' is the role we granted execute permission to.
    const adminToken = await encrypt({ role: "admingrp" });

    // 2. Call backend to ensure user exists / create if necessary.
    const host = process.env.API_URL || "http://localhost:2000";
    const rpcUrl = `${host}/rpc/oauth_login`;
    const resp = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        provider,
        provider_user_id: user.id,
        email: user.email,
        name: user.name,
      }),
    });

    if (!resp.ok) {
      // Backend failed to create/lookup user; redirect to login page.
      return redirect("/login");
    }

    const data = await resp.json();
    const { id, role, category } = data;

    // Create application jwt and store in session.
    const jwt = await encrypt({ id, role, category });
    session.set("jwt", jwt);

    // Clean up temporary OAuth session keys.
    session.unset("oAuthState");
    session.unset("codeVerifier");

    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch {
    // On error, fall back to the login page (could be improved to surface error).
    return redirect("/login");
  }
}
