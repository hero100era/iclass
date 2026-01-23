import { Search, Filter, MoreVertical, Briefcase } from "lucide-react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { Pagination } from "~/components/Pagination";
import { ApiGET } from "~/.server/lib/api";
import type { Route } from "./+types/index";

const ITEM_PER_PAGE = 10;

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = ITEM_PER_PAGE;
    const offset = (page - 1) * limit;

    const host = process.env.API_URL || "http://localhost:2000";
    // Using the new consolidated view
    const pgrst_query_str = `${host}/surveyor_jobs?limit=${limit}&offset=${offset}&order=created_at.desc`;
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
    const [searchParams, setSearchParams] = useSearchParams();

    const handlePageChange = (page: number) => {
        setSearchParams((prev) => {
            prev.set("page", page.toString());
            return prev;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
                    <p className="text-muted-foreground">View and manage your assigned survey and audit jobs.</p>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search jobs by ship, company, or location..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-card focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                    <Filter size={18} />
                    <span>Filter</span>
                </button>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Job ID</th>
                            <th className="px-6 py-4 font-semibold">Type</th>
                            <th className="px-6 py-4 font-semibold">Ship / Company</th>
                            <th className="px-6 py-4 font-semibold">Location</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                                    No jobs found.
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job: any) => (
                                <tr key={job.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <Link to={`/jobs/${job.id}`} className="font-medium text-primary hover:underline">
                                            #{job.id}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                            job.job_type === "Survey" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                        )}>
                                            <Briefcase size={12} />
                                            {job.job_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{job.ship_name}</div>
                                        <div className="text-xs text-muted-foreground">{job.company_name}</div>
                                    </td>
                                    <td className="px-6 py-4">{job.location}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-semibold uppercase",
                                            getStatusColor(job.job_status)
                                        )}>
                                            {job.job_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1 hover:bg-muted rounded text-muted-foreground">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
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
    switch (status) {
        case "assigned": return "bg-blue-100 text-blue-700";
        case "executing": return "bg-yellow-100 text-yellow-700";
        case "completed": return "bg-green-100 text-green-700";
        case "cancelled": return "bg-gray-100 text-gray-700";
        default: return "bg-muted text-muted-foreground";
    }
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
