import { Search, Filter } from "lucide-react";

interface SurveyFiltersProps {
    searchQuery: string;
    onSearch: (q: string) => void;
}

export function SurveyFilters({ searchQuery, onSearch }: SurveyFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
            <div className="flex-1 relative min-w-[300px]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by ship, description, or IMO..."
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter size={16} /> Filters
            </button>
        </div>
    );
}
