import { z } from "zod";
import { redirect, Link } from "react-router";
import { getSession, commitSession } from "~/.server/lib/sessions";
import { encrypt } from "~/.server/lib/jwt";
import { ApiPOST } from "~/.server/lib/api";
import { LoginFormSchema } from "~/definitions/auth_scheme";
import type { Route } from "./+types/login";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const form = Object.fromEntries(formData);
  const result = LoginFormSchema.safeParse({ ...form });
  if (!result.success) {
    return { errors: z.flattenError(result.error) };
  }
  const { email, password } = result.data;
  const host = process.env.API_URL || "http://localhost:2000";
  const pgrst_query_str = `${host}/rpc/user_profile`;
  const response = await ApiPOST(request, pgrst_query_str, {
    email,
    pass: password,
  });
  if (!response.ok) {
    return {
      errors: {
        formErrors: [
          "Failed to login, invalid email/password or user does not exists.",
        ],
      },
    };
  }
  const data = await response.json();
  const { id, role, category } = data;
  const token = await encrypt({ id, role, email, category });
  const session = await getSession(request.headers.get("Cookie"));
  session.set("token", token);
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Login() {
  return (
    <>
      <form method="POST">
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" name="email" required />
        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name="password" required />
        <button type="submit">Login</button>
      </form>
      <Link to="oauth/github">Github</Link>
    </>
  );
}
