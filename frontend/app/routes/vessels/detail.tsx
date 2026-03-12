import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import {
  Ship as ShipIcon,
  MapPin,
  Calendar,
  Ruler,
  Weight,
  Info,
  FileBadge,
  FileText,
  Activity,
  Anchor,
  Flag,
  Lock,
  MessageSquare,
  Plus,
  Minus,
  Network,
} from "lucide-react";
import { getDb } from "../../.server/lib/api";

import type { Route } from "./+types/detail";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/Accordion";
import { GridItem, StatusBadge } from "~/components/ui/DetailHelpers";
import {
  SurveyRequestProvider,
  useSurveyRequest,
} from "~/components/SurveyRequestCart";
import { CartDrawer, FloatingCartButton } from "~/components/CartDrawer";
import { getSession } from "~/.server/lib/sessions";
import { decrypt } from "~/.server/lib/jwt";
import type {
  Document,
  SurveyRequest,
} from "~/definitions/database.iclass.types";

interface Certificate {
  id: number;
  description?: string;
  certificate_id?: string;
  issue_date?: string;
  expiry_date?: string;
  status?: string;
}

interface Survey {
  id: number;
  certificate_id?: number;
  code?: string;
  description?: string;
  last_held_date?: string;
  place_held?: string;
  next_due_date?: string;
  status?: string;
  is_ordered?: boolean;
}

interface Finding {
  id: number;
  comment_type: string;
  date_issued?: string;
  due_date?: string;
  certificates?: string;
  status?: string;
  text?: string;
  mms_reference?: string;
  priviate?: boolean;
}

interface OtherSurvey {
  id: number;
  name: string;
  description?: string;
  code?: string;
}

interface Vessel {
  id: number;
  name: string;
  imo_number?: string;
  flag_code?: string;
  call_sign?: string;
  official_number?: string;
  port_of_registry?: string;
  keel_laid_date?: string;
  delivery_date?: string;
  class_notation?: string;
  class_id?: string;
  vessel_status?: string;
  owner_name?: string;
  gross_tonnage?: number;
  net_tonnage?: number;
  deadweight?: number;
  length_overall?: number;
  length_bp?: number;
  breadth_moulded?: number;
  depth_moulded?: number;
  draught?: number;
  status?: string;
  registered_owner_id?: number;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const db = await getDb(request);

  const [
    { data: vessels },
    { data: certificates },
    { data: documents },
    { data: findings },
    { data: otherSurveys },
  ] = await Promise.all([
    db.get<Vessel[]>("/ships", { filters: { id: `eq.${params.id}` } }),
    db.get<Certificate[]>("/certificates", {
      filters: { ship_id: `eq.${params.id}` },
    }),
    db.get<Document[]>("/documents", {
      filters: { ship_id: `eq.${params.id}` },
    }),
    db.get<Finding[]>("/finding_comments", {
      filters: { ship_id: `eq.${params.id}` },
    }),
    db.get<OtherSurvey[]>("/survey_pool"),
  ]);

  if (!vessels || vessels.length === 0)
    throw new Response("Vessel not found.", { status: 404 });

  let surveys: Survey[] = [];
  if (certificates.length > 0) {
    const certIds = certificates.map((c) => c.id).join(",");
    const { data: fetchedSurveys } = await db.get<Survey[]>("/survey_audits", {
      filters: { certificate_id: `in.(${certIds})` },
    });
    surveys = fetchedSurveys || [];
  }

  return {
    vessel: vessels[0],
    certificates: certificates || [],
    surveys,
    documents: documents || [],
    findings: findings || [],
    otherSurveys: otherSurveys || [],
  };
}

