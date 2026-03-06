import { Plus, Trash2, ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLoaderData, Form, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import { getDb } from "../../.server/lib/api";

import type { Route } from "./+types/register-scope";
import { cn } from "~/lib/utils";

interface SurveyLine {
    id: number;
    job_id: number;
    survey_audits?: Record<string, unknown>;
    survey_pool?: Record<string, unknown>;
    [key: string]: unknown;
}

interface SurveyAudit {
    id: number;
    ship_id: number;
    is_active: boolean;
    [key: string]: unknown;
}

interface FindingComment {
    id: number;
    ship_id: number;
    is_active: boolean;
    [key: string]: unknown;
}

interface PoolItem {
    id: number;
    code: string;
    description: string;
    cert_code: string;
    is_active: boolean;
    [key: string]: unknown;
}

interface SurveyLineWithType extends SurveyLine {
    type: "survey";
}

interface CommentLine {
    id: number;
    job_id: number;
    finding_comments?: Record<string, unknown>;
    [key: string]: unknown;
}

export async function loader({ params, request }: Route.LoaderArgs) {
    const { id } = params;
    const db = await getDb(request);

    // 1. Get the survey_job by id
    const { data: surveyJobs } = await db.get<any[]>("/survey_jobs", {
        filters: { id: `eq.${id}` },
    });
    const surveyJob = surveyJobs?.[0] || null;
    if (!surveyJob) throw new Response("Job not found", { status: 404 });

    const shipId = surveyJob.ship_id;

    // 2. Get survey lines and comment lines
    const [{ data: surveyLines }, { data: commentLines }] = await Promise.all([
        db.get<SurveyLine[]>("/survey_lines", {
            filters: { job_id: `eq.${surveyJob.id}` },
            select:
                "*,survey_audits(description,pool_id,status,range_from_date,range_to_date,next_due_date,is_ordered,cert_code),survey_pool(code,description,cert_code)",
        }),
        db.get<any[]>("/comment_lines", {
            filters: { job_id: `eq.${surveyJob.job_id}` },
            select: "*,finding_comments(*)",
        }),
    ]);

    // 3. Get available surveys/findings for the ship to add to scope
    let availableSurveys: SurveyAudit[] = [];
    let availableFindings: FindingComment[] = [];

    if (shipId) {
        const [{ data: surveys }, { data: findings }] = await Promise.all([
            db.get<SurveyAudit[]>("/survey_audits", {
                filters: { ship_id: `eq.${shipId}`, is_active: "eq.true" },
            }),
            db.get<FindingComment[]>("/finding_comments", {
                filters: { ship_id: `eq.${shipId}`, is_active: "eq.true" },
            }),
        ]);
        availableSurveys = surveys || [];
        availableFindings = findings || [];
    }

    // 4. Get all active survey pool items for fallback/new additions
    const { data: allPoolItems } = await db.get<PoolItem[]>("/survey_pool", {
        filters: { is_active: "eq.true" },
    });

    return {
        surveyJob,
        surveyLines: surveyLines || [],
        commentLines: commentLines || [],
        availableSurveys,
        availableFindings,
        allPoolItems: allPoolItems || [],
    };
}


export async function action({ request, params: _params }: Route.ActionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const { id } = _params;

    try {
        const db = await getDb(request);

        if (intent === "add_survey") {
            const surveyAuditId = formData.get("survey_audit_id");
            const poolId = formData.get("pool_id");
            await db.post("/survey_lines", {
                body: {
                    survey_job_id: Number(id),
                    survey_id: surveyAuditId ? Number(surveyAuditId) : null,
                    pool_id: poolId ? Number(poolId) : null,
                },
            });
            return { success: "Added" };
        }

        if (intent === "remove_survey_line") {
            const lineId = formData.get("line_id");
            await db.delete("/survey_lines", { filters: { id: `eq.${lineId}` } });
            return { success: "Removed" };
        }

        if (intent === "toggle_credit") {
            const lineId = formData.get("line_id");
            const credit = formData.get("credit") === "true";
            await db.patch("/survey_lines", {
                filters: { id: `eq.${lineId}` },
                body: {
                    credit_periodical: !credit,
                },
            });
            return { success: "Updated" };
        }

        if (intent === "add_finding") {
            const findingId = formData.get("finding_id");
            // link findings to the parent job_id
            const surveyJobId = formData.get("survey_job_id");
            const { data: surveyJobsData } = await db.get<any[]>("/survey_jobs", {
                filters: { id: `eq.${surveyJobId}` },
                select: "job_id",
            });
            const jobId = surveyJobsData?.[0]?.job_id as number | undefined;
            if (!jobId) return { error: "Could not find parent job" };
            await db.post("/comment_lines", {
                body: {
                    job_id: jobId,
                    finding_comment_id: parseInt(findingId as string),
                },
            });
            return { success: "Finding Linked" };
        }

        if (intent === "remove_comment_line") {
            const lineId = formData.get("line_id");
            await db.delete("/comment_lines", { filters: { id: `eq.${lineId}` } });
            return { success: "Finding removed" };
        }
    } catch (error: any) {
        return { error: error.message || "Failed to perform action" };
    }

    return { error: "Unknown action" };
}


export default function RegisterScope() {
    const { surveyJob, surveyLines, commentLines, availableSurveys, availableFindings, allPoolItems } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";
    const [selectedSurveyId, setSelectedSurveyId] = useState<string>("");

    // Find the selected survey to get its pool_id
    const selectedSurvey = availableSurveys.find((s) => s.id.toString() === selectedSurveyId);

    const allLines = surveyLines.map((l) => ({ ...l, type: "survey" as const }));

    // Filter available pool items: exclude those that are already in availableSurveys (by pool_id) or already in scope (by pool_id)
    const existingPoolIdsInAudits = new Set(availableSurveys.map((s) => s.pool_id).filter(Boolean));
    // also check lines in current scope to avoid duplicates if possible, though business logic might allow multiples? Assuming unique per job for now for simplicity or just let backend handle constraint.
    // Let's at least filter out those that are "Linked" via survey_audit matches, but here we are talking about adding FRESH pool items.
    // If a pool item is in availableSurveys, user should use the "Available Survey" dropdown (which links to survey_audit).
    // So we primarily filter out matchng pool_ids from availableSurveys.
    const availablePoolOptions = allPoolItems.filter((p: PoolItem) => !existingPoolIdsInAudits.has(p.id));

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardList size={20} className="text-primary" />
                    Register Survey Scope
                </h2>
                <p className="text-sm text-slate-500">Add or remove surveys and recommendations from this job&apos;s scope.</p>
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
                            allLines.map((line: SurveyLineWithType) => (
                                <tr key={line.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 py-2 font-mono text-slate-600">{(line.survey_audits as any)?.cert_code || (line.survey_pool as any)?.cert_code || (line.survey_pool as any)?.code}</td>
                                    <td className="px-4 py-2 font-medium text-slate-900">{(line.survey_audits as any)?.description || (line.survey_pool as any)?.description}</td>
                                    <td className="px-4 py-2">
                                        <div className="text-slate-500">{(line.survey_audits as any)?.range_from_date || "N/A"} to {(line.survey_audits as any)?.range_to_date || "N/A"}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">DUE: {(line.survey_audits as any)?.next_due_date || "N/A"}</div>
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
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Add Survey to Scope</label>
                            <input type="hidden" name="pool_id" value={(selectedSurvey as any)?.pool_id || ""} />
                            <select
                                name="survey_audit_id"
                                required
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/30"
                                value={selectedSurveyId}
                                onChange={(e) => setSelectedSurveyId(e.target.value)}
                            >
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

                {/* Add from Pool Section */}
                <div className="p-3 bg-slate-50 border-t border-slate-200">
                    <Form method="post" className="flex items-end gap-2 max-w-lg">
                        <input type="hidden" name="survey_job_id" value={surveyJob?.id || ""} />
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Or Add New Survey Type (Not in Ship&apos;s List)</label>
                            <select name="pool_id" required className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/30">
                                <option value="">-- Select Survey Type --</option>
                                {availablePoolOptions.map((p: PoolItem) => (
                                    <option key={p.id} value={p.id}>{p.description} ({p.cert_code || p.code})</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            name="intent"
                            value="add_survey"
                            disabled={isSubmitting}
                            className="bg-white border border-slate-300 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                            <Plus size={14} />
                            Add Type
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
                            commentLines.map((line: CommentLine) => (
                                <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-2">
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                            (line.finding_comments as any)?.comment_type === "condition" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {(line.finding_comments as any)?.comment_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="font-medium text-slate-900 line-clamp-2 max-w-md">{(line.finding_comments as any)?.text}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Ref: {(line.finding_comments as any)?.mms_reference || "N/A"}</div>
                                    </td>
                                    <td className="px-4 py-2 text-slate-500">{(line.finding_comments as any)?.date_issued}</td>
                                    <td className="px-4 py-2">
                                        <span className={cn(
                                            "font-bold",
                                            new Date((line.finding_comments as any)?.due_date) < new Date() ? "text-destructive" : "text-slate-600"
                                        )}>

                                            {(line.finding_comments as any)?.due_date || "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="font-medium text-slate-900 line-clamp-2 max-w-md">{(line.finding_comments as any)?.text}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Ref: {(line.finding_comments as any)?.mms_reference || "N/A"}</div>
                                    </td>
                                    <td className="px-4 py-2 text-slate-500">{(line.finding_comments as any)?.date_issued}</td>
                                    <td className="px-4 py-2">
                                        <span className={cn(
                                            "font-bold",
                                            new Date((line.finding_comments as any)?.due_date) < new Date() ? "text-destructive" : "text-slate-600"
                                        )}>

                                            {(line.finding_comments as any)?.due_date || "N/A"}
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
                                    <option key={f.id} value={f.id}>{f.text?.substring(0, 60)}... (Due: {f.due_date})</option>
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
