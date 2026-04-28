import { ListChecks } from "lucide-react";
import { useLoaderData, useSubmit } from "react-router";
import {
  getChecklistData,
  updateChecklistResult,
  updateChecklistParticulars,
} from "./checklist.server";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { ParticularsTable, type ParticularItem } from "./components/checklist/ParticularsTable";

import type {
  SurveyLine,
  SurveyChecklist,
  ChecklistResult,
} from "~/definitions/database.iclass.types";
import type { Route } from "./+types/checklist";

interface ExtendedChecklist extends SurveyChecklist {
  checklist_items: {
    id: number;
    content: string;
    item_number: number;
    reg_reference?: string;
    checklist_sections: {
      id: number;
      title: string;
      section_number: string;
    };
  };
  particulars?: ParticularItem[];
}

interface SectionGroup {
  section: {
    id: number;
    title: string;
    section_number: string;
  };
  items: ExtendedChecklist[][];
}

interface ExtendedSurveyLine extends SurveyLine {
  survey_status?: "partial" | "scheduled" | "executing" | "completed" | "postponed" | null;
  survey_audits?: { description: string; cert_code: string };
  survey_pool?: { name: string; code: string };
}

export async function loader(args: Route.LoaderArgs) {
  return await getChecklistData(args);
}

export async function action(args: Route.ActionArgs) {
  const formData = await args.request.formData();
  const intent = formData.get("intent");
  if (intent === "update_result") {
    return await updateChecklistResult(args, {
      id: Number(formData.get("id")),
      result: String(formData.get("result")),
    });
  }
  if (intent === "update_particulars") {
    return await updateChecklistParticulars(args, {
      id: Number(formData.get("id")),
      particularsJson: String(formData.get("particulars")),
    });
  }
  return { error: "Unknown action" };
}

export default function JobChecklist() {
  const { surveyLines, surveyChecklists, checklistResults } = useLoaderData<
    typeof loader
  >() as unknown as {
    surveyLines: ExtendedSurveyLine[];
    surveyChecklists: ExtendedChecklist[];
    checklistResults: ChecklistResult[];
  };
  const submit = useSubmit();
  const [activeLineId, setActiveLineId] = useState<number | null>(surveyLines?.[0]?.id || null);

  const currentChecklist = (surveyChecklists || []).filter(
    (c) => c.survey_line_id === activeLineId,
  );

  const sections: Record<string, SectionGroup> = {};
  currentChecklist.forEach((c) => {
    const sec = c.checklist_items?.checklist_sections;
    if (sec?.id) sections[sec.id] = { section: sec, items: [] };
  });

  const sortedSections = Object.values(sections).sort((a, b) =>
    (a.section.section_number || "").localeCompare(b.section.section_number || "", undefined, {
      numeric: true,
    }),
  );

  sortedSections.forEach((s) => {
    const grouped: Record<number, ExtendedChecklist[]> = {};
    currentChecklist
      .filter((item) => item.checklist_items?.checklist_sections?.id === s.section.id)
      .forEach((item) => {
        if (item.item_id) (grouped[item.item_id] ||= []).push(item);
      });
    s.items = Object.values(grouped).sort(
      (a, b) => (a[0].checklist_items?.item_number || 0) - (b[0].checklist_items?.item_number || 0),
    );
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ListChecks size={20} className="text-primary" /> Checklist Reporting
          </h2>
          <p className="text-sm text-slate-500">
            Record verification results for each checklist item.
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        <aside className="w-64 shrink-0 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">
            Surveys in Scope
          </div>
          {surveyLines.map((line) => (
            <button
              key={line.id}
              onClick={() => setActiveLineId(line.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1",
                activeLineId === line.id
                  ? "bg-white border-primary border-2 shadow-md"
                  : "bg-white border-slate-200 hover:border-slate-300",
              )}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-[9px] font-bold uppercase w-fit px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  survey
                </span>
                {line.survey_status && (
                  <span
                    className={cn(
                      "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded",
                      line.survey_status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : line.survey_status === "postponed"
                          ? "bg-amber-100 text-amber-700"
                          : line.survey_status === "executing"
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {line.survey_status}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-700 line-clamp-2">
                {line.survey_audits?.description || line.survey_pool?.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {line.survey_audits?.cert_code || line.survey_pool?.code}
              </span>
            </button>
          ))}
        </aside>

        <div className="flex-1 min-w-0 space-y-3 pb-20">
          {!activeLineId ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
              Select a survey to begin.
            </div>
          ) : sortedSections.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
              No checklist items found.
            </div>
          ) : (
            sortedSections.map((sect) => (
              <div
                key={sect.section.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
              >
                <div className="px-3 py-1.5 bg-slate-50 border-b flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {sect.section.section_number}
                  </span>
                  <h3 className="text-[11px] font-bold text-slate-700 uppercase">
                    {sect.section.title}
                  </h3>
                </div>
                <div className="divide-y">
                  {sect.items.map((instances) => (
                    <div key={instances[0].id} className="p-3 space-y-2">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 flex gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {instances[0].checklist_items?.item_number}.
                          </span>
                          <div>
                            <p className="text-xs text-slate-800 leading-normal">
                              {instances[0].checklist_items?.content}
                            </p>
                            {instances[0].checklist_items?.reg_reference && (
                              <p className="text-[9px] text-slate-400 italic">
                                Ref: {instances[0].checklist_items.reg_reference}
                              </p>
                            )}
                          </div>
                        </div>
                        <select
                          value={instances[0].result || ""}
                          onChange={(e) =>
                            instances.forEach((i) =>
                              submit(
                                {
                                  intent: "update_result",
                                  id: i.id.toString(),
                                  result: e.target.value,
                                },
                                { method: "post" },
                              ),
                            )
                          }
                          className="bg-slate-100 border rounded-md py-0.5 px-2 text-[10px] font-bold"
                        >
                          {checklistResults.map((res) => (
                            <option key={res.code} value={res.code}>
                              {res.code}
                            </option>
                          ))}
                        </select>
                      </div>
                      <ParticularsTable
                        particulars={instances.flatMap((i) => i.particulars || [])}
                        submit={submit}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
