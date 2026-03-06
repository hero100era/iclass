import { Outlet, useLoaderData, useMatches } from "react-router";
import { Sidebar } from "~/components/Sidebar";
import { cn } from "~/lib/utils";
import { getSession } from "~/.server/lib/sessions";
import { decrypt } from "~/.server/lib/jwt";
import type { Route } from "./+types/DashboardLayout";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const jwt = session.get("jwt");
  const user = await decrypt(jwt);
  return { user };
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();
  const matches = useMatches();
  const isFluid = matches.some((m) => (m.handle as { fluid?: boolean })?.fluid);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user as { role: string;[key: string]: unknown } | null} />
      <main className="pl-64 transition-all duration-300">
        <div className={cn("p-8 mx-auto", isFluid ? "px-6" : "max-w-7xl")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
