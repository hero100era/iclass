import { Search, Plus, Filter, MoreVertical } from "lucide-react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { Pagination } from "~/components/Pagination";
import { ApiGET } from "~/.server/lib/api";
import { getPaginationFromResponse } from "~/.server/lib/pagination";
import { cn } from "~/lib/utils";
import { type Ship } from "~/definitions/database.types";
import type { Route } from "./+types/index";

const ITEM_PER_PAGE = 10;

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const page = Number(url.searchParams.get("page")) || 1;
	const limit = ITEM_PER_PAGE;
	const offset = (page - 1) * limit;

	const host = process.env.API_URL || "http://localhost:2000";
	const pgrst_query_str = `${host}/ships?limit=${limit}&offset=${offset}`;

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
		<div className="space-y-4">
			<div className="flex justify-between items-center gap-4">
				<h2 className="text-xl font-semibold">Vessels</h2>
				<div className="flex gap-2 items-center">
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
						<input
							type="text"
							placeholder="Search vessels..."
							className="w-64 pl-8 pr-3 py-1.5 text-sm border rounded-md bg-card focus:ring-2 focus:ring-primary/20 outline-none"
						/>
					</div>
					<button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors">
						<Filter size={14} />
						<span>Filter</span>
					</button>
					<button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 text-sm rounded-md font-medium hover:opacity-90 transition-opacity">
						<Plus size={14} />
						<span>Add</span>
					</button>
				</div>
			</div>

			<div className="bg-card border rounded-lg overflow-hidden">
				<table className="w-full text-left text-sm">
					<thead className="bg-muted/50 border-b">
						<tr>
							<th className="px-4 py-2 font-medium">Vessel Name</th>
							<th className="px-4 py-2 font-medium">IMO</th>
							<th className="px-4 py-2 font-medium">Flag</th>
							<th className="px-4 py-2 font-medium">Type</th>
							<th className="px-4 py-2 font-medium">Status</th>
							<th className="px-4 py-2 w-10"></th>
						</tr>
					</thead>
					<tbody className="divide-y">
						{vessels.map((vessel: Ship) => (
							<tr key={vessel.id} className="hover:bg-muted/30 transition-colors">
								<td className="px-4 py-2">
									<Link to={`/vessels/${vessel.id}`} className="font-medium text-primary hover:underline">
										{vessel.name}
									</Link>
								</td>
								<td className="px-4 py-2 text-muted-foreground font-mono text-xs">{vessel.imo_number}</td>
								<td className="px-4 py-2">{vessel.flag_code}</td>
								<td className="px-4 py-2">{vessel.type_iacs}</td>
								<td className="px-4 py-2">
									<span className={cn(
										"px-2 py-0.5 rounded-full text-xs font-medium",
										vessel.ship_status === "E" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
									)}>
										{vessel.ship_status === "E" ? "In Service" : vessel.ship_status === "L" ? "Laid Up" : "Withdrawn"}
									</span>
								</td>
								<td className="px-4 py-2">
									<button className="p-1 hover:bg-muted rounded text-muted-foreground">
										<MoreVertical size={14} />
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
					className="border-t bg-muted/10 text-sm"
				/>
			</div>
		</div>
	);
}
