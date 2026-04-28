import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Ship,
  Calendar,
  ClipboardList,
  LogOut,
  User,
  ShieldAlert,
  Briefcase,
} from "lucide-react";
import { cn } from "~/lib/utils";

const navItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    to: "/",
    roles: ["admingrp", "employees", "customers", "administrations"],
  },
  {
    icon: Ship,
    label: "Vessels",
    to: "/vessels",
    roles: ["admingrp", "employees", "customers", "administrations"],
  },
  {
    icon: Calendar,
    label: "Surveys",
    to: "/surveys",
    roles: ["admingrp", "employees", "administrations"],
  },
  {
    icon: ClipboardList,
    label: "Requests",
    to: "/requests",
    roles: ["admingrp", "employees", "administrations"],
  },
  {
    icon: Briefcase,
    label: "Jobs",
    to: "/jobs",
    roles: ["admingrp", "employees"],
  },
  {
    icon: ShieldAlert,
    label: "Admin",
    to: "/admin",
    roles: ["admingrp"],
  },
];

interface SidebarProps {
  user: {
    role: string;
    [key: string]: unknown;
  } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const filteredItems = navItems.filter((item) => !user || item.roles.includes(user.role));

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
          <Ship className="text-sidebar-primary" />
          <span>iClass</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )
            }
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
