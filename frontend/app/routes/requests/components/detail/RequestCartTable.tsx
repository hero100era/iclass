import { AlertCircle } from "lucide-react";

interface RequestCartTableProps {
    items: any[];
}

export function RequestCartTable({ items }: RequestCartTableProps) {
    return (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Requested Items ({items.length})</h3>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Reference / Code</th>
                        <th className="px-6 py-3">Due Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                        const isSurvey = !!item.survey_audit;
                        const isFinding = !!item.finding_comment;
                        const desc = isSurvey ? item.survey_audit.description : isFinding ? item.finding_comment.text : item.occ_survey_code;
                        const code = isSurvey ? item.survey_audit.cert_code : isFinding ? item.finding_comment.comment_type : item.occ_survey_code;
                        const date = isSurvey ? item.survey_audit.next_due_date : isFinding ? item.finding_comment.due_date : "-";

                        return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 capitalize font-medium text-slate-500">{isSurvey ? "Survey" : isFinding ? "Finding" : "Occasional"}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{desc}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{code}</td>
                                <td className="px-6 py-4 text-slate-600">{date}</td>
                            </tr>
                        );
                    })}
                    {items.length === 0 && (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No items in request cart.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
