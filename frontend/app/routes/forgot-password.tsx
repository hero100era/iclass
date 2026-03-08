import { z } from "zod";
import { Link, Form, useActionData, useNavigation } from "react-router";
import { Resend } from "resend";
import { encrypt } from "~/.server/lib/jwt";
import { getEnvOrDie } from "~/.server/lib/env";
import { createServerApi } from "~/.server/lib/api";
import type { Route } from "./+types/forgot-password";


// Schema for validation
const ForgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const form = Object.fromEntries(formData);
  const result = ForgotPasswordSchema.safeParse(form);

  if (!result.success) {
    return { errors: z.flattenError(result.error).formErrors };
  }

  const { email } = result.data;

  // 1. Generate a privileged token to access the protected RPC
  // 'admingrp' is the role we granted execute permission to.
  // We use the same secret as the app to sign this token.
  const adminToken = await encrypt({ role: "admingrp" });

  // 2. Call the RPC to get the reset token
  try {
    const db = createServerApi(adminToken);
    const { data, status } = await db.rpc<{ token: string }>(
      "request_password_reset",
      {
        body: { email },
      },
    );

    if (status !== 200 || !data) {
      // If the RPC returns null or error, we still probably want to show a success message
      // to prevent email enumeration, unless it's a 500.
      return { success: true };
    }

    const resetToken = data.token; // The UUID token

    if (!resetToken) {
      // Should have been handled above if null
      return { success: true };
    }


    // 3. Send Email using Resend
    const resendApiKey = getEnvOrDie("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is missing");
      return {
        errors: ["Server misconfiguration: Email service not available."],
      };
    }

    const resend = new Resend(resendApiKey);

    // Construct the reset URL
    // Assuming the frontend is on the same host as the request?
    // We can use request.url to get origin.
    const url = new URL(request.url);
    const resetUrl = `${url.origin}/reset-password?token=${resetToken}`;
    const resend_mail_from = getEnvOrDie("RESEND_MAIL_FROM");
    const { error } = await resend.emails.send({
      from: `Admin <${resend_mail_from}>`, // Update this to your domain
      to: [email],
      subject: "Reset your password",
      html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    if (error) {
      console.error("Resend Error:", error);
      return {
        errors: ["Failed to send email. Please try again later."],
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Forgot Password Error:", err);
    return { errors: ["An unexpected error occurred."] };
  }
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (actionData?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Check your email</h1>
          <p className="mb-4">
            If an account exists with that email, we have sent instructions to
            reset your password.
          </p>
          <Link to="/login" className="text-blue-500 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
        <Form method="post" className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              required
            />
          </div>

          {actionData?.errors && (
            <p className="text-red-500 text-sm text-center">
              {actionData.errors.map((error, index) => (
                <p key={index} className="text-red-500 text-xs mt-1">
                  {error}
                </p>
              ))}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </Form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-blue-500 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
