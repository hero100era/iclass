import { useState } from "react";
import { useLoaderData } from "react-router";
import { Ship, Scale, MapPin, Calendar, Ruler, Weight, Info, FileBadge, FileText, Activity, ChevronRight, Download, ExternalLink, Anchor, Flag, Lock, MessageSquare } from "lucide-react";
import { ApiGET } from "~/.server/lib/api";
import type { Route } from "./+types/detail";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/Accordion";
import { GridItem, StatusBadge } from "~/components/ui/DetailHelpers";

export async function loader({ request, params }: Route.LoaderArgs) {
    const host = process.env.API_URL || "http://localhost:2000";

    const [vesselRes, certsRes, docsRes, findingsRes] = await Promise.all([
        ApiGET(request, `${host}/ships?id=eq.${params.id}`),
        ApiGET(request, `${host}/certificates?ship_id=eq.${params.id}`),
        ApiGET(request, `${host}/documents?ship_id=eq.${params.id}`),
        ApiGET(request, `${host}/finding_comments?ship_id=eq.${params.id}`)
    ]);

    if (!vesselRes.ok) throw new Response("Vessel not found.", { status: 404 });

    const vessels = await vesselRes.json();
    if (!vessels || vessels.length === 0) throw new Response("Vessel not found.", { status: 404 });

    const certificates = certsRes.ok ? await certsRes.json() : [];
    const documents = docsRes.ok ? await docsRes.json() : [];
    const findings = findingsRes.ok ? await findingsRes.json() : [];

    let surveys: any[] = [];
    if (certificates.length > 0) {
        const certIds = certificates.map((c: any) => c.id).join(",");
        const surveysRes = await ApiGET(request, `${host}/survey_audits?certificate_id=in.(${certIds})`);
        if (surveysRes.ok) surveys = await surveysRes.json();
    }

    return { vessel: vessels[0], certificates, surveys, documents, findings };
}

const DNV_BLUE = "#005EAA";

export default function VesselDetail() {
    const { vessel, certificates, surveys, documents, findings } = useLoaderData<typeof loader>();

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
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-slate-900">{vessel.name}</h1>
                                <StatusBadge status={vessel.status || "Active"} />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-700">IMO:</span> {vessel.imo_number}
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
                <Accordion type="multiple" defaultValue={["identity", "class", "dimensions"]} className="space-y-4">

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
                                <GridItem label="Vessel Name" value={vessel.name} icon={Ship} />
                                <GridItem label="IMO Number" value={vessel.imo_number} icon={FileBadge} />
                                <GridItem label="Call Sign" value={vessel.call_sign} icon={Activity} />
                                <GridItem label="Official Number" value={vessel.official_number} icon={FileText} />
                                <GridItem label="Port of Registry" value={vessel.port_of_registry} icon={MapPin} />
                                <GridItem label="Flag" value={vessel.flag_code} icon={Flag} />
                                <GridItem label="Keel Laid" value={vessel.keel_laid_date} icon={Calendar} />
                                <GridItem label="Delivery Date" value={vessel.delivery_date} icon={Calendar} />
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
                                <GridItem label="Class Notation" value={vessel.class_notation || "1A1 General Cargo"} icon={FileBadge} />
                                <GridItem label="Class ID" value={vessel.class_id || "12345"} icon={FileText} />
                                <GridItem label="Status" value={<StatusBadge status={vessel.vessel_status} />} icon={Activity} />
                                <GridItem label="Registered Owner" value={vessel.owner_name} icon={Ship} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Dimensions */}
                    <AccordionItem value="dimensions">
                        <AccordionTrigger>
                            <span className="flex items-center gap-2">
                                <Ruler className="w-5 h-5 text-slate-400" />
                                Dimensions & Tonnage
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <GridItem label="Gross Tonnage" value={vessel.gross_tonnage} icon={Weight} />
                                <GridItem label="Net Tonnage" value={vessel.net_tonnage} icon={Weight} />
                                <GridItem label="Deadweight" value={vessel.deadweight} icon={Weight} />
                                <GridItem label="Length Overall" value={`${vessel.length_overall || "-"} m`} icon={Ruler} />
                                <GridItem label="Length BP" value={`${vessel.length_bp || "-"} m`} icon={Ruler} />
                                <GridItem label="Breadth" value={`${vessel.breadth_moulded || "-"} m`} icon={Ruler} />
                                <GridItem label="Depth" value={`${vessel.depth_moulded || "-"} m`} icon={Ruler} />
                                <GridItem label="Draught" value={`${vessel.draught || "-"} m`} icon={Ruler} />
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
                                            certificates.map((cert: any) => (
                                                <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-900">{cert.description || cert.certificate_id}</td>
                                                    <td className="px-4 py-3 text-slate-600">{cert.issue_date}</td>
                                                    <td className="px-4 py-3 text-slate-600">{cert.expiry_date}</td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={cert.status || "Valid"} />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
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
                                Surveys & Audits ({surveys.length})
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Type</th>
                                            <th className="px-4 py-3 font-medium">Code</th>
                                            <th className="px-4 py-3 font-medium">Description</th>
                                            <th className="px-4 py-3 font-medium">Last Held</th>
                                            <th className="px-4 py-3 font-medium">Next Due</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {surveys.length > 0 ? (
                                            surveys.map((survey: any) => (
                                                <tr key={survey.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-900">{survey.type}</td>
                                                    <td className="px-4 py-3 text-slate-600">{survey.code}</td>
                                                    <td className="px-4 py-3 text-slate-600 font-medium">{survey.description}</td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        <div>{survey.last_held_date}</div>
                                                        <div className="text-xs text-slate-400">{survey.place_held}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{survey.next_due_date || "-"}</td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={survey.status} />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                                                    No surveys found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    {/* Findings & Comments */}
                    <AccordionItem value="findings">
                        <AccordionTrigger>
                            <span className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-slate-400" />
                                Findings & Comments ({findings.length})
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-6">
                                {findings.length > 0 ? (
                                    findings.map((finding: any) => (
                                        <div key={finding.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col md:flex-row">
                                            <div className="md:w-64 bg-slate-50/50 p-4 border-b md:border-b-0 md:border-r border-slate-200 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <StatusBadge status={finding.comment_type} />
                                                    {finding.priviate && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                                                </div>
                                                <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Details</div>
                                                <div className="space-y-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 uppercase font-medium">Issue Date</span>
                                                        <span className="text-sm font-medium text-slate-700">{finding.date_issued}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 uppercase font-medium">Due Date</span>
                                                        <span className="text-sm font-medium text-slate-700">{finding.due_date || "—"}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 uppercase font-medium">Reference</span>
                                                        <span className="text-sm font-medium text-slate-700 truncate" title={finding.certificates}>
                                                            {finding.certificates || "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="pt-2">
                                                    <StatusBadge status={finding.status === 'A' ? 'Active' : finding.status === 'P' ? 'Postponed' : 'Overdue'} />
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
                                        <p className="italic">No findings or comments recorded for this vessel.</p>
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );
}
