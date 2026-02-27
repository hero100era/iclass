import { Search, Plus, Filter, MoreVertical } from "lucide-react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { Pagination } from "~/components/Pagination";
import { ApiGET } from "~/.server/lib/api";
import type { Route } from "./+types/index";

const ITEM_PER_PAGE = 5;

import { getPaginationFromResponse } from "~/.server/lib/pagination";
import { type Ship } from "~/definitions/database.types";

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = ITEM_PER_PAGE;
    const offset = (page - 1) * limit;

    const host = process.env.API_URL || "http://localhost:2000";
    const pgrst_query_str = `${host}/ships?limit=${limit}&offset=${offset}`;

    // We expect ApiGET to return the generic type as a promise
    // Wait, ApiGET returns `Response as any` but handles generics.
    // If ApiGET returns Response, we can't do `const vessels = await res.json()`.
    // Let's adjust this to fetch the response then process it.
    const res = await fetch(pgrst_query_str, {
        method: "GET",
        headers: {
            // Need authorization headers from ApiGET or similar?
            "Prefer": "count=exact"
        }
    });

    // Actually, ApiGET sets all the auth tokens. But since my refactor, ApiGET returns `response as any`.
    try {
        const res = await ApiGET<Response>(request, pgrst_query_str, {
            "Prefer": "count=exact"
        });

        const vessels: Ship[] = await res.json();
        const { totalPages } = getPaginationFromResponse(res, limit);

        return { vessels, totalPages, currentPage: page };
    } catch (error) {
        return { vessels: [] as Ship[], totalPages: 0, currentPage: page };
    }
}

export default function VesselList() {
    const { vessels, totalPages, currentPage } = useLoaderData<typeof loader>();
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
                    <h2 className="text-3xl font-bold tracking-tight">Vessels</h2>
                    <p className="text-muted-foreground">Manage and track your fleet of vessels.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                    <Plus size={20} />
                    <span>Add Vessel</span>
                </button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search vessels by name, IMO, or flag..."
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
                            <th className="px-6 py-4 font-semibold">Vessel Name</th>
                            <th className="px-6 py-4 font-semibold">IMO Number</th>
                            <th className="px-6 py-4 font-semibold">Flag</th>
                            <th className="px-6 py-4 font-semibold">Type</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {vessels.map((vessel: any) => (
                            <tr key={vessel.id} className="hover:bg-muted/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <Link to={`/vessels/${vessel.id}`} className="font-medium text-primary hover:underline">
                                        {vessel.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground font-mono">{vessel.imo_number}</td>
                                <td className="px-6 py-4">{vessel.flag_code}</td>
                                <td className="px-6 py-4">{vessel.type_iacs}</td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-semibold",
                                        vessel.ship_status === "In Service" || vessel.ship_status === "Active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                    )}>
                                        {vessel.ship_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-1 hover:bg-muted rounded text-muted-foreground">
                                        <MoreVertical size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
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

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
