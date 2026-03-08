import React from "react";
import { Search, Filter, MoreVertical, Briefcase, ChevronDown, ChevronRight } from "lucide-react";
import { Link, useLoaderData, useSearchParams, useSubmit } from "react-router";
import { Pagination } from "~/components/Pagination";
import { getDb, filter, type FilterOperator } from "~/.server/lib/api";
import { cn } from "~/lib/utils";

import type { Route } from "./+types/index";

const ITEM_PER_PAGE = 10;

interface Job {
  location?: string;
  job_status?: string;
  created_at?: string;
}

interface Ship {
  name?: string;
}

interface Organization {
  name?: string;
}

interface SurveyJob {
  id: number;
  job_id?: number;
  ship_id?: number | null;
  description?: string;
  ships?: Ship;
  jobs?: Job & {
    ms_jobs?: (SurveyJob & { ships?: Ship; organizations?: Organization })[];
    survey_jobs?: SurveyJob[];
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const jobId = formData.get("jobId");
  const shipId = formData.get("shipId");
  const parentId = formData.get("parentId");

  const db = await getDb(request);

  if (actionType === "create_attached_survey") {
    await db.post("/survey_jobs", {
      body: {
        job_id: Number(jobId),
        parent_id: Number(parentId),
        ship_id: shipId ? Number(shipId) : null,
        description: "Attached Survey",
      },
    });
  } else if (actionType === "create_attached_ms") {
    await db.post("/ms_jobs", {
      body: {
        job_id: Number(jobId),
        ship_id: shipId ? Number(shipId) : null,
      },
    });
  }
  return { ok: true };
}


export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const search = url.searchParams.get("search") || "";
  const limit = ITEM_PER_PAGE;
  const offset = (page - 1) * limit;

  const db = await getDb(request);

  const filters: Record<string, FilterOperator> = { parent_id: "is.null" };
  if (search) {
    filters["jobs.location"] = filter.ilike(`*${search}*`);
  }

  const { data: surveys, count } = await db.get<SurveyJob[]>("/survey_jobs", {
    select:
      "*,jobs(*,ms_jobs(*,ships(name),organizations(name)),survey_jobs(*,ships(name))),ships(name)",
    filters,
    limit,
    offset,
    order: "id.desc",
    prefer: { count: "exact" },
  });

  const totalPages = Math.ceil((count || 0) / limit);
  return { surveys: surveys || [], totalPages, currentPage: page, limit, search };
}