export async function action({ request }: Route.ActionArgs) {
  const db = await getDb(request);
  const session = await getSession(request.headers.get("Cookie"));
  const user = await decrypt(session.get("jwt"));
  const userId = user?.id;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "submit_survey_request") {
    const payload = JSON.parse(formData.get("payload") as string);
    const { requestData, cartItems } = payload;

    try {
      const { data: newRequests } = await db.post<SurveyRequest[]>(
        "/survey_requests",
        {
          body: {
            ...requestData,
            ordered_by_id: userId,
          },
          prefer: { return: "representation" },
        },
      );

      if (!newRequests || newRequests.length === 0) {
        throw new Error("Failed to create survey request");
      }

      const newRequest = newRequests[0];

      const cartPayload = cartItems.map(
        (item: { id: number; type: string }) => ({
          ...item,
          survey_request_id: newRequest.id,
        }),
      );

      await db.post("/survey_request_carts", { body: cartPayload });

      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process survey request",
      };
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
  const { vessel, certificates, surveys, findings, otherSurveys } =
    useLoaderData<typeof loader>();
  const { addItem, removeItem, isItemSelected } = useSurveyRequest();
  const [showOtherSelector, setShowOtherSelector] = useState(false);

  const handleToggleCartItem = (
    item: Survey | Finding | OtherSurvey,
    type: "survey" | "finding" | "other",
  ) => {
    if (type === "survey" && "is_ordered" in item && item.is_ordered) return;

    if (isItemSelected(item.id, type)) {
      removeItem(item.id, type);
    } else {
      addItem({
        id: item.id,
        type,
        description:
          type === "survey"
            ? (item as Survey).description || ""
            : type === "finding"
              ? (item as Finding).text || ""
              : (item as OtherSurvey).name || "",
        code:
          type === "survey"
            ? (item as Survey).code || ""
            : type === "finding"
              ? (item as Finding).comment_type || ""
              : (item as OtherSurvey).code || "",
        date:
          type === "survey"
            ? (item as Survey).next_due_date
            : type === "finding"
              ? (item as Finding).date_issued
              : undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header / Summary Card */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6 items-start">
            <div className="hidden sm:block">
              <div className="bg-[#005EAA]/10 p-3 rounded-full">
                <Anchor className="w-8 h-8 text-[#005EAA]" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900">
                    {vessel.name}
                  </h1>
                  <StatusBadge status={vessel.status || "Active"} />
                </div>
                <Link
                  to={`/vessels/${vessel.id}/breakdowns`}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Network size={14} className="text-primary" /> Breakdown
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">IMO:</span>{" "}
                  {vessel.imo_number}
                </span>
                <span className="flex items-center gap-1.5">
                  <Flag className="w-4 h-4" />
                  {vessel.flag_code}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Accordion
          type="multiple"
          defaultValue={["identity", "class", "dimensions"]}
          className="space-y-4"
        >
          {/* Identification */}
          <AccordionItem value="identity">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <Info className="w-5 h-5 text-slate-400" />
                Identification
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <GridItem
                  label="Vessel Name"
                  value={vessel.name}
                  icon={ShipIcon}
                />
                <GridItem
                  label="IMO Number"
                  value={vessel.imo_number}
                  icon={FileBadge}
                />
                <GridItem
                  label="Call Sign"
                  value={vessel.call_sign}
                  icon={Activity}
                />
                <GridItem
                  label="Official Number"
                  value={vessel.official_number}
                  icon={FileText}
                />
                <GridItem
                  label="Port of Registry"
                  value={vessel.port_of_registry}
                  icon={MapPin}
                />
                <GridItem label="Flag" value={vessel.flag_code} icon={Flag} />
                <GridItem
                  label="Keel Laid"
                  value={vessel.keel_laid_date}
                  icon={Calendar}
                />
                <GridItem
                  label="Delivery Date"
                  value={vessel.delivery_date}
                  icon={Calendar}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Classification */}
          <AccordionItem value="class">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-slate-400" />
                Classification
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <GridItem
                  label="Class Notation"
                  value={vessel.class_notation || "1A1 General Cargo"}
                  icon={FileBadge}
                />
                <GridItem
                  label="Class ID"
                  value={vessel.class_id || "12345"}
                  icon={FileText}
                />
                <GridItem
                  label="Status"
                  value={
                    <StatusBadge status={vessel.vessel_status || "active"} />
                  }
                  icon={Activity}
                />
                <GridItem
                  label="Registered Owner"
                  value={vessel.owner_name}
                  icon={ShipIcon}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Dimensions */}
          <AccordionItem value="dimensions">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-slate-400" />
                Dimensions &amp; Tonnage
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <GridItem
                  label="Gross Tonnage"
                  value={vessel.gross_tonnage}
                  icon={Weight}
                />
                <GridItem
                  label="Net Tonnage"
                  value={vessel.net_tonnage}
                  icon={Weight}
                />
                <GridItem
                  label="Deadweight"
                  value={vessel.deadweight}
                  icon={Weight}
                />
                <GridItem
                  label="Length Overall"
                  value={`${vessel.length_overall || "-"} m`}
                  icon={Ruler}
                />
                <GridItem
                  label="Length BP"
                  value={`${vessel.length_bp || "-"} m`}
                  icon={Ruler}
                />
                <GridItem
                  label="Breadth"
                  value={`${vessel.breadth_moulded || "-"} m`}
                  icon={Ruler}
                />
                <GridItem
                  label="Depth"
                  value={`${vessel.depth_moulded || "-"} m`}
                  icon={Ruler}
                />
                <GridItem
                  label="Draught"
                  value={`${vessel.draught || "-"} m`}
                  icon={Ruler}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Certificates */}
          <AccordionItem value="certificates">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Certificates ({certificates.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Certificate</th>
                      <th className="px-4 py-3 font-medium">Issued</th>
                      <th className="px-4 py-3 font-medium">Expiry</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certificates.length > 0 ? (
                      certificates.map((cert: Certificate) => (
                        <tr
                          key={cert.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {cert.description || cert.certificate_id}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {cert.issue_date}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {cert.expiry_date}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={cert.status || "Valid"} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-slate-500 italic"
                        >
                          No certificates found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Surveys */}
          <AccordionItem value="surveys">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-400" />
                Surveys &amp; Audits ({surveys.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Last Held</th>
                      <th className="px-4 py-3 font-medium">Next Due</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {surveys.length > 0 ? (
                      surveys.map((survey: Survey) => (
                        <tr
                          key={survey.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-600">
                            {survey.code}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-medium">
                            {survey.description}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div>{survey.last_held_date}</div>
                            <div className="text-xs text-slate-400">
                              {survey.place_held}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {survey.next_due_date || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={survey.status || "pending"} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() =>
                                handleToggleCartItem(survey, "survey")
                              }
                              disabled={survey.is_ordered}
                              className={`p-1.5 rounded-md transition-colors ${
                                survey.is_ordered
                                  ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                                  : isItemSelected(survey.id, "survey")
                                    ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                              title={
                                survey.is_ordered
                                  ? "Already Ordered"
                                  : isItemSelected(survey.id, "survey")
                                    ? "Remove from Request"
                                    : "Add to Request"
                              }
                            >
                              {isItemSelected(survey.id, "survey") ? (
                                <Minus className="w-4 h-4" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500 italic"
                        >
                          No surveys found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <div className="relative">
                  <button
                    onClick={() => setShowOtherSelector(!showOtherSelector)}
                    className="text-[#005EAA] hover:text-[#004a85] text-sm font-medium underline underline-offset-4 flex items-center gap-1 transition-colors group"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Request Occasional Survey(s)
                  </button>

                  {showOtherSelector && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowOtherSelector(false)}
                      />
                      <div className="absolute right-0 bottom-full mb-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2">
                        <div className="px-4 py-2 border-b border-slate-100 mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Available Surveys
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {otherSurveys.map((item: OtherSurvey) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                handleToggleCartItem(item, "other");
                                setShowOtherSelector(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                            >
                              <div className="flex-1 min-w-0 pr-3">
                                <div className="text-sm font-semibold text-slate-900 group-hover:text-[#005EAA] transition-colors">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {item.description}
                                </div>
                              </div>
                              {isItemSelected(item.id, "other") ? (
                                <Minus className="w-4 h-4 text-amber-500 shrink-0" />
                              ) : (
                                <Plus className="w-4 h-4 text-slate-300 group-hover:text-[#005EAA] shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Findings & Comments */}
          <AccordionItem value="findings">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                Findings &amp; Comments ({findings.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {findings.length > 0 ? (
                  findings.map((finding: Finding) => (
                    <div
                      key={finding.id}
                      className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col md:flex-row"
                    >
                      <div className="md:w-64 bg-slate-50/50 p-4 border-b md:border-b-0 md:border-r border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <StatusBadge status={finding.comment_type} />
                          {finding.priviate && (
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                          Details
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-medium">
                              Issue Date
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {finding.date_issued}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-medium">
                              Due Date
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {finding.due_date || "—"}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-medium">
                              Reference
                            </span>
                            <span
                              className="text-sm font-medium text-slate-700 truncate"
                              title={finding.certificates}
                            >
                              {finding.certificates || "—"}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2">
                          <StatusBadge
                            status={
                              finding.status === "A"
                                ? "Active"
                                : finding.status === "P"
                                  ? "Postponed"
                                  : "Overdue"
                            }
                          />
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-200">
                          <button
                            onClick={() =>
                              handleToggleCartItem(finding, "finding")
                            }
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isItemSelected(finding.id, "finding")
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                : "bg-[#005EAA]/10 text-[#005EAA] hover:bg-[#005EAA]/20"
                            }`}
                          >
                            {isItemSelected(finding.id, "finding") ? (
                              <>
                                <Minus className="w-4 h-4" /> Remove
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Add to Request
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 p-5">
                        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {finding.text}
                        </div>
                        {finding.mms_reference && (
                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 font-mono">
                            Ref: {finding.mms_reference}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-lg text-slate-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="italic">
                      No findings or comments recorded for this vessel.
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <CartDrawer vesselId={vessel.id} companyId={vessel.registered_owner_id} />
      <FloatingCartButton />
    </div>
  );
}
