import { GalleryVerticalEnd } from "lucide-react";
import { redirect } from "react-router";
import {
  getSession,
  commitSession,
} from "~/lib/sessions";

import { LoginForm } from "~/components/login-form";
import type { Route } from "./+types/login";
import { encrypt } from "~/lib/jwt";

export async function action({
  request,
}: Route.ActionArgs) {
  const session = await getSession(
    request.headers.get("Cookie")
  );
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;

  const res = await fetch(`${process.env.API_URL}/rpc/user_profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pass: password }),
  });

  const data = await res.json();
  if (!res.ok || !data ) {
    return { error: "Invalid email or password or user does not exists." };
  }
  const { role, category } = data;
  const token = await encrypt({ email, role, category });
  session.set("token", token);

  // Login succeeded, send them to the home page.
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const { error } = actionData || {};
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          RINA S.P.A.
        </a>
        <LoginForm />
        <p className="text-red-700 text-center">{error}</p>
      </div>
    </div>
  )
}
