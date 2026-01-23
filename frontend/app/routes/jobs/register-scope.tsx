import { Plus, Trash2, ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLoaderData, Form, useActionData, useNavigation } from "react-router";
import { ApiGET, ApiPOST, ApiDELETE, ApiPATCH } from "~/.server/lib/api";
import type { Route } from "./+types/register-scope";
import { cn } from "~/lib/utils";

export async function loader({ params, request }: Route.LoaderArgs) {
    const { id } = params;
    const host = process.env.API_URL || "http://localhost:2000";

    // 1. Get job and sub-jobs
    const [jobRes, surveyJobRes, auditJobRes] = await Promise.all([
        ApiGET(request, `${host}/jobs?id=eq.${id}`),
        ApiGET(request, `${host}/survey_jobs?job_id=eq.${id}`),
        ApiGET(request, `${host}/audit_jobs?job_id=eq.${id}`)
    ]);

    const jobs = await jobRes.json();
    const surveyJobs = await surveyJobRes.json();
    const auditJobs = await auditJobRes.json();

    const job = jobs[0];
    const surveyJob = surveyJobs[0] || null;
    const auditJob = auditJobs[0] || null;

    if (!job) throw new Response("Job not found", { status: 404 });

    const shipId = surveyJob?.ship_id || auditJob?.ship_id;

    // 2. Get survey/audit lines and comment lines
    const [surveyLinesRes, auditLinesRes, commentLinesRes] = await Promise.all([
        surveyJob ? ApiGET(request, `${host}/survey_lines?job_id=eq.${surveyJob.id}&select=*,survey_audits(description,status,range_from_date,range_to_date,next_due_date,is_ordered,cert_code)`) : Promise.resolve({ json: () => [] }),
        auditJob ? ApiGET(request, `${host}/audit_lines?job_id=eq.${auditJob.id}&select=*,survey_audits(description,status,range_from_date,range_to_date,next_due_date,cert_code)`) : Promise.resolve({ json: () => [] }),
        ApiGET(request, `${host}/comment_lines?job_id=eq.${id}&select=*,finding_comments(*)`)
    ]);

    const surveyLines = await (surveyLinesRes as any).json();
    const auditLines = await (auditLinesRes as any).json();
    const commentLines = await (commentLinesRes as any).json();

    // 3. Get available surveys/findings for the ship to add to scope
    let availableSurveys = [];
    let availableFindings = [];

    if (shipId) {
        const [surveysRes, findingsRes] = await Promise.all([
            ApiGET(request, `${host}/survey_audits?ship_id=eq.${shipId}&is_active=eq.true`),
            ApiGET(request, `${host}/finding_comments?ship_id=eq.${shipId}&is_active=eq.true`)
        ]);
        availableSurveys = await surveysRes.json();
        availableFindings = await findingsRes.json();
    }

    return { job, surveyJob, auditJob, surveyLines, auditLines, commentLines, availableSurveys, availableFindings };
}

export async function action({ request, params }: Route.ActionArgs) {
    const { id } = params;
    const formData = await request.formData();
    const intent = formData.get("intent");
    const host = process.env.API_URL || "http://localhost:2000";

    if (intent === "add_survey") {
        const surveyAuditId = formData.get("survey_audit_id");
        const surveyJobId = formData.get("survey_job_id");
        const auditJobId = formData.get("audit_job_id");

        if (surveyJobId) {
            const res = await ApiPOST(request, `${host}/survey_lines`, { job_id: parseInt(surveyJobId as string), survey_audit_id: parseInt(surveyAuditId as string) });
            if (!res.ok) return { error: "Failed to add survey line" };
        } else if (auditJobId) {
            const res = await ApiPOST(request, `${host}/audit_lines`, { job_id: parseInt(auditJobId as string), survey_audit_id: parseInt(surveyAuditId as string) });
            if (!res.ok) return { error: "Failed to add audit line" };
        }
        return { success: "Survey added to scope" };
    }

    if (intent === "remove_survey_line") {
        const lineId = formData.get("line_id");
        const type = formData.get("type"); // survey or audit
        const endpoint = type === "survey" ? "survey_lines" : "audit_lines";
        const res = await ApiDELETE(request, `${host}/${endpoint}?id=eq.${lineId}`);
        if (!res.ok) return { error: "Failed to remove line" };
        return { success: "Line removed" };
    }

    if (intent === "toggle_credit") {
        const lineId = formData.get("line_id");
        const type = formData.get("type");
        const credit = formData.get("credit") === "true";
        const endpoint = type === "survey" ? "survey_lines" : "audit_lines";
        const res = await ApiPATCH(request, `${host}/${endpoint}?id=eq.${lineId}`, { credit_periodical: !credit });
        if (!res.ok) return { error: "Failed to update credit" };
        return { success: "Updated" };
    }

    if (intent === "add_finding") {
        const findingId = formData.get("finding_id");
        const res = await ApiPOST(request, `${host}/comment_lines`, { job_id: parseInt(id as string), finding_comment_id: parseInt(findingId as string) });
        if (!res.ok) return { error: "Failed to add finding to scope" };
        return { success: "Finding added" };
    }

    if (intent === "remove_comment_line") {
        const lineId = formData.get("line_id");
        const res = await ApiDELETE(request, `${host}/comment_lines?id=eq.${lineId}`);
        if (!res.ok) return { error: "Failed to remove finding from scope" };
        return { success: "Finding removed" };
    }

    return { error: "Unknown action" };
}

