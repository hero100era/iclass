import { Outlet } from "react-router";
import { Sidebar } from "~/components/Sidebar";

export default function DashboardLayout() {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="pl-64 transition-all duration-300">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
