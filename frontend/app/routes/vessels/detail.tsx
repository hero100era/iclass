import { useLoaderData } from "react-router";
import { getDb } from "~/.server/lib/api";
import type { Route } from "./+types/detail";
import { Accordion } from "~/components/ui/Accordion";
import { SurveyRequestProvider, useSurveyRequest } from "~/components/SurveyRequestCart";
import { CartDrawer, FloatingCartButton } from "~/components/CartDrawer";
import { getSession } from "~/.server/lib/sessions";
import { decrypt } from "~/.server/lib/jwt";
import type { Document, SurveyRequest, Ship, Certificate, FindingComment, SurveyAudit, SurveyPool, SurveyRequestCartInput } from "~/definitions/database.iclass.types";

import { VesselHeader } from "./components/detail/VesselHeader";
import { VesselOverview } from "./components/detail/VesselOverview";
import { CertificatesTable } from "./components/detail/CertificatesTable";
import { SurveysTable } from "./components/detail/SurveysTable";
import { FindingsList } from "./components/detail/FindingsList";

export async function loader({ request, params }: Route.LoaderArgs) {
  const db = await getDb(request);
  const [{ data: vessels }, { data: certs }, { data: docs }, { data: findings }, { data: surveys }, { data: allPool }] = await Promise.all([
    db.get<Ship[]>("/ships", { filters: { id: `eq.${params.id}` } }),
    db.get<Certificate[]>("/certificates", { filters: { ship_id: `eq.${params.id}` } }),
    db.get<Document[]>("/documents", { filters: { ship_id: `eq.${params.id}` } }),
    db.get<FindingComment[]>("/finding_comments", { filters: { ship_id: `eq.${params.id}` } }),
    db.get<SurveyAudit[]>("/survey_audits", { filters: { ship_id: `eq.${params.id}` } }),
    db.get<SurveyPool[]>("/survey_pool"),
  ]);

  if (!vessels?.[0]) throw new Response("Vessel not found.", { status: 404 });

  const usedPoolIds = new Set((surveys || []).map(s => s.pool_id).filter(Boolean));
  const otherSurveys = (allPool || []).filter(s => !usedPoolIds.has(s.id));

  return { vessel: vessels[0], certificates: certs || [], surveys: surveys || [], documents: docs || [], findings: findings || [], otherSurveys };
}

export async function action({ request }: Route.ActionArgs) {
  const db = await getDb(request);
  const session = await getSession(request.headers.get("Cookie"));
  const user = await decrypt(session.get("jwt"));
  const formData = await request.formData();

  if (formData.get("intent") === "submit_survey_request") {
    const { requestData, cartItems } = JSON.parse(formData.get("payload") as string);
    const { data: newReqs } = await db.post<SurveyRequest[]>("/survey_requests", {
      body: { ...requestData, ordered_by_id: user?.id },
      prefer: { return: "representation" },
    });
    if (newReqs?.[0]) {
      await db.post("/survey_request_carts", { body: (cartItems as SurveyRequestCartInput[]).map((i) => ({ ...i, survey_request_id: newReqs[0].id })) });
      return { success: true };
    }
  }
  return { success: false, error: "Invalid intent" };
}

export default function VesselDetail() {
  return (
    <SurveyRequestProvider>
      <VesselDetailContent />
    </SurveyRequestProvider>
  );
}

function VesselDetailContent() {
  const { vessel, certificates, surveys, findings, otherSurveys } = useLoaderData<typeof loader>();
  const { addItem, removeItem, isItemSelected } = useSurveyRequest();

  const handleToggle = (item: {
    id: number | string;
    description?: string;
    code?: string;
    next_due_date?: string;
    text?: string;
    date_issued?: string | Date;
    name?: string;
    comment_type?: string;
    is_ordered?: boolean
  }, type: "survey" | "finding" | "other") => {
    if (type === "survey" && item.is_ordered) return;
    if (isItemSelected(item.id, type)) {
      removeItem(item.id, type);
    } else {
      addItem({
        id: item.id,
        type,
        description: type === "survey" ? (item.description || "") : type === "finding" ? (item.text || "") : (item.name || ""),
        code: type === "survey" ? item.code : type === "finding" ? item.comment_type : item.code,
        date: type === "survey" ? item.next_due_date : type === "finding" ? (item.date_issued ? String(item.date_issued) : undefined) : undefined,
      });
    }
  };

  // Map entities to component-specific interfaces to resolve type mismatches
  const mappedVessel = {
    ...vessel,
    status: vessel.ship_status || "Active",
    gross_tonnage: vessel.gross_tons,
    net_tonnage: vessel.net_tons,
    length_overall: vessel.length_oa,
    breadth_moulded: vessel.moulded_breadth,
    depth_moulded: vessel.moulded_depth,
    draught: vessel.moulded_draft,
    owner_name: (vessel as unknown as Record<string, unknown>).owner_name as string | null // Use unknown intermediate to cast
  };

  const mappedCertificates = certificates.map(c => ({
    id: c.id,
    description: c.description || undefined,
    certificate_id: String(c.certificate_id),
    issue_date: c.issue_date instanceof Date ? c.issue_date.toLocaleDateString() : String(c.issue_date),
    expiry_date: c.expiry_date ? (c.expiry_date instanceof Date ? c.expiry_date.toLocaleDateString() : String(c.expiry_date)) : undefined,
    status: c.status
  }));

  const mappedSurveys = surveys.map(s => ({
    id: s.id,
    code: s.cert_code || undefined,
    description: s.description,
    last_held_date: s.last_held_date instanceof Date ? s.last_held_date.toLocaleDateString() : String(s.last_held_date),
    place_held: s.place_held,
    next_due_date: s.next_due_date ? (s.next_due_date instanceof Date ? s.next_due_date.toLocaleDateString() : String(s.next_due_date)) : undefined,
    status: s.survey_status || undefined,
    is_ordered: !!s.is_ordered,
    pool_id: s.pool_id // Extra for handleToggle
  }));

  const mappedOtherSurveys = otherSurveys.map(os => ({
    id: os.id,
    name: os.name,
    description: os.description || undefined,
    code: os.code || undefined
  }));

  const mappedFindings = findings.map(f => ({
    id: f.id,
    comment_type: f.comment_type,
    date_issued: f.date_issued instanceof Date ? f.date_issued.toLocaleDateString() : String(f.date_issued),
    due_date: f.due_date ? (f.due_date instanceof Date ? f.due_date.toLocaleDateString() : String(f.due_date)) : undefined,
    status: f.status || undefined,
    text: f.text || undefined,
    mms_reference: f.mms_reference || undefined,
    priviate: !!f.is_private
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <VesselHeader vessel={mappedVessel} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <VesselOverview vessel={mappedVessel} />
        <Accordion type="multiple" className="space-y-4">
          <CertificatesTable certificates={mappedCertificates} />
          <SurveysTable surveys={mappedSurveys} otherSurveys={mappedOtherSurveys} isItemSelected={isItemSelected} onToggleItem={handleToggle} />
          <FindingsList findings={mappedFindings} isItemSelected={isItemSelected} onToggleItem={handleToggle} />
        </Accordion>
      </div>
      <CartDrawer vesselId={vessel.id} companyId={vessel.registered_owner_id ?? 0} />
      <FloatingCartButton />
    </div>
  );
}
