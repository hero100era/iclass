import { ArrowLeft, Ship, Building2, Info, Save, PanelLeft, ChevronRight, MapPin } from "lucide-react";
import { Link, useLoaderData, Outlet, useParams, NavLink } from "react-router";
import { ApiGET } from "~/.server/lib/api";
import type { Route } from "./+types/layout";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "~/components/ui/Accordion";
import { cn } from "~/lib/utils";

export async function loader({ params, request }: Route.LoaderArgs) {
    const { id } = params;
    const host = process.env.API_URL || "http://localhost:2000";

    // 1. Get the job info
    const jobRes = await ApiGET(request, `${host}/jobs?id=eq.${id}`);
    if (!jobRes.ok) throw new Response("Job not found", { status: 404 });
    const jobs = await jobRes.json();
    if (jobs.length === 0) throw new Response("Job not found", { status: 404 });
    const job = jobs[0];

    // 2. Try to get survey job or audit job info
    const [surveyJobRes, auditJobRes] = await Promise.all([
        ApiGET(request, `${host}/survey_jobs?job_id=eq.${id}&select=*,ships(*)`),
        ApiGET(request, `${host}/audit_jobs?job_id=eq.${id}&select=*,ships(*),organizations(*)`)
    ]);

    const surveyJobs = await surveyJobRes.json();
    const auditJobs = await auditJobRes.json();

    const surveyJob = surveyJobs.length > 0 ? surveyJobs[0] : null;
    const auditJob = auditJobs.length > 0 ? auditJobs[0] : null;

    return { job, surveyJob, auditJob };
}

export default function JobLayout() {
    const { job, surveyJob, auditJob } = useLoaderData<typeof loader>();
    const { id, itemId } = useParams();

    const manual = [
        {
            id: "planning",
            title: "1. Planning",
            items: [
                { id: "register-scope", label: "1.1 Register survey scope" },
                { id: "assign-surveyor", label: "1.2 Assign surveyor" },
                { id: "print-pre-survey", label: "1.3 Print pre-survey" },
            ]
        },
        {
            id: "reporting",
            title: "2. Reporting",
            items: [
                { id: "checklist", label: "2.1 Checklist" },
                { id: "memo-finding", label: "2.2 Memo and finding" },
                { id: "issue-statement", label: "2.3 Issue statement" },
                { id: "attach-documents-reporting", label: "2.4 Attach documents" },
            ]
        },
        {
            id: "verification",
            title: "3. Verification",
            items: [
                { id: "review-job-data", label: "3.1 Review job data" },
                { id: "review-status", label: "3.2 Review Status" },
                { id: "review-finding", label: "3.3 Review Finding" },
                { id: "review-reports", label: "3.4 Review reports" },
                { id: "verify", label: "3.5 Verify" },
            ]
        },
        {
            id: "conclusion",
            title: "4. Conclusion",
            items: [
                { id: "verification-result", label: "4.1 Verification result" },
                { id: "archive", label: "4.2 Archive" },
                { id: "set-job-complete", label: "4.3 Set job complete" },
                { id: "attach-documents-conclusion", label: "4.4 Attach documents" },
            ]
        }
    ];

    const currentTitle = manual.flatMap(m => m.items).find(i => i.id === itemId)?.label || "Overview";

    return (
        <div className="flex bg-slate-50 h-screen overflow-hidden">
            {/* Sub Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-[1]">
                <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-1">
                        <PanelLeft size={14} className="text-primary" />
                        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">IClass Job</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-700">#{job.id}</span>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            job.job_status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        )}>
                            {job.job_status}
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
                    <Accordion type="multiple" defaultValue={["planning", "reporting", "verification", "conclusion"]}>
                        {manual.map((section) => (
                            <AccordionItem key={section.id} value={section.id} className="border-none shadow-none mb-0.5">
                                <AccordionTrigger className="py-1.5 px-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded transition-all">
                                    {section.title}
                                </AccordionTrigger>
                                <AccordionContent className="p-0">
                                    <div className="flex flex-col gap-px mt-0.5 px-1 pb-1">
                                        {section.items.map((item) => (
                                            <NavLink
                                                key={item.id}
                                                to={`/jobs/${id}/${item.id}`}
                                                className={({ isActive }) => cn(
                                                    "w-full text-left px-3 py-1 text-[11px] rounded transition-all flex items-center gap-2 group",
                                                    isActive
                                                        ? "bg-primary text-white font-medium shadow-sm"
                                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                )}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <ChevronRight size={10} className={cn(
                                                            "shrink-0 transition-transform",
                                                            isActive ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-40"
                                                        )} />
                                                        <span className="truncate">{item.label}</span>
                                                    </>
                                                )}
                                            </NavLink>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </aside>

            {/* Main Workspace */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="mx-auto h-full">
                        <Outlet />
                    </div>
                </div>
            </main>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
