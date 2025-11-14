import { redirect } from "react-router";
import { type OAuthProvider } from "~/definitions/auth_scheme";
import { getSession, commitSession } from "~/.server/lib/sessions";
import { getOAuthClient } from "~/.server/oauth/base";
import type { Route } from "./+types/oauth";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const provider = params.provider as OAuthProvider;
  const oAuthClient = getOAuthClient(provider);

  const { redirectUrl, oAuthState, codeVerifier } =
    await oAuthClient.createAuthData();
  session.set("oAuthState", oAuthState);
  session.set("codeVerifier", codeVerifier);
  return redirect(redirectUrl, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}
