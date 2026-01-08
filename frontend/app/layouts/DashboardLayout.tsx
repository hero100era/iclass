import { Outlet, useLoaderData } from "react-router";
import { Sidebar } from "~/components/Sidebar";
import { getSession } from "~/.server/lib/sessions";
import { decrypt } from "~/.server/lib/jwt";
import type { Route } from "./+types/DashboardLayout";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const token = session.get("token");
    const user = await decrypt(token);
    return { user };
}

export default function DashboardLayout() {
    const { user } = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-background">
            <Sidebar user={user as any} />
            <main className="pl-64 transition-all duration-300">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
