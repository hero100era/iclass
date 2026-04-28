import {
  User as UserIcon,
  Mail,
  Shield,
  Settings,
  Bell,
  CircleUser,
  Key,
  Languages,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { getDb } from "~/.server/lib/api";
import { type Employee } from "~/definitions/database.iclass.types";

import type { Route } from "./+types/profile";

interface CurrentUser extends Employee {
  job_title?: string | null;
  department_name?: string | null;
  location_name?: string | null;
}

export async function loader({ request }: Route.LoaderArgs) {
  const db = await getDb(request);
  const { data: users } = await db.get<CurrentUser[]>("/me");
  if (!users || users.length === 0) {
    throw new Response("User not found", { status: 404 });
  }
  return { user: users[0] };
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: User Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border rounded-2xl p-8 shadow-sm text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto border-4 border-background">
                <UserIcon size={48} />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-card rounded-full"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {user.display_name || (user.email as string).split("@")[0].toUpperCase()}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user.job_title || user.job_title_custom || "Employee"}
              </p>
            </div>
            <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Department</p>
                <p className="text-sm font-medium">{user.department_name || "Standard"}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
                <p className="text-sm font-medium text-green-600">
                  {user.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-1">
            <ProfileSidebarItem icon={UserIcon} label="Personal Info" active />
            <ProfileSidebarItem icon={Shield} label="Security" />
            <ProfileSidebarItem icon={Bell} label="Notifications" />
            <ProfileSidebarItem icon={Settings} label="Preferences" />
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CircleUser size={18} className="text-primary" />
                <span>Personal Information</span>
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem icon={Mail} label="Email Address" value={user.email as string} />
                <InfoItem
                  icon={Shield}
                  label="Job Title"
                  value={user.job_title || user.job_title_custom || "Not assigned"}
                />
                <InfoItem icon={Key} label="User ID" value={String(user.id)} />
                <InfoItem
                  icon={MapPin}
                  label="Location"
                  value={user.location_name || user.address || "Not assigned"}
                />
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Settings size={18} className="text-primary" />
                <span>Account Preferences</span>
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <PreferenceToggle
                label="Email Notifications"
                description="Receive updates about certificate expiries"
                enabled
              />
              <PreferenceToggle
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                enabled={false}
              />
              <div className="pt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                  <Languages size={14} />
                  <span>Language: English</span>
                </div>
                <button className="text-sm text-primary font-medium hover:underline">
                  Change Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5 group">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-transparent group-hover:border-primary/20 transition-all duration-300">
        <Icon size={18} className="text-muted-foreground" />
        <p className="font-medium text-foreground">{value || "Not provided"}</p>
      </div>
    </div>
  );
}

function ProfileSidebarItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
    >
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function PreferenceToggle({
  label,
  description,
  enabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-colors border border-transparent hover:border-border">
      <div className="space-y-0.5">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 transform ${enabled ? "translate-x-6" : "translate-x-0"}`}
        ></div>
      </div>
    </div>
  );
}
