import { ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

import type { BreakdownTemplateData } from "../index";

interface TemplateListProps {
    templates: BreakdownTemplateData[];
    selectedId?: number;
    onSelect: (tmpl: BreakdownTemplateData) => void;
}

export function TemplateList({ templates, selectedId, onSelect }: TemplateListProps) {
    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm divide-y">
            {templates.map((tmpl) => (
                <button
                    key={tmpl.id}
                    onClick={() => onSelect(tmpl)}
                    className={cn(
                        "w-full text-left px-4 py-3 flex items-center justify-between group transition-all",
                        selectedId === tmpl.id ? "bg-emerald-50 border-l-4 border-l-emerald-500" : "hover:bg-slate-50 border-l-4 border-l-transparent"
                    )}
                >
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400">{tmpl.code}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">v{tmpl.version}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-700">{tmpl.name}</div>
                        <div className="text-[10px] text-slate-500 italic">{tmpl.vessel_type}</div>
                    </div>
                    <ChevronRight size={14} className={cn("text-slate-300", selectedId === tmpl.id ? "translate-x-1 text-emerald-500" : "opacity-0 group-hover:opacity-100")} />
                </button>
            ))}
            {templates.length === 0 && <div className="p-8 text-center text-slate-400 italic text-xs">No templates defined</div>}
        </div>
    );
}
