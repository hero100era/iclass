import { Plus, Minus, Activity } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/Accordion";
import { StatusBadge } from "~/components/ui/DetailHelpers";
import { useState } from "react";

interface Survey {
  id: number;
  code?: string;
  description?: string;
  last_held_date?: string;
  place_held?: string;
  next_due_date?: string;
  status?: string;
  is_ordered?: boolean;
}

interface OtherSurvey {
  id: number;
  name: string;
  description?: string;
  code?: string;
}

interface SurveysTableProps {
  surveys: Survey[];
  otherSurveys: OtherSurvey[];
  isItemSelected: (id: number | string, type: "survey" | "finding" | "other") => boolean;
  onToggleItem: (item: Survey | OtherSurvey, type: "survey" | "finding" | "other") => void;
}

export function SurveysTable({
  surveys,
  otherSurveys,
  isItemSelected,
  onToggleItem,
}: SurveysTableProps) {
  const [showOtherSelector, setShowOtherSelector] = useState(false);

  return (
    <AccordionItem value="surveys" className="overflow-visible">
      <AccordionTrigger>
        <span className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-400" /> Surveys & Audits ({surveys.length})
        </span>
      </AccordionTrigger>
      <AccordionContent className="overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Last Held</th>
                <th className="px-4 py-3 font-medium">Next Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {surveys.map((survey) => (
                <tr key={survey.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-600">{survey.code}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{survey.description}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{survey.last_held_date}</div>
                    <div className="text-xs text-slate-400">{survey.place_held}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{survey.next_due_date || "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={survey.status || "--"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onToggleItem(survey, "survey")}
                      disabled={survey.is_ordered}
                      className={`p-1.5 rounded-md transition-colors ${
                        survey.is_ordered
                          ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                          : isItemSelected(survey.id, "survey")
                            ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {isItemSelected(survey.id, "survey") ? (
                        <Minus size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="relative">
            <button
              onClick={() => setShowOtherSelector(!showOtherSelector)}
              className="text-[#005EAA] hover:text-[#004a85] text-sm font-medium underline underline-offset-4 flex items-center gap-1"
            >
              <Plus size={16} /> Request Occasional Survey(s)
            </button>
            {showOtherSelector && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOtherSelector(false)} />
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Available Surveys
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {otherSurveys.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onToggleItem(item, "other");
                          setShowOtherSelector(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="text-sm font-semibold text-slate-900 group-hover:text-[#005EAA]">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {item.description}
                          </div>
                        </div>
                        {isItemSelected(item.id, "other") ? (
                          <Minus size={16} className="text-amber-500" />
                        ) : (
                          <Plus size={16} className="text-slate-300 group-hover:text-[#005EAA]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
