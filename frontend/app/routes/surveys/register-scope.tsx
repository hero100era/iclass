import { ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLoaderData, useActionData, useNavigation } from "react-router";
import { getDb } from "~/.server/lib/api";
import type { Route } from "./+types/register-scope";
import { SurveyScopeTable, type SurveyLineProps, type SurveyAuditProps, type PoolOptionProps } from "./components/register-scope/SurveyScopeTable";
import { FindingsScopeTable, type CommentLineProps, type FindingCommentProps } from "./components/register-scope/FindingsScopeTable";

export async function loader({ params, request }: Route.LoaderArgs) {
  const db = await getDb(request);
  const { data: job } = await db.getOne<{ id: number; ship_id: number; job_id: number }>("/survey_jobs", { filters: { id: `eq.${params.id}` } });
  if (!job) throw new Response("Job not found", { status: 404 });

  const [{ data: sLines }, { data: cLines }, { data: audits }, { data: findings }, { data: pool }] = await Promise.all([
    db.get<SurveyLineProps[]>("/survey_lines", { filters: { job_id: `eq.${job.id}` }, select: "*,survey_audits(*),survey_pool(*)" }),
    db.get<CommentLineProps[]>("/comment_lines", { filters: { survey_job_id: `eq.${job.id}` }, select: "*,finding_comment:finding_comments(*)" }),
    db.get<SurveyAuditProps[]>("/survey_audits", { filters: { ship_id: `eq.${job.ship_id}`, is_active: "eq.true" } }),
    db.get<FindingCommentProps[]>("/finding_comments", { filters: { ship_id: `eq.${job.ship_id}`, is_active: "eq.true" } }),
    db.get<PoolOptionProps[]>("/survey_pool", { filters: { is_active: "eq.true" } }),
  ]);

  const usedAuditIds = new Set((sLines || []).map(l => l.survey_audit_id).filter(Boolean));
  const availableAudits = (audits || []).filter(s => !usedAuditIds.has(s.id));
  const existingPoolIds = new Set(availableAudits.map(s => s.pool_id).filter(Boolean));
  const availablePool = (pool || []).filter(p => !existingPoolIds.has(p.id));

  return { surveyJob: job, surveyLines: sLines || [], commentLines: cLines || [], availableAudits, availableFindings: findings || [], availablePool };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const db = await getDb(request);

  if (intent === "add_survey") {
    await db.post("/survey_lines", { body: { job_id: Number(params.id), survey_audit_id: formData.get("survey_audit_id") ? Number(formData.get("survey_audit_id")) : null, pool_id: formData.get("pool_id") ? Number(formData.get("pool_id")) : null } });
    return { success: "Added" };
  }
  if (intent === "remove_survey_line") {
    await db.delete("/survey_lines", { filters: { id: `eq.${formData.get("line_id")}` } });
    return { success: "Removed" };
  }
  if (intent === "toggle_credit") {
    await db.patch("/survey_lines", { filters: { id: `eq.${formData.get("line_id")}` }, body: { credit_periodical: formData.get("credit") !== "true" } });
    return { success: "Updated" };
  }
  if (intent === "add_finding") {
    await db.post("/comment_lines", { body: { job_id: Number(formData.get("job_id")), finding_comment_id: Number(formData.get("finding_id")) } });
    return { success: "Finding Linked" };
  }
  if (intent === "remove_comment_line") {
    await db.delete("/comment_lines", { filters: { id: `eq.${formData.get("line_id")}` } });
    return { success: "Finding removed" };
  }
  return { error: "Unknown action" };
}

export default function RegisterScope() {
  const { surveyJob, surveyLines, commentLines, availableAudits, availableFindings, availablePool } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const navigation = useNavigation();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><ClipboardList size={20} className="text-primary" /> Register Survey Scope</h2>
        <p className="text-sm text-slate-500">Add or remove surveys and recommendations from this job&apos;s scope.</p>
      </div>

      {actionData?.error && <div className="p-3 bg-red-50 text-red-600 rounded flex items-center gap-2 text-xs font-bold"><AlertCircle size={14} />{actionData.error}</div>}
      {actionData?.success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded flex items-center gap-2 text-xs font-bold"><CheckCircle2 size={14} />{actionData.success}</div>}

      <SurveyScopeTable lines={surveyLines} availableSurveys={availableAudits} availablePoolOptions={availablePool} isSubmitting={navigation.state !== "idle"} onAddSurvey={() => { }} />
      <FindingsScopeTable commentLines={commentLines} availableFindings={availableFindings} isSubmitting={navigation.state !== "idle"} jobId={surveyJob.job_id} />
    </div>
  );
}