export default function RegisterScope() {
    const { job, surveyJob, auditJob, surveyLines, auditLines, commentLines, availableSurveys, availableFindings } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";

    const allLines = [...surveyLines.map((l: any) => ({ ...l, type: "survey" })), ...auditLines.map((l: any) => ({ ...l, type: "audit" }))];

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardList size={20} className="text-primary" />
                    Register Survey Scope
                </h2>
                <p className="text-sm text-slate-500">Add or remove surveys and recommendations from this job's scope.</p>
            </div>

            {actionData?.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded font-bold flex items-center gap-2">
                    <AlertCircle size={14} />
                    {actionData.error}
                </div>
            )}
            {actionData?.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    {actionData.success}
                </div>
            )}

            {/* Survey Scope Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Current Survey Lines</h3>
                </div>
                <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-4 py-2 w-10">Type</th>
                            <th className="px-4 py-2">Cert/Code</th>
                            <th className="px-4 py-2">Description</th>
                            <th className="px-4 py-2">Range / Due</th>
                            <th className="px-4 py-2">Ordered</th>
                            <th className="px-4 py-2 text-center">Credit to Ship Survey</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {allLines.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">No survey lines registered for this job.</td>
                            </tr>
                        ) : (
                            allLines.map((line: any) => (
                                <tr key={line.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 py-2">
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                            line.type === "survey" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                        )}>
                                            {line.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 font-mono text-slate-600">{line.survey_audits?.cert_code}</td>
                                    <td className="px-4 py-2 font-medium text-slate-900">{line.survey_audits?.description}</td>
                                    <td className="px-4 py-2">
                                        <div className="text-slate-500">{line.survey_audits?.range_from_date || "N/A"} to {line.survey_audits?.range_to_date || "N/A"}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">DUE: {line.survey_audits?.next_due_date || "N/A"}</div>
                                    </td>
                                    <td className="px-4 py-2">{line.survey_audits?.is_ordered ? "Yes" : "No"}</td>
                                    <td className="px-4 py-2 text-center">
                                        <Form method="post" className="inline">
                                            <input type="hidden" name="line_id" value={line.id} />
                                            <input type="hidden" name="type" value={line.type} />
                                            <input type="hidden" name="credit" value={String(line.credit_periodical)} />
                                            <button
                                                type="submit"
                                                name="intent"
                                                value="toggle_credit"
                                                className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                                                    line.credit_periodical ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                )}
                                            >
                                                {line.credit_periodical ? "YES" : "NO"}
                                            </button>
                                        </Form>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <Form method="post">
                                            <input type="hidden" name="line_id" value={line.id} />
                                            <input type="hidden" name="type" value={line.type} />
                                            <button
                                                type="submit"
                                                name="intent"
                                                value="remove_survey_line"
                                                disabled={isSubmitting}
                                                className="p-1.5 text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </Form>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                    <Form method="post" className="flex items-end gap-2 max-w-lg">
                        <input type="hidden" name="survey_job_id" value={surveyJob?.id || ""} />
                        <input type="hidden" name="audit_job_id" value={auditJob?.id || ""} />
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Add Survey to Scope</label>
                            <select name="survey_audit_id" required className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/30">
                                <option value="">-- Select Available Survey --</option>
                                {availableSurveys.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.description} ({s.cert_code}) - Due: {s.next_due_date}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            name="intent"
                            value="add_survey"
                            disabled={isSubmitting}
                            className="bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-sm hover:opacity-90 flex items-center gap-1.5 shrink-0 transition-opacity"
                        >
                            <Plus size={14} />
                            Add Line
                        </button>
                    </Form>
                </div>
            </div>

            {/* Findings/Recommendations Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recommendations / Findings Scope</h3>
                </div>
                <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-4 py-2 w-10">Type</th>
                            <th className="px-4 py-2">Details</th>
                            <th className="px-4 py-2">Issued</th>
                            <th className="px-4 py-2">Due Date</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {commentLines.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No recommendations linked to this job.</td>
                            </tr>
                        ) : (
                            commentLines.map((line: any) => (
                                <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-2">
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                            line.finding_comments?.comment_type === "condition" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {line.finding_comments?.comment_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="font-medium text-slate-900 line-clamp-2 max-w-md">{line.finding_comments?.text}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Ref: {line.finding_comments?.mms_reference || "N/A"}</div>
                                    </td>
                                    <td className="px-4 py-2 text-slate-500">{line.finding_comments?.date_issued}</td>
                                    <td className="px-4 py-2">
                                        <span className={cn(
                                            "font-bold",
                                            new Date(line.finding_comments?.due_date) < new Date() ? "text-destructive" : "text-slate-600"
                                        )}>
                                            {line.finding_comments?.due_date || "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <Form method="post">
                                            <input type="hidden" name="line_id" value={line.id} />
                                            <button
                                                type="submit"
                                                name="intent"
                                                value="remove_comment_line"
                                                disabled={isSubmitting}
                                                className="p-1.5 text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </Form>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                    <Form method="post" className="flex items-end gap-2 max-w-lg">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Add Open Finding to Scope</label>
                            <select name="finding_id" required className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/30">
                                <option value="">-- Select Open Finding --</option>
                                {availableFindings.map((f: any) => (
                                    <option key={f.id} value={f.id}>{f.text.substring(0, 60)}... (Due: {f.due_date})</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            name="intent"
                            value="add_finding"
                            disabled={isSubmitting}
                            className="bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-sm hover:opacity-90 flex items-center gap-1.5 shrink-0 transition-opacity"
                        >
                            <Plus size={14} />
                            Add Finding
                        </button>
                    </Form>
                </div>
            </div>
        </div>
    );
}
