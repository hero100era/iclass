import { redirect, useLoaderData } from "react-router";
import { getDb } from "~/.server/lib/api";
import type { Route } from "./+types/detail";
import { RequestHeader } from "./components/detail/RequestHeader";
import { RequestInfo } from "./components/detail/RequestInfo";
import { RequestCartTable } from "./components/detail/RequestCartTable";
import type { RequestDetailData, EmployeeInfo } from "./components/detail/RequestHeader";
import type { RequestCartItem } from "./components/detail/RequestCartTable";

export async function loader({ params, request }: Route.LoaderArgs) {
  const db = await getDb(request);
  const { data: requests } = await db.get<RequestDetailData[]>("/survey_requests", {
    filters: { id: `eq.${params.id}` },
    select: "*,ships(name,imo_number),organizations(name)",
  });
  if (!requests?.[0]) throw new Response("Request not found.", { status: 404 });

  const { data: cartItems } = await db.get<(RequestCartItem & { survey_audit: { survey_pool?: { is_audit?: boolean } } })[]>("/survey_request_carts", {
    filters: { survey_request_id: `eq.${params.id}` },
    select: "*,survey_audit:survey_audits!survey_request_cart_survey_audit_id_fkey(*,survey_pool(*)),finding_comment:finding_comments(*)",
  });

  const { data: employees } = await db.get<EmployeeInfo[]>("/v_employee_full", {
    filters: { is_active: "is.true" },
    order: "display_name.asc"
  });

  const hasSurvey = cartItems?.some(item =>
    (item.survey_audit?.survey_pool && !item.survey_audit.survey_pool.is_audit) ||
    item.occ_survey_code // Simplification: assume occasional surveys are surveys for now
  );

  const hasAudit = cartItems?.some(item =>
    item.survey_audit?.survey_pool?.is_audit
  );

  return {
    request: requests[0],
    cartItems: cartItems || [],
    employees: employees || [],
    hasSurvey,
    hasAudit
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const db = await getDb(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "process_request") {
    try {
      const surveyor_id = formData.get("surveyor_id") ? parseInt(formData.get("surveyor_id") as string) : null;
      const auditor_id = formData.get("auditor_id") ? parseInt(formData.get("auditor_id") as string) : null;
      const reviewer_id = formData.get("reviewer_id") ? parseInt(formData.get("reviewer_id") as string) : null;

      const { data: jobId } = await db.rpc<number>("convert_request_to_job", {
        body: {
          p_request_id: parseInt(params.id),
          p_surveyor_id: surveyor_id,
          p_auditor_id: auditor_id,
          p_reviewer_id: reviewer_id
        },
      });

      if (!jobId) {
        return { error: "Failed to create job" };
      }

      // Find the associated survey job to redirect to
      const { data: surveyJob } = await db.getOne<{ id: number }>("/survey_jobs", {
        filters: { job_id: `eq.${jobId}` },
        select: "id"
      }).catch(() => ({ data: null }));

      if (surveyJob?.id) {
        return redirect(`/surveys/${surveyJob.id}`);
      }

      // If no survey job, maybe it's an audit job
      const { data: auditJob } = await db.getOne<{ id: number }>("/audit_jobs", {
        filters: { job_id: `eq.${jobId}` },
        select: "id"
      }).catch(() => ({ data: null }));

      if (auditJob?.id) {
        return redirect(`/jobs`); // Or a specific audit page if it exists
      }

      return redirect("/jobs");
    } catch (error: unknown) {
      console.error("Process request error:", error);
      return { error: (error as Error).message || "Failed to process request" };
    }
  }
  return { error: "Unknown action" };
}

export default function RequestDetail() {
  const { request, cartItems, employees, hasSurvey, hasAudit } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RequestHeader
          request={request}
          employees={employees}
          hasSurvey={hasSurvey}
          hasAudit={hasAudit}
        />
        <div className="space-y-8">
          <RequestInfo request={request} />
          <RequestCartTable items={cartItems} />
        </div>
      </div>
    </div>
  );
}
