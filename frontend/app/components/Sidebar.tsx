import { NavLink } from "react-router";
import {
    LayoutDashboard,
    Ship,
    FileBadge,
    Calendar,
    Settings,
    LogOut,
    User
} from "lucide-react";
import { cn } from "~/lib/utils";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/" },
    { icon: Ship, label: "Vessels", to: "/vessels" },
    { icon: FileBadge, label: "Certificates", to: "/certificates" },
    { icon: Calendar, label: "Surveys", to: "/surveys" },
];

export function Sidebar() {
    return (
        <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
            <div className="p-6">
                <h1 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
                    <Ship className="text-sidebar-primary" />
                    <span>iClass</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                            isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border space-y-1">
                <NavLink
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                >
                    <User size={20} />
                    <span className="font-medium">Profile</span>
                </NavLink>
                <NavLink
                    to="/logout"
                    className="flex items-center gap-3 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </NavLink>
            </div>
        </aside>
    );
}
