import { FileBadge, Download, Filter, Search } from "lucide-react";
import { useState } from "react";
import { Pagination } from "~/components/Pagination";

const certificates = [
    { id: 1, vessel: "OCEAN WARRIOR", code: "LL", name: "Load Line", issued: "2024-01-15", expiry: "2029-01-14", status: "Valid" },
    { id: 2, vessel: "OCEAN WARRIOR", code: "OPP", name: "Oil Pollution Prevention", issued: "2023-05-10", expiry: "2028-05-09", status: "Valid" },
    { id: 3, vessel: "SEA GUARDIAN", code: "SMC", name: "Safety Management", issued: "2021-11-20", expiry: "2026-11-19", status: "Expiring Soon" },
];

export default function CertificateList() {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 5;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Certificates</h2>
                <p className="text-muted-foreground">Monitor and manage vessel certificates and their validity.</p>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by vessel or certificate name..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-card focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                    <Filter size={18} />
                    <span>Status</span>
                </button>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Vessel</th>
                            <th className="px-6 py-4 font-semibold">Certificate</th>
                            <th className="px-6 py-4 font-semibold">Code</th>
                            <th className="px-6 py-4 font-semibold">Issued Date</th>
                            <th className="px-6 py-4 font-semibold">Expiry Date</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {certificates.map((cert) => (
                            <tr key={cert.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4 font-medium">{cert.vessel}</td>
                                <td className="px-6 py-4">{cert.name}</td>
                                <td className="px-6 py-4 font-mono text-sm">{cert.code}</td>
                                <td className="px-6 py-4">{cert.issued}</td>
                                <td className="px-6 py-4">{cert.expiry}</td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-semibold",
                                        cert.status === "Valid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                    )}>
                                        {cert.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors">
                                        <Download size={18} />
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
                    className="border-t bg-muted/20"
                />
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
