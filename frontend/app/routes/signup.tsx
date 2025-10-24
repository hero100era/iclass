import { z } from "zod";
import { redirect } from "react-router";
import { getSession, commitSession } from "~/lib/sessions.server";
import { encrypt } from "~/lib/jwt.server";
import { SignupFormSchema, LoginFormSchema } from "~/definitions/auth_scheme";
import type { Route } from "./+types/signup";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  console.log(formData);
  const validatedFields = SignupFormSchema.safeParse({ formData });
  if (!validatedFields.success) {
    return { errors: z.flattenError(validatedFields.error) };
  }
  const { name, email, password } = validatedFields.data;
  const pgrst_query_str = `http://localhost:2000/auth/signup`;
  const response = await fetch(pgrst_query_str, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    return { errors: { formErrors: ["failed to signup."] } };
  }
  const user = await response.json();
  const session = await getSession(request.headers.get("Cookie"));
  const expires_ms =
    Date.now() + parseInt(process.env.JWT_EXPIRATION || "3600") * 1000;
  const token = await encrypt({
    token: user.id,
    expiresAt: new Date(expires_ms),
  });
  session.set("token", token);
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function SignUp() {
  return (
    <form method="post">
      <label htmlFor="name">Name:</label>
      <input type="name" id="name" name="name" required />
      <label htmlFor="email">Email:</label>
      <input type="email" id="email" name="email" required />
      <label htmlFor="password">Password:</label>
      <input type="password" id="password" name="password" required />
      <button type="submit">Sign Up</button>
    </form>
  );
}
