import { z } from "zod";
import {
  Form,
  // useActionData,
  useNavigation,
  redirect,
  useSearchParams,
  Link,
} from "react-router";
import { publicApi } from "~/.server/lib/api";
import type { Route } from "./+types/reset-password";

const ResetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return { errors: { form: ["Invalid or missing token."] } };
  }

  const formData = await request.formData();
  const form = Object.fromEntries(formData);
  const result = ResetPasswordSchema.safeParse(form);

  if (!result.success) {
    return { errors: z.flattenError(result.error) };
  }

  const { password } = result.data;
  try {
    const { data: success, status } = await publicApi.rpc<boolean>("reset_password", {
      body: {
        token: token,
        new_password: password,
      },
    });

    if (status !== 200 || success !== true) {
      return {
        errors: {
          form: ["Invalid or expired token."],
        },
      };
    }

    // Success
    return redirect("/login");
  } catch (err) {
    console.error("Reset Password Error:", err);
    return { errors: { form: ["An unexpected error occurred."] } };
  }
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  // const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h1 className="text-xl font-bold text-red-500 mb-4">Invalid Link</h1>
          <p>The password reset link is invalid or missing.</p>
          <Link to="/forgot-password" className="text-blue-500 mt-4 block">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Set New Password</h1>
        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              required
            />
            {/* {actionData?.errors?.password && (
                            <p className="text-red-500 text-xs mt-1">{actionData.errors.password[0]}</p>
                        )} */}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              required
            />
            {/* {actionData?.errors?.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">{actionData.errors.confirmPassword[0]}</p>
                        )} */}
          </div>

          {/* {actionData?.errors?.form && (
                        <p className="text-red-500 text-sm text-center">{actionData.errors.form[0]}</p>
                    )} */}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </Form>
      </div>
    </div>
  );
}
