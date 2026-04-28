import { MessageSquare, Lock, Plus, Minus } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/Accordion";
import { StatusBadge } from "~/components/ui/DetailHelpers";

import type { FindingComment } from "~/definitions/database.iclass.types";

interface Finding {
  id: number;
  comment_type: string;
  date_issued?: string;
  due_date?: string;
  certificates?: string;
  status?: string;
  text?: string;
  mms_reference?: string;
  priviate?: boolean;
}

interface FindingsListProps {
  findings: Finding[];
  isItemSelected: (id: number | string, type: "survey" | "finding" | "other") => boolean;
  onToggleItem: (item: Finding | FindingComment, type: "survey" | "finding" | "other") => void;
}

export function FindingsList({ findings, isItemSelected, onToggleItem }: FindingsListProps) {
  return (
    <AccordionItem value="findings">
      <AccordionTrigger>
        <span className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-400" /> Findings & Comments (
          {findings.length})
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-6">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col md:flex-row"
            >
              <div className="md:w-64 bg-slate-50/50 p-4 border-b md:border-b-0 md:border-r border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={finding.comment_type} />
                  {finding.priviate && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">
                      Issue Date
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {finding.date_issued}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">
                      Due Date
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {finding.due_date || "—"}
                    </span>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200">
                  <button
                    onClick={() => onToggleItem(finding, "finding")}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isItemSelected(finding.id, "finding")
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-[#005EAA]/10 text-[#005EAA] hover:bg-[#005EAA]/20"
                    }`}
                  >
                    {isItemSelected(finding.id, "finding") ? (
                      <Minus size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                    {isItemSelected(finding.id, "finding") ? "Remove" : "Add to Request"}
                  </button>
                </div>
              </div>
              <div className="flex-1 p-5">
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {finding.text}
                </div>
                {finding.mms_reference && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 font-mono">
                    Ref: {finding.mms_reference}
                  </div>
                )}
              </div>
            </div>
          ))}
          {findings.length === 0 && (
            <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-lg text-slate-500 italic">
              No findings or comments recorded.
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
