import { useLoaderData, useSearchParams, useSubmit } from "react-router";
import { getDb } from "~/.server/lib/api";
import { useState } from "react";
import { SurveyJobRow, type SurveyJobItem } from "./components/dashboard/SurveyJobRow";

import { SurveyFilters } from "./components/dashboard/SurveyFilters";

import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const db = await getDb(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const page = Number(url.searchParams.get("page") || "1");
  const limit = 20;

  const { data: surveys } = await db.get<SurveyJobItem[]>("/survey_jobs", {
    select:
      "*,ships(*),jobs(*,ms_jobs(*,ships(*),organizations(*)),survey_jobs(*,ships(*))),survey_jobs(*,ships(*))",
    filters: { parent_id: "is.null" },
    order: "id.desc",
    limit,
    offset: (page - 1) * limit,
  });

  return { surveys: surveys || [], q, page };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "create_attached") {
    // Implementation...
    return { success: true };
  }
  return { error: "Unknown action" };
}

export default function SurveyDashboard() {
  const { surveys, q } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const submit = useSubmit();

  const handleSearch = (query: string) => {
    setSearchParams((prev) => {
      if (query) prev.set("q", query);
      else prev.delete("q");
      return prev;
    });
  };

  const statusColor = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Survey Dashboard</h1>
        <p className="text-sm text-slate-500">Manage and track vessel survey activities.</p>
      </div>

      <SurveyFilters searchQuery={q} onSearch={handleSearch} />

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Ship / Vessel</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {surveys.map((survey: SurveyJobItem) => (
              <SurveyJobRow
                key={survey.id}
                survey={survey}
                isExpanded={expandedIds.has(survey.id)}
                onToggle={() => {
                  const next = new Set(expandedIds);
                  if (next.has(survey.id)) next.delete(survey.id);
                  else next.add(survey.id);
                  setExpandedIds(next);
                }}
                statusColor={statusColor}
                onCreateAttached={(type, s) =>
                  submit({ intent: "create_attached", type, id: s.id }, { method: "post" })
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
