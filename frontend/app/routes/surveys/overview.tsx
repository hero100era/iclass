import { Info } from "lucide-react";

export default function JobOverview() {
  return (
    <div className="bg-white border border-slate-200 rounded shadow-sm min-h-full p-8 flex flex-col items-center justify-center text-slate-400 space-y-3">
      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
        <Info size={24} className="opacity-30 text-[#005EAA]" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-bold text-slate-600 italic">Job Overview</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Please select an item from the <strong>Job Manual</strong> on the left to begin reporting.
        </p>
      </div>
    </div>
  );
}
