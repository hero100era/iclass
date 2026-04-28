import { Anchor, Flag, Network } from "lucide-react";
import { Link } from "react-router";
import { StatusBadge } from "~/components/ui/DetailHelpers";

import type { Ship } from "~/definitions/database.iclass.types";

interface VesselHeaderProps {
  vessel: Ship & { status?: string };
}

export function VesselHeader({ vessel }: VesselHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6 items-start">
          <div className="hidden sm:block">
            <div className="bg-[#005EAA]/10 p-3 rounded-full">
              <Anchor className="w-8 h-8 text-[#005EAA]" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">{vessel.name}</h1>
                <StatusBadge status={vessel.status || "Active"} />
              </div>
              <Link
                to={`/vessels/${vessel.id}/breakdowns`}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95"
              >
                <Network size={14} className="text-primary" /> Breakdown
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">IMO:</span> {vessel.imo_number}
              </span>
              <span className="flex items-center gap-1.5">
                <Flag className="w-4 h-4" />
                {vessel.flag_code}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
