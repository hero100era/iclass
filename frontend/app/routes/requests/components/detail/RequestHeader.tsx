import { ArrowLeft, UserPlus, FileText, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Link, useFetcher } from "react-router";

interface RequestHeaderProps {
    request: any;
    employees: any[];
    hasSurvey: boolean;
    hasAudit: boolean;
}

export function RequestHeader({ request, employees, hasSurvey, hasAudit }: RequestHeaderProps) {
    const fetcher = useFetcher<any>();
    const isProcessing = fetcher.state !== "idle";
    const error = fetcher.data?.error;
    const [isAssigning, setIsAssigning] = useState(false);

    const [surveyorId, setSurveyorId] = useState("");
    const [auditorId, setAuditorId] = useState("");
    const [reviewerId, setReviewerId] = useState("");

    const handleProcess = () => {
        fetcher.submit(
            {
                intent: "process_request",
                surveyor_id: surveyorId,
                auditor_id: auditorId,
                reviewer_id: reviewerId
            },
            { method: "post" }
        );
    };

    return (
        <div className="space-y-4 mb-8">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                    {error}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/requests" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Survey Request Detail</h1>
                        <p className="text-sm text-slate-500">Request ID: #{request.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-slate-50 text-slate-700 transition-colors">
                        <FileText size={16} /> Export PDF
                    </button>
                    {request.status === "submitted" ? (
                        <button
                            disabled={isProcessing}
                            onClick={() => setIsAssigning(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            <UserPlus size={16} />
                            Process Request
                        </button>
                    ) : (
                        <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-sm font-semibold border border-slate-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            {request.status === "assigned" ? "Request Processed" : `Status: ${request.status}`}
                        </div>
                    )}
                </div>
            </div>

            {isAssigning && (
                <div className="bg-white border rounded-xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-primary">
                            <UserPlus size={20} />
                            <h3 className="text-lg font-bold">Assign Professionals</h3>
                        </div>
                        <button
                            onClick={() => setIsAssigning(false)}
                            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {hasSurvey && (
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Surveyor</label>
                                <select
                                    className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    value={surveyorId}
                                    onChange={(e) => setSurveyorId(e.target.value)}
                                >
                                    <option value="">Select Surveyor</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.display_name} ({emp.job_title})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {hasAudit && (
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Auditor</label>
                                <select
                                    className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    value={auditorId}
                                    onChange={(e) => setAuditorId(e.target.value)}
                                >
                                    <option value="">Select Auditor</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.display_name} ({emp.job_title})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Reviewer</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                value={reviewerId}
                                onChange={(e) => setReviewerId(e.target.value)}
                            >
                                <option value="">Select Reviewer</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.display_name} ({emp.job_title})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            onClick={() => setIsAssigning(false)}
                            className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={isProcessing}
                            onClick={handleProcess}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 shadow-md shadow-primary/20 transition-all"
                        >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                            {isProcessing ? "Processing..." : "Confirm & Process Request"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
