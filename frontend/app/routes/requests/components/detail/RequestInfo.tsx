import { MapPin, Calendar, Phone, Mail, User } from "lucide-react";

import type { RequestDetailData } from "./RequestHeader";

interface RequestInfoProps {
  request: RequestDetailData & { name?: string; imo_number?: string };
}

export function RequestInfo({ request }: RequestInfoProps) {
  const ship = request.ships?.[0] || { name: request.name, imo_number: request.imo_number };
  const owner = request.organizations?.[0] || { name: request.name };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Vessel & Owner
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold text-slate-900">{ship.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">IMO: {ship.imo_number}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">Registered Owner</p>
            <p className="text-sm font-bold text-slate-900">{owner.name}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Contact Information
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-slate-600">
            <User size={14} className="mt-0.5 shrink-0" />
            <span className="text-sm font-medium">{request.contact_person}</span>
          </div>
          <div className="flex items-start gap-2 text-slate-600">
            <Mail size={14} className="mt-0.5 shrink-0" />
            <span className="text-sm">{request.contact_email}</span>
          </div>
          <div className="flex items-start gap-2 text-slate-600">
            <Phone size={14} className="mt-0.5 shrink-0" />
            <span className="text-sm">{request.contact_phone}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Service Details
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-slate-600">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            <span className="text-sm">{request.location}</span>
          </div>
          <div className="flex items-start gap-2 text-slate-600">
            <Calendar size={14} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-400">Estimated Date</p>
              <span className="text-sm font-bold">{request.estimated_date}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
