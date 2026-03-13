import { useLoaderData } from "react-router";
import { getDb } from "~/.server/lib/api";
import type { Route } from "./+types/detail";
import { Accordion } from "~/components/ui/Accordion";
import { SurveyRequestProvider, useSurveyRequest } from "~/components/SurveyRequestCart";
import { CartDrawer, FloatingCartButton } from "~/components/CartDrawer";
import { getSession } from "~/.server/lib/sessions";
import { decrypt } from "~/.server/lib/jwt";
import type { Document, SurveyRequest } from "~/definitions/database.iclass.types";

import { VesselHeader } from "./components/detail/VesselHeader";
import { VesselOverview } from "./components/detail/VesselOverview";
import { CertificatesTable } from "./components/detail/CertificatesTable";
import { SurveysTable } from "./components/detail/SurveysTable";
import { FindingsList } from "./components/detail/FindingsList";

export async function loader({ request, params }: Route.LoaderArgs) {
  const db = await getDb(request);
  const [{ data: vessels }, { data: certs }, { data: docs }, { data: findings }, { data: surveys }, { data: allPool }] = await Promise.all([
    db.get<any[]>("/ships", { filters: { id: `eq.${params.id}` } }),
    db.get<any[]>("/certificates", { filters: { ship_id: `eq.${params.id}` } }),
    db.get<Document[]>("/documents", { filters: { ship_id: `eq.${params.id}` } }),
    db.get<any[]>("/finding_comments", { filters: { ship_id: `eq.${params.id}` } }),
    db.get<any[]>("/survey_audits", { filters: { ship_id: `eq.${params.id}` } }),
    db.get<any[]>("/survey_pool"),
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
      await db.post("/survey_request_carts", { body: cartItems.map((i: any) => ({ ...i, survey_request_id: newReqs[0].id })) });
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

  const handleToggle = (item: any, type: "survey" | "finding" | "other") => {
    if (type === "survey" && item.is_ordered) return;
    if (isItemSelected(item.id, type)) {
      removeItem(item.id, type);
    } else {
      addItem({
        id: item.id,
        type,
        description: type === "survey" ? item.description : type === "finding" ? item.text : item.name,
        code: type === "survey" ? item.code : type === "finding" ? item.comment_type : item.code,
        date: type === "survey" ? item.next_due_date : type === "finding" ? item.date_issued : undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <VesselHeader vessel={vessel} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <VesselOverview vessel={vessel} />
        <Accordion type="multiple" className="space-y-4">
          <CertificatesTable certificates={certificates} />
          <SurveysTable surveys={surveys} otherSurveys={otherSurveys} isItemSelected={isItemSelected} onToggleItem={handleToggle} />
          <FindingsList findings={findings} isItemSelected={isItemSelected} onToggleItem={handleToggle} />
        </Accordion>
      </div>
      <CartDrawer vesselId={vessel.id} companyId={vessel.registered_owner_id} />
      <FloatingCartButton />
    </div>
  );
}
