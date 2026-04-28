import { ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

interface Survey {
  id: number;
  code: string;
  name: string;
}

interface SurveySidebarProps {
  surveys: Survey[];
  selectedSurveyId?: number;
  onSelect: (survey: Survey) => void;
}

export function SurveySidebar({ surveys, selectedSurveyId, onSelect }: SurveySidebarProps) {
  return (
    <div className="space-y-1 h-full">
      <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">
        Survey Types
      </h3>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden h-full flex flex-col">
        <div className="divide-y divide-slate-100 overflow-y-auto">
          {surveys.map((survey) => (
            <button
              key={survey.id}
              onClick={() => onSelect(survey)}
              className={cn(
                "w-full text-left px-2 py-1.5 text-[11px] font-medium transition-colors flex items-center justify-between group",
                selectedSurveyId === survey.id
                  ? "bg-primary/5 text-primary"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <span>
                {survey.name} ({survey.code})
              </span>
              <ChevronRight
                size={12}
                className={cn(
                  "transition-transform",
                  selectedSurveyId === survey.id
                    ? "translate-x-1"
                    : "opacity-0 group-hover:opacity-100",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
