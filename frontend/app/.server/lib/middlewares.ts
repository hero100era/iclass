import { redirect } from "react-router";
import { getSession, commitSession } from "./sessions";
import { decrypt, encrypt } from "./jwt";

export const loggingMiddleware = async (
  {
    request,
  }: {
    request: Request;
  },
  next: () => Promise<Response>,
) => {
  const requestId = crypto.randomUUID();

  console.log(`[${requestId}] ${request.method} ${request.url}`);

  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;

  console.log(`[${requestId}] Response ${response.status} (${duration}ms)`);

  return response;
};

export const sessionMiddleware = async (
  { request }: { request: Request },
  next: () => Promise<Response>
) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const whitelist = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/logout",
  ];

  const isWhitelisted =
    whitelist.includes(pathname) ||
    pathname.startsWith("/login/oauth") ||
    pathname.startsWith("/oauth/callback");

  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token && !isWhitelisted) {
    return redirect("/login");
  }

  let payload = null;
  if (token) {
    payload = await decrypt(token);
    if (!payload && !isWhitelisted) {
      return redirect("/login");
    }
  }

  const response = await next();

  if (payload && payload.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = (payload.exp as number) - currentTime;

    if (timeLeft > 0 && timeLeft < 300) {
      // Refresh token
      const newPayload = { ...payload };
      delete newPayload.exp;
      delete newPayload.iat;
      delete newPayload.nbf;
      delete newPayload.jti;

      const newToken = await encrypt(newPayload);
      session.set("token", newToken);

      const newResponse = new Response(response.body, response);
      newResponse.headers.set("Set-Cookie", await commitSession(session));
      return newResponse;
    }
  }

  return response;
};
