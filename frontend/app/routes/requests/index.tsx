import { ExternalLink, Filter, Search } from "lucide-react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { Pagination } from "~/components/Pagination";
import { getDb } from "~/.server/lib/api";

import type { Route } from "./+types/index";

interface SurveyRequest {
  id: number;
  ships?: { name?: string };
  location?: string;
  estimated_date?: string;
  status?: string;
  is_assigned?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

const ITEM_PER_PAGE = 20;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = ITEM_PER_PAGE;
  const offset = (page - 1) * limit;

  const db = await getDb(request);
  const { data: requests, count } = await db.get<SurveyRequest[]>("/survey_requests", {
    select: "*,ships(name)",
    limit,
    offset,
    order: "created_at.desc",
    prefer: { count: "exact" },
  });

  const totalPages = Math.ceil((count || 0) / limit);
  return { requests: requests || [], totalPages, currentPage: page };
}

export default function RequestList() {
  const { requests, totalPages, currentPage } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

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
          <h2 className="text-3xl font-bold tracking-tight">Survey Requests</h2>
          <p className="text-muted-foreground">
            Review and manage incoming survey and audit requests.
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search requests by vessel or location..."
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
              <th className="px-6 py-4 font-semibold">Vessel</th>
              <th className="px-6 py-4 font-semibold">Location</th>
              <th className="px-6 py-4 font-semibold">Est. Date</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Assigned</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No survey requests found.
                </td>
              </tr>
            ) : (
              requests.map((req: SurveyRequest) => (
                <tr key={req.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-primary">
                      {req.ships?.name || "Unknown Vessel"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{req.location}</td>
                  <td className="px-6 py-4">{req.estimated_date}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status || "pending"} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    {req.is_assigned ? (
                      <span className="text-green-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-orange-600 font-semibold">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/requests/${req.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Review <ExternalLink size={14} />
                    </Link>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    assigned: "bg-purple-100 text-purple-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-muted text-muted-foreground"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