export default function SurveyDashboard() {
  const { surveys, totalPages, currentPage, search } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const [expandedJobs, setExpandedJobs] = React.useState<Record<number, boolean>>({});
  const submit = useSubmit();

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      prev.set("page", page.toString());
      return prev;
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams((prev) => {
      prev.set("search", e.target.value);
      prev.set("page", "1");
      return prev;
    });
  };

  const toggleExpand = (surveyId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedJobs(prev => ({
      ...prev,
      [surveyId]: !prev[surveyId]
    }));
  };

  const handleCreateAttached = (actionType: string, survey: SurveyJob) => {
    const formData = new FormData();
    formData.append("actionType", actionType);
    formData.append("jobId", String(survey.job_id));
    if (survey.ship_id) formData.append("shipId", String(survey.ship_id));
    formData.append("parentId", String(survey.id));
    submit(formData, { method: "post" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Survey Dashboard</h2>
          <p className="text-muted-foreground">Planning and oversight of upcoming vessel surveys.</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search surveys by location..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-1.5 text-sm border rounded-lg bg-card focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors">
          <Filter size={16} />
          <span>Filter</span>
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Survey ID</th>
                <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Ship</th>
                <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Description / Location</th>
                <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y relative">
              {surveys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No surveys found.
                  </td>
                </tr>
              ) : (
                surveys.map((survey: SurveyJob) => {
                  const isExpanded = !!expandedJobs[survey.id];
                  const subSurveys = (survey.jobs?.survey_jobs || []).filter((sj: SurveyJob) => sj.id !== survey.id);
                  const msJobs = survey.jobs?.ms_jobs || [];
                  const hasSubJobs = subSurveys.length > 0 || msJobs.length > 0;

                  return (
                    <React.Fragment key={survey.id}>
                      <tr
                        className="hover:bg-muted/30 transition-colors group bg-muted/5 cursor-pointer"
                        onClick={(e) => hasSubJobs && toggleExpand(survey.id, e)}
                      >
                        <td className="px-4 py-2.5 font-medium text-primary flex items-center gap-2">
                          {hasSubJobs ? (
                            <button
                              className="p-0.5 rounded hover:bg-muted-foreground/10 text-muted-foreground"
                              onClick={(e) => toggleExpand(survey.id, e)}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <div className="w-4" />
                          )}
                          <Link to={`/surveys/${survey.id}`} className="hover:underline">
                            #{survey.id}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Main Survey</td>
                        <td className="px-4 py-2.5 font-medium">{survey.ships?.name || "-"}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium max-w-xs truncate" title={survey.description || ""}>{survey.description || "-"}</div>
                          <div className="text-[11px] text-muted-foreground leading-tight">{survey.jobs?.location || "-"}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                            getStatusColor(survey.jobs?.job_status)
                          )}>
                            {survey.jobs?.job_status || "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {survey.jobs?.created_at ? new Date(survey.jobs.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-right relative" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block text-left group/dropdown">
                            <button className="p-1 hover:bg-muted rounded text-muted-foreground outline-none">
                              <MoreVertical size={16} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover/dropdown:block bg-card border shadow-md rounded-md z-10 w-48 py-1">
                              <button
                                onClick={() => handleCreateAttached("create_attached_survey", survey)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                              >
                                Create Attached Survey
                              </button>
                              <button
                                onClick={() => handleCreateAttached("create_attached_ms", survey)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                              >
                                Create Attached MS Job
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && subSurveys.map((sj: SurveyJob) => (
                        <tr key={`sj-${sj.id}`} className="hover:bg-muted/50 transition-colors group">
                          <td className="px-4 py-2 pl-12 text-[13px]">
                            <Link to={`/surveys/${sj.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                              <div className="w-2.5 h-[1px] bg-muted-foreground mr-1"></div>
                              Survey #{sj.id}
                            </Link>
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 uppercase tracking-wide">
                              <Briefcase size={10} /> Sub-Survey
                            </span>
                          </td>
                          <td className="px-4 py-2 text-[13px] font-medium">
                            {sj.ships?.name || '-'}
                          </td>
                          <td className="px-4 py-2 text-[13px] text-muted-foreground" colSpan={3}>
                            {sj.description || 'Attached Survey'}
                          </td>
                          <td className="px-4 py-2 text-right hover:bg-muted/10"></td>
                        </tr>
                      ))}

                      {isExpanded && msJobs.map((mj: { id: number; ships?: Ship; organizations?: Organization }) => (
                        <tr key={`mj-${mj.id}`} className="hover:bg-muted/50 transition-colors group">
                          <td className="px-4 py-2 pl-12 text-[13px]">
                            <Link to={`/ms_jobs/${mj.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                              <div className="w-2.5 h-[1px] bg-muted-foreground mr-1"></div>
                              MS Job #{mj.id}
                            </Link>
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 uppercase tracking-wide">
                              <Briefcase size={10} /> MS Job
                            </span>
                          </td>
                          <td className="px-4 py-2 text-[13px] font-medium">
                            {mj.ships?.name || '-'}
                            <div className="text-[11px] text-muted-foreground leading-tight">{mj.organizations?.name || 'No Company'}</div>
                          </td>
                          <td className="px-4 py-2 text-[13px] text-muted-foreground" colSpan={3}>
                            Attached MS Job
                          </td>
                          <td className="px-4 py-2 text-right hover:bg-muted/10"></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="border-t bg-muted/10 mt-auto"
        />
      </div>
    </div>
  );
}

function getStatusColor(status?: string) {
  if (!status) return "bg-gray-100 text-gray-700";
  switch (status.toLowerCase()) {
    case "assigned": return "bg-blue-100 text-blue-700";
    case "executing": return "bg-yellow-100 text-yellow-700";
    case "completed": return "bg-green-100 text-green-700";
    case "cancelled": return "bg-gray-100 text-gray-700";
    default: return "bg-muted text-muted-foreground";
  }
}
