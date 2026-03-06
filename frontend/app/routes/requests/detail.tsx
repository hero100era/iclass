/** React Router Route Component */
import {
  ArrowLeft,
  CheckCircle2,
  UserPlus,
  FileText,
  MapPin,
  Calendar,
  Phone,
} from "lucide-react";
import {
  Link,
  useLoaderData,
  Form,
  useActionData,
  redirect,
} from "react-router";
import { type Employee } from "~/definitions/database.iclass.types";
import { getDb } from "~/.server/lib/api";

import type { Route } from "./+types/detail";

interface CartItem {
  id: number;
  survey_audit_id?: number;
  comment_id?: number;
  occ_survey_code?: string;
  survey_audits?: { cert_code?: string };
  [key: string]: unknown;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params;
  const db = await getDb(request);

  const [{ data: requests }, { data: cartItems }, { data: employees }] =
    await Promise.all([
      db.get<any[]>("/survey_requests", {
        filters: { id: `eq.${id}` },
        select: "*,ships(name,imo_number),organizations(name)",
      }),
      db.get<any[]>("/survey_request_carts", {
        filters: { survey_request_id: `eq.${id}` },
        select:
          "*,survey_audits!survey_audit_id(*),finding_comments!comment_id(*)",
      }),
      db.get<any[]>("/employees", {
        filters: { is_active: "eq.true" },
        order: "display_name.asc",
      }),
    ]);

  if (!requests || requests.length === 0) {
    throw new Response("Request not found", { status: 404 });
  }

  return { requestItem: requests[0], cartItems, employees };
}


export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const surveyorId = formData.get("surveyor_id");
  const auditorId = formData.get("auditor_id");
  const reviewerId = formData.get("reviewer_id");
  const intent = formData.get("intent");

  if (intent === "reject") {
    // Handle rejection logic if needed
    return { message: "Rejection not implemented yet" };
  }

  try {
    const db = await getDb(request);
    await db.rpc("convert_request_to_job", {
      body: {
        p_request_id: parseInt(params.id!),
        p_surveyor_id: surveyorId ? parseInt(surveyorId as string) : null,
        p_auditor_id: auditorId ? parseInt(auditorId as string) : null,
        p_reviewer_id: reviewerId ? parseInt(reviewerId as string) : null,
      },
    });

    return redirect("/requests");
  } catch (error: any) {
    return { error: error.message || "Failed to convert request to job" };
  }
}


export default function RequestDetail() {
  const { requestItem, cartItems, employees } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const surveyItems = cartItems.filter(
    (item: CartItem) => item.survey_audit_id || item.occ_survey_code,
  );
  const findingItems = cartItems.filter((item: CartItem) => item.comment_id);

  const hasAuditItems = cartItems.some((item: CartItem) =>
    ["SMC", "ISPS", "MLC", "DOC"].includes(item.survey_audits?.cert_code || ""),
  );
  // More generically, use the is_audit flag from backend if possible, but here we'll just check if auditor assignment is needed.
  const needsAuditor = hasAuditItems;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link
          to="/requests"
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Review Survey Request
          </h2>
          <p className="text-muted-foreground">
            Request ID: #{requestItem.id} • Submitted on{" "}
            {new Date(requestItem.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {actionData?.error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckCircle2 size={20} className="rotate-180" />
          <p>{actionData.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Details Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Vessel & Company Info */}
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Vessel
                </h3>
                <p className="text-xl font-bold">{requestItem.ships?.name}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  IMO: {requestItem.ships?.imo_number}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Company
                </h3>
                <p className="text-xl font-bold">
                  {requestItem.organizations?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Email: {requestItem.contact_email}
                </p>
              </div>
            </div>

            <div className="border-t pt-6 grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin size={18} />
                  <span>{requestItem.location}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar size={18} />
                  <span>{requestItem.estimated_date}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <UserPlus size={18} />
                  <span>{requestItem.contact_person}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone size={18} />
                  <span>{requestItem.contact_phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Surveys & Audits */}
          {surveyItems.length > 0 && (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm mb-8">
              <div className="px-6 py-4 border-b bg-muted/50">
                <h3 className="font-semibold flex items-center gap-2 text-primary">
                  <FileText size={18} />
                  <span>Surveys & Audits</span>
                </h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b text-sm">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">
                      Code
                    </th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">
                      Description
                    </th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">
                      Range / Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {surveyItems.map((item: CartItem) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-sm">
                        {(item.survey_audits as any)?.code ||
                          item.occ_survey_code}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">
                          {(item.survey_audits as any)?.description ||
                            "Occasional Survey"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {item.survey_audits ? (
                          <span>
                            {(item.survey_audits as any)?.range_from_date} -{" "}
                            {(item.survey_audits as any)?.range_to_date}
                          </span>
                        ) : (
                          <span className="italic">Occasional item</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Finding Comments */}
          {findingItems.length > 0 && (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b bg-amber-500/5">
                <h3 className="font-semibold flex items-center gap-2 text-amber-600">
                  <CheckCircle2 size={18} />
                  <span>Finding Comments</span>
                </h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b text-sm">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">
                      Type
                    </th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">
                      Description / Text
                    </th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {findingItems.map((item: CartItem) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                          {(item.finding_comments as any)?.comment_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm leading-relaxed">
                          {(item.finding_comments as any)?.text}
                        </p>
                        {(item.finding_comments as any)?.due_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {(item.finding_comments as any)?.due_date}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium">
                          {(item.finding_comments as any)?.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assignment Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm sticky top-8">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-primary" />
              <span>Assign Personnel</span>
            </h3>

            <Form method="post" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Surveyor
                  </label>
                  <select
                    name="surveyor_id"
                    required
                    className="w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Select Surveyor</option>
                    {employees.map((emp: Employee) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                {needsAuditor && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Auditor
                    </label>
                    <select
                      name="auditor_id"
                      required
                      className="w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="">Select Auditor</option>
                      {employees.map((emp: Employee) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Reviewer
                  </label>
                  <select
                    name="reviewer_id"
                    required
                    className="w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Select Reviewer</option>
                    {employees.map((emp: Employee) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  name="intent"
                  value="approve"
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 size={18} />
                  <span>Accept & Create Job</span>
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="reject"
                  className="w-full border border-destructive text-destructive py-2.5 rounded-lg font-semibold hover:bg-destructive/5 transition-colors"
                >
                  Reject Request
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
