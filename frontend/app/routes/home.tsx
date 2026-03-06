import { Ship, FileBadge, Calendar, Activity } from "lucide-react";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "iClass | Dashboard" },
    { name: "description", content: "Maritime Vessel Certification System" },
  ];
}

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Fleet Overview</h2>
        <p className="text-muted-foreground">
          Welcome back. Here is what&apos;s happening with your fleet today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Ship}
          label="Total Vessels"
          value="12"
          subtext="2 added this month"
          color="text-blue-600"
        />
        <StatCard
          icon={FileBadge}
          label="Active Certificates"
          value="156"
          subtext="12 expiring soon"
          color="text-green-600"
        />
        <StatCard
          icon={Calendar}
          label="Pending Surveys"
          value="8"
          subtext="3 overdue"
          color="text-orange-600"
        />
        <StatCard
          icon={Activity}
          label="System Health"
          value="100%"
          subtext="All services operational"
          color="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg">Upcoming Expiries</h3>
          <div className="space-y-4">
            <ExpiryItem
              vessel="OCEAN WARRIOR"
              cert="Safety Management"
              date="2024-03-15"
              status="Warning"
            />
            <ExpiryItem
              vessel="SEA GUARDIAN"
              cert="Oil Pollution Prevention"
              date="2024-04-02"
              status="Normal"
            />
            <ExpiryItem
              vessel="ARCTIC STAR"
              cert="Load Line"
              date="2024-04-20"
              status="Normal"
            />
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-lg">Recent Activity</h3>
          <div className="space-y-4">
            <ActivityItem
              text="Certificate 'LL' issued for OCEAN WARRIOR"
              time="2 hours ago"
            />
            <ActivityItem
              text="Survey report uploaded for SEA GUARDIAN"
              time="5 hours ago"
            />
            <ActivityItem
              text="New vessel 'PACIFIC BREEZE' registered"
              time="Yesterday"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  subtext: string;
  color: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col gap-2">
      <div className={`p-2 w-fit rounded-lg bg-muted ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  );
}

function ExpiryItem({
  vessel,
  cert,
  date,
  status,
}: {
  vessel: string;
  cert: string;
  date: string;
  status: "Warning" | "Normal";
}) {
  return (
    <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
      <div>
        <p className="font-medium">{vessel}</p>
        <p className="text-sm text-muted-foreground">{cert}</p>
      </div>
      <div className="text-right">
        <p
          className={
            status === "Warning" ? "text-orange-600 font-semibold" : ""
          }
        >
          {date}
        </p>
        <p className="text-xs text-muted-foreground">Expiry Date</p>
      </div>
    </div>
  );
}

function ActivityItem({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
      <div>
        <p className="text-sm">{text}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
