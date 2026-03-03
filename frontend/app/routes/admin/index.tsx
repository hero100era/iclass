import { Link } from "react-router";
import { ClipboardList, Network, ShieldCheck, Users, Settings, ArrowRight } from "lucide-react";
import { cn } from "~/lib/utils";

export default function AdminDashboard() {
    const adminModules = [
        {
            title: "Checklist Management",
            description: "Manage survey and audit checklist templates, sections, and items.",
            icon: ClipboardList,
            to: "/admin/checklists",
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            title: "Breakdown Templates",
            description: "Manage hierarchical equipment breakdown templates for different vessel types.",
            icon: Network,
            to: "/admin/breakdown-templates",
            color: "text-emerald-600",
            bgColor: "bg-emerald-50"
        },
        {
            title: "User Permissions",
            description: "Configure system roles, access control, and organization structures.",
            icon: ShieldCheck,
            to: "/admin/permissions",
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            disabled: true
        },
        {
            title: "Employee Directory",
            description: "Manage system users, surveyors, and contact information.",
            icon: Users,
            to: "/admin/employees",
            color: "text-pink-600",
            bgColor: "bg-pink-50",
            disabled: true
        },
        {
            title: "System settings",
            description: "Configure global system parameters and integration settings.",
            icon: Settings,
            to: "/admin/settings",
            color: "text-slate-600",
            bgColor: "bg-slate-50",
            disabled: true
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Administration Console</h1>
                <p className="text-muted-foreground mt-1">Select a management module to configure system assets and parameters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {adminModules.map((module) => (
                    <div
                        key={module.to}
                        className={cn(
                            "group relative bg-card border rounded-xl p-4 shadow-sm transition-all duration-300",
                            module.disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
                        )}
                    >
                        <div className="flex flex-col h-full gap-3">
                            <div className="flex items-start gap-3">
                                <div className={cn("p-2 rounded-lg shrink-0", module.bgColor, module.color)}>
                                    <module.icon size={20} />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <h3 className="font-bold text-sm text-slate-800 leading-tight">{module.title}</h3>
                                    <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                                        {module.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto pt-2 flex items-center justify-between">
                                {module.disabled ? (
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Coming Soon</span>
                                ) : (
                                    <Link
                                        to={module.to}
                                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary group-hover:gap-2 transition-all"
                                    >
                                        Manage <ArrowRight size={12} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
