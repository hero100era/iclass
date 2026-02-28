import { Info, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLoaderData, Form, useActionData, useNavigation } from "react-router";
import { ApiGET, ApiPATCH } from "~/.server/lib/api";
import type { Route } from "./+types/job-description";
import { cn } from "~/lib/utils";

export async function loader({ params, request }: Route.LoaderArgs) {
    const { id } = params;
    const host = process.env.API_URL || "http://localhost:2000";

    const res = await ApiGET(request, `${host}/jobs?id=eq.${id}`);
    if (!res.ok) throw new Response("Job not found", { status: 404 });
    const jobs = await res.json();
    if (jobs.length === 0) throw new Response("Job not found", { status: 404 });

    return { job: jobs[0] };
}

export async function action({ request, params }: Route.ActionArgs) {
    const { id } = params;
    const formData = await request.formData();
    const comments = formData.get("comments") as string;
    const host = process.env.API_URL || "http://localhost:2000";

    const res = await ApiPATCH(request, `${host}/jobs?id=eq.${id}`, {
        comments,
        updated_at: new Date().toISOString()
    });

    if (!res.ok) {
        return { error: "Failed to update job description" };
    }

    return { success: "Job description updated successfully" };
}

export default function JobDescription() {
    const { job } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Info size={20} className="text-primary" />
                    Job Description
                </h2>
                <p className="text-sm text-slate-500">Update the main purpose and objective of this job for future reference.</p>
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

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description Details</h3>
                </div>
                <Form method="post" className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="comments" className="text-xs font-bold text-slate-600 px-1">
                            Main Purpose / Comments
                        </label>
                        <textarea
                            id="comments"
                            name="comments"
                            rows={12}
                            defaultValue={job.comments || ""}
                            placeholder="Enter the job description here..."
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        ></textarea>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm shadow-sm transition-all",
                                isSubmitting
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-primary text-white hover:bg-primary/90 hover:shadow-md active:translate-y-0.5"
                            )}
                        >
                            <Save size={16} />
                            {isSubmitting ? "Saving..." : "Save Job Description"}
                        </button>
                    </div>
                </Form>
            </div>

            <div className="bg-blue-50/50 border border-blue-100/50 rounded-lg p-4 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Info size={16} className="text-blue-600" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-blue-900">Information</h4>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                        This description will be saved as the primary metadata for the job.
                        It is intended for future reference and internal reporting purposes.
                    </p>
                </div>
            </div>
        </div>
    );
}
