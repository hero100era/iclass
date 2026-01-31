import { ClipboardCheck, CheckCircle2, XCircle, MinusCircle, Info, Save, ChevronRight, ListChecks } from "lucide-react";
import { useLoaderData, Form, useActionData, useNavigation, useSubmit } from "react-router";
import { getChecklistData, updateChecklistResult, updateChecklistParticulars } from "./checklist.server";
import { cn } from "~/lib/utils";
import { useState } from "react";

export async function loader(args: any) {
    return await getChecklistData(args);
}

export async function action(args: any) {
    const formData = await args.request.formData();
    const intent = formData.get("intent");

    if (intent === "update_result") {
        const id = formData.get("id");
        const result = formData.get("result");
        const type = formData.get("type");
        return await updateChecklistResult(args, { id, result, type });
    }

    if (intent === "update_particulars") {
        const id = formData.get("id");
        const particularsJson = formData.get("particulars");
        const type = formData.get("type");
        return await updateChecklistParticulars(args, { id, particularsJson, type });
    }

    return { error: "Unknown action" };
}

export default function JobChecklist() {
    const { surveyLines, auditLines, surveyChecklists, auditChecklists, checklistResults } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const navigation = useNavigation();

    // Combine lines
    const allLines = [
        ...(Array.isArray(surveyLines) ? surveyLines.map((l: any) => ({ ...l, type: "survey" })) : []),
        ...(Array.isArray(auditLines) ? auditLines.map((l: any) => ({ ...l, type: "audit" })) : [])
    ];

    const [activeLineId, setActiveLineId] = useState<number | null>(allLines.length > 0 ? allLines[0].survey_audit_id : null);
    const [activeType, setActiveType] = useState<"survey" | "audit">(allLines.length > 0 ? allLines[0].type : "survey");

    const checklists = activeType === "survey" ? surveyChecklists : auditChecklists;
    const currentChecklist = (Array.isArray(checklists) ? checklists : []).filter(
        (c: any) => c.survey_audit_id === activeLineId
    );

    // Group by sections
    const sections: Record<string, { section: any, items: any[] }> = {};
    currentChecklist.forEach((c: any) => {
        const sectionId = c.checklist_items?.section_id;
        if (!sectionId) return;
        if (!sections[sectionId]) {
            sections[sectionId] = {
                section: c.checklist_items.checklist_sections,
                items: []
            };
        }
        sections[sectionId].items.push(c);
    });

    // Sort sections by section_number
    const sortedSections = Object.values(sections).sort((a, b) =>
        (a.section?.section_number || "").localeCompare(b.section?.section_number || "", undefined, { numeric: true })
    );

    // Sort items within sections
    sortedSections.forEach(s => {
        s.items.sort((a, b) => (a.checklist_items?.item_number || 0) - (b.checklist_items?.item_number || 0));
    });

    const handleResultChange = (checklistId: number, result: string) => {
        const formData = new FormData();
        formData.append("intent", "update_result");
        formData.append("id", checklistId.toString());
        formData.append("result", result);
        formData.append("type", activeType);
        submit(formData, { method: "post" });
    };

    return (
        <div className="flex flex-col h-full space-y-4 mx-auto">
            {/* Header / Survey Selector */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ListChecks size={20} className="text-primary" />
                        Checklist Reporting
                    </h2>
                    <p className="text-sm text-slate-500">Record verification results for each checklist item.</p>
                </div>
            </div>

            <div className="flex gap-4 items-start">
                {/* Fixed survey list */}
                <aside className="w-64 shrink-0 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">Surveys in Scope</div>
                    {allLines.map((line: any) => (
                        <button
                            key={`${line.type}-${line.survey_audit_id}`}
                            onClick={() => {
                                setActiveLineId(line.survey_audit_id);
                                setActiveType(line.type);
                            }}
                            className={cn(
                                "w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 shadow-sm",
                                activeLineId === line.survey_audit_id && activeType === line.type
                                    ? "bg-white border-primary border-2 ring-1 ring-primary/20"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                            )}
                        >
                            <span className={cn(
                                "text-[9px] font-bold uppercase w-fit px-1.5 py-0.5 rounded",
                                line.type === "survey" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                            )}>
                                {line.type}
                            </span>
                            <span className="text-xs font-bold text-slate-700 line-clamp-2">{line.survey_audits?.description}</span>
                            <span className="text-[10px] font-mono text-slate-400">{line.survey_audits?.cert_code}</span>
                        </button>
                    ))}
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-3 pb-20">
                    {activeLineId ? (
                        sortedSections.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                                <ClipboardCheck size={40} className="mx-auto text-slate-200 mb-4" />
                                <h3 className="text-slate-500 font-medium">No checklist items found for this survey.</h3>
                                <p className="text-xs text-slate-400 mt-1">Please ensure checklist sections and items are configured for this cert code and type.</p>
                            </div>
                        ) : (
                            sortedSections.map((sect) => (
                                <div key={sect.section?.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-slate-400">{sect.section?.section_number}</span>
                                        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{sect.section?.title}</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {sect.items.map((item: any) => (
                                            <div key={item.id} className="py-2 px-3 hover:bg-slate-50/30 transition-colors flex items-start gap-4">
                                                <div className="flex-1 min-w-0 space-y-1.5 cursor-default">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-[10px] font-mono font-bold text-slate-400 py-0.5 shrink-0">{item.checklist_items?.item_number}.</span>
                                                        <div className="flex-1 space-y-1.5">
                                                            <p className="text-xs text-slate-800 leading-normal">{item.checklist_items?.content}</p>

                                                            {item.checklist_items?.reg_reference && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Info size={11} className="text-slate-300" />
                                                                    <span className="text-[9px] text-slate-400 font-medium italic">Ref: {item.checklist_items.reg_reference}</span>
                                                                </div>
                                                            )}

                                                            {/* Particulars Field - Shown under description if needed */}
                                                            {item.checklist_items?.particulars && Object.keys(item.checklist_items.particulars).length > 0 && (
                                                                <div className="pt-1">
                                                                    <textarea
                                                                        placeholder="Add particulars or remarks..."
                                                                        className="w-full max-w-2xl bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 h-10 resize-y"
                                                                        defaultValue={item.particulars ? JSON.stringify(item.particulars, null, 2) : ""}
                                                                        onBlur={(e) => {
                                                                            const formData = new FormData();
                                                                            formData.append("intent", "update_particulars");
                                                                            formData.append("id", item.id.toString());
                                                                            formData.append("particulars", e.target.value || "{}");
                                                                            formData.append("type", activeType);
                                                                            submit(formData, { method: "post" });
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-20 shrink-0">
                                                    <select
                                                        value={item.result || ""}
                                                        onChange={(e) => handleResultChange(item.id, e.target.value)}
                                                        className="w-full bg-slate-100 border border-slate-200 rounded-md py-0.5 px-2 text-[10px] font-bold outline-none focus:ring-1 focus:ring-primary/20 appearance-none text-center hover:bg-slate-200 transition-colors cursor-pointer"
                                                    >
                                                        {(checklistResults || []).map((res: any) => (
                                                            <option key={res.code} value={res.code}>
                                                                {res.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                            <ListChecks size={40} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-slate-500 font-medium">Select a survey from the side to begin reporting.</h3>
                        </div>
                    )}

                    {activeLineId && sortedSections.length > 0 && (
                        <footer className="mt-4 border-t border-slate-200 p-3 pb-6 bg-slate-50/50 rounded-xl shadow-inner border-dashed">
                            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Info size={12} />
                                Checklist Result Codes Legend
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1">
                                {(checklistResults || []).map((res: any) => (
                                    <div key={res.code} className="flex gap-2 items-start border-b border-slate-100 pb-1 last:border-0 md:[&:nth-last-child(-n+2)]:border-0 lg:[&:nth-last-child(-n+4)]:border-0">
                                        <div className="flex-shrink-0 w-7 h-4.5 flex items-center justify-center bg-slate-200 rounded text-[9px] font-bold text-slate-600 shadow-sm border border-slate-300">
                                            {res.code}
                                        </div>
                                        <span className="text-[9px] text-slate-500 leading-tight font-medium py-0.5">{res.description}</span>
                                    </div>
                                ))}
                            </div>
                        </footer>
                    )}
                </div>
            </div>
        </div >
    );
}
