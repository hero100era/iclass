import { ChevronRight, ChevronDown, Briefcase } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export interface SurveyJobItem {
  id: number;
  description?: string;
  created_at?: string;
  survey_jobs?: SurveyJobItem[];
  jobs?: {
    job_status?: string;
    survey_jobs?: SurveyJobItem[];
    ms_jobs?: MSJobItem[];
  };
  ships?: {
    name: string;
    imo_number?: string;
  };
}

export interface MSJobItem {
  id: number;
  organizations?: { name: string };
}

interface SurveyJobRowProps {
  survey: SurveyJobItem;
  isExpanded: boolean;
  onToggle: () => void;
  statusColor: (status?: string | null) => string;
  onCreateAttached: (type: string, survey: SurveyJobItem) => void;
}

export function SurveyJobRow({
  survey,
  isExpanded,
  onToggle,
  statusColor,
  onCreateAttached,
}: SurveyJobRowProps) {
  const childSurveys = survey.survey_jobs || [];
  const siblingSurveys = (survey.jobs?.survey_jobs || []).filter(
    (s: SurveyJobItem) => s.id !== survey.id,
  );
  const msJobs = survey.jobs?.ms_jobs || [];

  const allAttached = [...childSurveys, ...siblingSurveys];
  const hasSubJobs = allAttached.length > 0 || msJobs.length > 0;

  return (
    <>
      <tr
        className={cn("group hover:bg-slate-50/80 transition-all", isExpanded && "bg-slate-50/50")}
      >
        <td className="w-10 px-4 py-4">
          {hasSubJobs && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#005EAA]/5 flex items-center justify-center text-[#005EAA]">
              <Briefcase size={16} />
            </div>
            <div>
              <Link
                to={`/surveys/${survey.id}`}
                className="text-sm font-bold text-slate-900 hover:text-primary transition-colors"
              >
                {survey.ships?.name || "Unknown Vessel"}
              </Link>
              <p className="text-[10px] text-slate-400 font-mono">
                IMO: {survey.ships?.imo_number || "N/A"}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <p className="text-sm text-slate-600 line-clamp-1">
            {survey.description || "No description"}
          </p>
        </td>
        <td className="px-4 py-4">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border",
              statusColor(survey.jobs?.job_status),
            )}
          >
            {survey.jobs?.job_status || "Unknown"}
          </span>
        </td>
        <td className="px-4 py-4 text-slate-500 text-xs">
          {survey.created_at ? new Date(survey.created_at).toLocaleDateString() : "-"}
        </td>
        <td className="px-4 py-4 text-right">
          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onCreateAttached("attached_survey", survey)}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Creat Sub Survey Job
            </button>
            <button
              onClick={() => onCreateAttached("ms_job", survey)}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Create MS Job
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && hasSubJobs && (
        <tr>
          <td colSpan={6} className="px-8 py-0 bg-slate-50/30">
            <div className="border-l-2 border-slate-200 ml-5 overflow-hidden">
              <table className="w-full text-left">
                <tbody>
                  {allAttached.map((sub: SurveyJobItem) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-100/50 transition-colors border-b border-slate-100 last:border-0"
                    >
                      <td className="px-6 py-3">
                        <Link
                          to={`/surveys/${sub.id}`}
                          className="text-xs font-bold text-slate-700 hover:text-primary"
                        >
                          Attached Survey
                        </Link>
                        <p className="text-[10px] text-slate-400">{sub.description}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                            statusColor(sub.jobs?.job_status),
                          )}
                        >
                          {sub.jobs?.job_status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {msJobs.map((ms: MSJobItem) => (
                    <tr
                      key={ms.id}
                      className="hover:bg-slate-100/50 transition-colors border-b border-slate-100 last:border-0"
                    >
                      <td className="px-6 py-3">
                        <div className="text-xs font-bold text-amber-600">MS Job</div>
                        <p className="text-[10px] text-slate-400">
                          {ms.organizations?.name || "Technical Department"}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          to={`/ms-jobs/${ms.id}`}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
