import { Plus, Trash2 } from "lucide-react";
import { Form } from "react-router";
import { formatDate } from "~/lib/format";
import { cn } from "~/lib/utils";

interface SurveyScopeTableProps {
    lines: any[];
    availableSurveys: any[];
    availablePoolOptions: any[];
    isSubmitting: boolean;
    onAddSurvey: (auditId: string, poolId: string) => void;
}

export function SurveyScopeTable({
    lines,
    availableSurveys,
    availablePoolOptions,
    isSubmitting,
}: SurveyScopeTableProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Current Survey Lines</h3>
            </div>
            <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                    <tr>
                        <th className="px-4 py-2">Cert/Code</th>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2">Range / Due</th>
                        <th className="px-4 py-2 text-center">Credit</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {lines.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No lines registered.</td></tr>
                    ) : (
                        lines.map((line) => (
                            <tr key={line.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2 font-mono text-slate-600">{line.survey_audits?.code || line.survey_pool?.code}</td>
                                <td className="px-4 py-2 font-medium text-slate-900">{line.survey_audits?.description || line.survey_pool?.description}</td>
                                <td className="px-4 py-2">
                                    <div className="text-slate-500">{formatDate(line.survey_audits?.range_from_date)} - {formatDate(line.survey_audits?.range_to_date)}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">DUE: {formatDate(line.survey_audits?.next_due_date)}</div>
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <Form method="post">
                                        <input type="hidden" name="line_id" value={line.id} />
                                        <input type="hidden" name="credit" value={String(line.credit_periodical)} />
                                        <button type="submit" name="intent" value="toggle_credit" className={cn("px-2 py-0.5 rounded text-[10px] font-bold", line.credit_periodical ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                                            {line.credit_periodical ? "YES" : "NO"}
                                        </button>
                                    </Form>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <Form method="post">
                                        <input type="hidden" name="line_id" value={line.id} />
                                        <button type="submit" name="intent" value="remove_survey_line" disabled={isSubmitting} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>
                                    </Form>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Add Survey Form */}
            <div className="p-4 bg-slate-50/50 border-t space-y-3">
                <Form method="post" className="flex items-end gap-2">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Add Existing Ship Survey</label>
                        <select name="survey_audit_id" className="w-full bg-white border rounded px-2 py-1.5 text-xs">
                            <option value="">-- Select Available Survey --</option>
                            {availableSurveys.map(s => <option key={s.id} value={s.id}>{s.description} ({s.cert_code})</option>)}
                        </select>
                    </div>
                    <button type="submit" name="intent" value="add_survey" disabled={isSubmitting} className="bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5"><Plus size={14} /> Add Line</button>
                </Form>
                <Form method="post" className="flex items-end gap-2">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Add Occasional Survey Type</label>
                        <select name="pool_id" className="w-full bg-white border rounded px-2 py-1.5 text-xs">
                            <option value="">-- Select Survey Type --</option>
                            {availablePoolOptions.map(p => <option key={p.id} value={p.id}>{p.description} ({p.cert_code || p.code})</option>)}
                        </select>
                    </div>
                    <button type="submit" name="intent" value="add_survey" disabled={isSubmitting} className="bg-slate-100 border text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5"><Plus size={14} /> Add Type</button>
                </Form>
            </div>
        </div>
    );
}
