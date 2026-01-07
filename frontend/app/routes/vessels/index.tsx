import { Search, Plus, Filter, MoreVertical } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import { Pagination } from "~/components/Pagination";
import { ApiGET } from "~/.server/lib/api";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
    const host = process.env.API_URL || "http://localhost:2000";
    const res = await ApiGET(request, `${host}/ships`);

    if (!res.ok) {
        return { vessels: [] };
    }

    const vessels = await res.json();
    return { vessels };
}

export default function VesselList() {
    const { vessels } = useLoaderData<typeof loader>();
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 1; // Simplify for now, pagination logic can be improved later

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
                            <tr key={vessel.pk} className="hover:bg-muted/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <Link to={`/vessels/${vessel.pk}`} className="font-medium text-primary hover:underline">
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
                    onPageChange={setCurrentPage}
                    className="border-t bg-muted/10"
                />
            </div>

        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
