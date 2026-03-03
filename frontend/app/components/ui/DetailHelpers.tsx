import React from "react";

export function StatusBadge({ status }: { status: string }) {
    const isActive = status?.toLowerCase() === "active" || status?.toLowerCase() === "valid";
    return (
        <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
        >
            {status || "Unknown"}
        </span>
    );
}

export function GridItem({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string; size?: number }> }) {
    return (
        <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
            </dt>
            <dd className="text-sm font-medium text-slate-900 break-words">{value || "-"}</dd>
        </div>
    );
}
