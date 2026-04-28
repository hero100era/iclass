import { z } from "zod";

export const SignupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }).trim(),
  email: z.email({ message: "Please enter a valid email." }).trim(),
  password: z.string().min(6, { message: "Be at least 6 characters long" }).trim(),
});

export const LoginFormSchema = z.object({
  email: z.email({ message: "Please enter a valid email." }).trim(),
  password: z.string().min(6, { message: "Be at least 6 characters long" }).trim(),
});

export type FormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const oAuthProviders = ["github", "discord", "microsoft", "google"] as const;
export type OAuthProvider = (typeof oAuthProviders)[number];

export const userRoles = ["admin", "user"] as const;
export type UserRole = (typeof userRoles)[number];

export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "strict" | "lax";
      expires?: number;
    },
  ) => void;
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string) => void;
};
