import { ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLoaderData, useActionData, useNavigation, Form } from "react-router";
import { getDb } from "~/.server/lib/api";
import type { Route } from "./+types/manage-survey";
import { formatDate } from "~/lib/format";
import { cn } from "~/lib/utils";

export interface SurveyLineProps {
    id: number;
    survey_audit_id?: number;
    survey_audits?: {
        id: number;
        code?: string;
        description?: string;
        range_from_date?: string;
        range_to_date?: string;
        next_due_date?: string;
        cert_code?: string;
    };
    survey_pool?: {
        id: number;
        description?: string;
        cert_code?: string;
        code?: string;
    };
    credit_periodical?: boolean;
}

export async function loader({ params, request }: Route.LoaderArgs) {
    const db = await getDb(request);
    const { data: job } = await db.getOne<{ id: number; ship_id: number; job_id: number }>("/survey_jobs", { filters: { id: `eq.${params.id}` } });
    if (!job) throw new Response("Job not found", { status: 404 });

    const { data: sLines } = await db.get<SurveyLineProps[]>("/survey_lines", {
        filters: { job_id: `eq.${job.id}` },
        select: "*,survey_audits(*),survey_pool(*)",
    });

    return { surveyJob: job, surveyLines: sLines || [] };
}

export async function action({ request, params }: Route.ActionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const db = await getDb(request);

    if (intent === "save_survey_details") {
        // Implement survey saving logic here
        return { success: "Survey details saved successfully" };
    }

    return { error: "Unknown action" };
}

export default function ManageSurvey() {
    const { surveyJob, surveyLines } = useLoaderData<typeof loader>();
    const actionData = useActionData<{ error?: string; success?: string }>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardList size={20} className="text-primary" /> Manage Survey
                </h2>
                <p className="text-sm text-slate-500">Manage the survey lines and updates for this job.</p>
            </div>

            {actionData?.error && (
                <div className="p-3 bg-red-50 text-red-600 rounded flex items-center gap-2 text-xs font-bold">
                    <AlertCircle size={14} />
                    {actionData.error}
                </div>
            )}
            {actionData?.success && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 size={14} />
                    {actionData.success}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Survey Scope Items</h3>
                </div>
                <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-4 py-2">Cert/Code</th>
                            <th className="px-4 py-2">Description</th>
                            <th className="px-4 py-2">Range / Due</th>
                            <th className="px-4 py-2 text-center">Credit Periodical</th>
                            <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {surveyLines.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No lines registered in the scope.</td>
                            </tr>
                        ) : (
                            surveyLines.map((line) => (
                                <tr key={line.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-2 font-mono text-slate-600">{line.survey_audits?.code || line.survey_pool?.code}</td>
                                    <td className="px-4 py-2 font-medium text-slate-900">{line.survey_audits?.description || line.survey_pool?.description}</td>
                                    <td className="px-4 py-2">
                                        <div className="text-slate-500">
                                            {formatDate(line.survey_audits?.range_from_date)} - {formatDate(line.survey_audits?.range_to_date)}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">DUE: {formatDate(line.survey_audits?.next_due_date)}</div>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", line.credit_periodical ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                                            {line.credit_periodical ? "YES" : "NO"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">Pending</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {surveyLines.length > 0 && (
                    <div className="p-4 bg-slate-50/50 border-t flex justify-end">
                        <Form method="post">
                            <button
                                type="submit"
                                name="intent"
                                value="save_survey_details"
                                disabled={isSubmitting}
                                className="bg-primary text-white text-[11px] font-bold px-4 py-2 rounded flex items-center justify-center min-w-[120px]"
                            >
                                {isSubmitting ? "Saving..." : "Save Details"}
                            </button>
                        </Form>
                    </div>
                )}
            </div>
        </div>
    );
}
