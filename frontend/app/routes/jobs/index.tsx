import React from "react";
import { Search, Filter, MoreVertical, Briefcase, ChevronDown, ChevronRight } from "lucide-react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { Pagination } from "~/components/Pagination";
import { ApiGET } from "~/.server/lib/api";
import type { Route } from "./+types/index";

interface Job {
    id: number;
    job_type: string;
    job_status: string;
    location: string;
    created_at: string;
    survey_jobs?: Record<string, unknown>[];
    audit_jobs?: Record<string, unknown>[];
    ms_jobs?: Record<string, unknown>[];
    [key: string]: unknown;
}

const ITEM_PER_PAGE = 10;

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = ITEM_PER_PAGE;
    const offset = (page - 1) * limit;

    const host = process.env.API_URL || "http://localhost:2000";

    // Select parent jobs and embed sub-jobs via foreign key inference
    const pgrst_query_str = `${host}/jobs?select=*,survey_jobs(*,ships(name)),audit_jobs(*,ships(name),organizations(name)),ms_jobs(*,ships(name),organizations(name))&limit=${limit}&offset=${offset}&order=created_at.desc`;

    const res = await ApiGET(request, pgrst_query_str, {
        "Prefer": "count=exact"
    });

    if (!res.ok) {
        return { jobs: [], totalPages: 0, currentPage: page };
    }

    const jobs = await res.json();
    const contentRange = res.headers.get("Content-Range");
    let totalCount = 0;
    if (contentRange) {
        const parts = contentRange.split("/");
        if (parts.length > 1) {
            totalCount = parseInt(parts[1], 10);
        }
    }

    const totalPages = Math.ceil(totalCount / limit);
    return { jobs, totalPages, currentPage: page };
}


export default function JobList() {
    const { jobs, totalPages, currentPage } = useLoaderData<typeof loader>();
    const [, setSearchParams] = useSearchParams();
    const [expandedJobs, setExpandedJobs] = React.useState<Record<number, boolean>>({});

    const handlePageChange = (page: number) => {
        setSearchParams((prev) => {
            prev.set("page", page.toString());
            return prev;
        });
    };

    const toggleExpand = (jobId: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setExpandedJobs(prev => ({
            ...prev,
            [jobId]: !prev[jobId]
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
                    <p className="text-muted-foreground">View and manage assigned jobs and their parts.</p>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search jobs by location..."
                        className="w-full pl-10 pr-4 py-1.5 text-sm border rounded-lg bg-card focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    />
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors">
                    <Filter size={16} />
                    <span>Filter</span>
                </button>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Job Reference</th>
                            <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Ship / Company</th>
                            <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Location / Description</th>
                            <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                    No jobs found.
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job: Job) => {
                                const isExpanded = !!expandedJobs[job.id];
                                const hasSubJobs = (job.survey_jobs?.length > 0) || (job.audit_jobs?.length > 0) || (job.ms_jobs?.length > 0);
                                return (
                                    <React.Fragment key={job.id}>
                                        <tr
                                            className="hover:bg-muted/30 transition-colors group bg-muted/5 cursor-pointer"
                                            onClick={(e) => hasSubJobs && toggleExpand(job.id, e)}
                                        >
                                            <td className="px-4 py-2.5 font-medium text-primary flex items-center gap-2">
                                                {hasSubJobs ? (
                                                    <button
                                                        className="p-0.5 rounded hover:bg-muted-foreground/10 text-muted-foreground"
                                                        onClick={(e) => toggleExpand(job.id, e)}
                                                    >
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </button>
                                                ) : (
                                                    <div className="w-4" />
                                                )}
                                                #{job.id}
                                            </td>
                                            <td className="px-4 py-2.5 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Parent Job</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">-</td>
                                            <td className="px-4 py-2.5 font-medium">{job.location || '-'}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                                                    getStatusColor(job.job_status)
                                                )}>
                                                    {job.job_status || 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="relative inline-block text-left group/dropdown">
                                                    <button className="p-1 hover:bg-muted rounded text-muted-foreground outline-none">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    {/* Dropdown menu */}
                                                </div>
                                            </td>
                                        </tr>

                                        {isExpanded && job.survey_jobs?.map((sj: Record<string, unknown>) => (
                                            <tr key={`sj-${sj.id}`} className="hover:bg-muted/50 transition-colors group">
                                                <td className="px-4 py-2 pl-12 text-[13px]">
                                                    <Link to={`/surveys/${sj.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                                                        <div className="w-2.5 h-[1px] bg-muted-foreground mr-1"></div>
                                                        Survey #{sj.id}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 uppercase tracking-wide">
                                                        <Briefcase size={10} /> Survey
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-[13px]">
                                                    <div className="font-medium">{sj.ships?.name || 'No Ship'}</div>
                                                </td>
                                                <td className="px-4 py-2 text-[13px] text-muted-foreground" colSpan={3}>
                                                    {sj.description || 'No Description'}
                                                </td>
                                                <td className="px-4 py-2 text-right hover:bg-muted/10"></td>
                                            </tr>
                                        ))}

                                        {isExpanded && job.audit_jobs?.map((aj: Record<string, unknown>) => (
                                            <tr key={`aj-${aj.id}`} className="hover:bg-muted/50 transition-colors group">
                                                <td className="px-4 py-2 pl-12 text-[13px]">
                                                    <Link to={`/audits/${aj.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                                                        <div className="w-2.5 h-[1px] bg-muted-foreground mr-1"></div>
                                                        Audit #{aj.id}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 uppercase tracking-wide">
                                                        <Briefcase size={10} /> Audit
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-[13px]">
                                                    <div className="font-medium">{aj.ships?.name || 'No Ship'}</div>
                                                    <div className="text-[11px] text-muted-foreground leading-tight">{aj.organizations?.name || 'No Company'}</div>
                                                </td>
                                                <td className="px-4 py-2 text-[13px] text-muted-foreground" colSpan={3}>
                                                    {aj.description || 'No Description'}
                                                </td>
                                                <td className="px-4 py-2 text-right hover:bg-muted/10"></td>
                                            </tr>
                                        ))}

                                        {isExpanded && job.ms_jobs?.map((mj: Record<string, unknown>) => (
                                            <tr key={`mj-${mj.id}`} className="hover:bg-muted/50 transition-colors group">
                                                <td className="px-4 py-2 pl-12 text-[13px]">
                                                    <Link to={`/ms_jobs/${mj.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                                                        <div className="w-2.5 h-[1px] bg-muted-foreground mr-1"></div>
                                                        MS Job #{mj.id}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 uppercase tracking-wide">
                                                        <Briefcase size={10} /> MS
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-[13px]">
                                                    <div className="font-medium">{mj.ships?.name || 'No Ship'}</div>
                                                    <div className="text-[11px] text-muted-foreground leading-tight">{mj.organizations?.name || 'No Company'}</div>
                                                </td>
                                                <td className="px-4 py-2 text-[13px] text-muted-foreground" colSpan={3}>
                                                    -
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
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    className="border-t bg-muted/10"
                />
            </div>
        </div>
    );
}

function getStatusColor(status: string) {
    if (!status) return "bg-gray-100 text-gray-700";
    switch (status.toLowerCase()) {
        case "assigned": return "bg-blue-100 text-blue-700";
        case "executing": return "bg-yellow-100 text-yellow-700";
        case "completed": return "bg-green-100 text-green-700";
        case "cancelled": return "bg-gray-100 text-gray-700";
        default: return "bg-muted text-muted-foreground";
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

