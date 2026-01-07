import { Calendar, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Pagination } from "~/components/Pagination";

export default function SurveyDashboard() {
    const [currentPage, setCurrentPage] = useState(1);
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Survey Dashboard</h2>
                <p className="text-muted-foreground">Planning and oversight of upcoming vessel surveys.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Calendar} label="Next 30 Days" value="6" color="text-blue-600" />
                <StatCard icon={Clock} label="Overdue" value="1" color="text-destructive" />
                <StatCard icon={AlertCircle} label="In Progress" value="2" color="text-orange-600" />
            </div>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b bg-muted/50">
                    <h3 className="font-semibold">Recent & Upcoming Surveys</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-muted/30 border-b text-sm">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-muted-foreground">Vessel</th>
                            <th className="px-6 py-3 font-semibold text-muted-foreground">Survey Type</th>
                            <th className="px-6 py-3 font-semibold text-muted-foreground">Due Date</th>
                            <th className="px-6 py-3 font-semibold text-muted-foreground">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        <SurveyRow vessel="OCEAN WARRIOR" type="Annual Survey" date="2024-03-15" status="Scheduled" />
                        <SurveyRow vessel="SEA GUARDIAN" type="Intermediate Survey" date="2024-04-10" status="Pending" />
                        <SurveyRow vessel="ARCTIC STAR" type="Renewal Survey" date="2024-05-22" status="Planned" />
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={3}
                    onPageChange={setCurrentPage}
                    className="border-t bg-muted/10"
                />
            </div>
        </div>
    );
}

function SurveyRow({ vessel, type, date, status }: { vessel: string, type: string, date: string, status: string }) {
    return (
        <tr className="hover:bg-muted/30 transition-colors">
            <td className="px-6 py-4 font-medium">{vessel}</td>
            <td className="px-6 py-4">{type}</td>
            <td className="px-6 py-4">{date}</td>
            <td className="px-6 py-4">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {status}
                </span>
            </td>
        </tr>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    return (
        <div className="bg-card border rounded-xl p-6 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-muted ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-muted-foreground font-medium">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}
