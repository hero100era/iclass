import { ClipboardCheck, CheckCircle2, XCircle, MinusCircle, Info, Save, ChevronRight, ListChecks } from "lucide-react";
import { useLoaderData, Form, useActionData, useNavigation, useSubmit } from "react-router";
import { getChecklistData, updateChecklistResult, updateChecklistParticulars, updateShipComponentProperties } from "./checklist.server";
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

    if (intent === "update_component_properties") {
        const id = formData.get("id");
        const propertiesJson = formData.get("properties");
        return await updateShipComponentProperties(args, { id, propertiesJson });
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

    const [activeLineId, setActiveLineId] = useState<number | null>(allLines.length > 0 ? allLines[0].id : null);
    const [activeType, setActiveType] = useState<"survey" | "audit">(allLines.length > 0 ? allLines[0].type : "survey");

    const checklists = activeType === "survey" ? surveyChecklists : auditChecklists;
    const currentChecklist = (Array.isArray(checklists) ? checklists : []).filter(
        (c: any) => (activeType === "survey" ? c.survey_line_id : c.audit_line_id) === activeLineId
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
        // Group by item_id to handle multiple components per checklist item
        const groupedItems: Record<number, any[]> = {};
        s.items.forEach(item => {
            const itemId = item.item_id;
            if (!groupedItems[itemId]) {
                groupedItems[itemId] = [];
            }
            groupedItems[itemId].push(item);
        });

        // Convert grouped items to a list where each entry is a list of instances
        const finalItems = Object.values(groupedItems).sort((a: any, b: any) =>
            (a[0].checklist_items?.item_number || 0) - (b[0].checklist_items?.item_number || 0)
        );

        s.items = finalItems;
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
                            key={`${line.type}-${line.id}`}
                            onClick={() => {
                                setActiveLineId(line.id);
                                setActiveType(line.type);
                            }}
                            className={cn(
                                "w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 shadow-sm",
                                activeLineId === line.id && activeType === line.type
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
                            <span className="text-xs font-bold text-slate-700 line-clamp-2">
                                {line.survey_audits?.description || line.survey_pool?.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                                {line.survey_audits?.cert_code || line.survey_pool?.code}
                            </span>
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
                                        {sect.items.map((instances: any[]) => {
                                            const item = instances[0];
                                            const isMultiple = instances.length > 1;
                                            const hasComponent = item.checklist_items?.component_library_id;

                                            return (
                                                <div key={item.id} className="py-2 px-3 hover:bg-slate-50/30 transition-colors flex flex-col gap-2">
                                                    <div className="flex items-start gap-4">
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
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="w-20 shrink-0">
                                                            {/* Result selector - if multiple, we use the first one's result or handle per instance? 
                                                                Actually, if there are multiple instances, they usually have individual results. 
                                                                But for this UI, we show one selector if they are synchronized or if it's the item result. */}
                                                            <select
                                                                value={item.result || ""}
                                                                onChange={(e) => {
                                                                    // Update result for all instances? Or just the first one?
                                                                    // Usually, if it's grouped, we might want to update all if they share the same check.
                                                                    instances.forEach(inst => handleResultChange(inst.id, e.target.value));
                                                                }}
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

                                                    {/* Particulars / Component Table */}
                                                    {(hasComponent || (item.particulars && item.particulars.length > 0)) && (
                                                        <div className="ml-6 pt-1">
                                                            {hasComponent ? (
                                                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                                                    <table className="w-full text-left text-[10px]">
                                                                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-400 uppercase tracking-tight">
                                                                            <tr>
                                                                                <th className="px-3 py-1.5">Component</th>
                                                                                <th className="px-3 py-1.5">Position</th>
                                                                                <th className="px-3 py-1.5">Properties & Results</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {instances.map((inst) => (
                                                                                <tr key={inst.id} className="align-top">
                                                                                    <td className="px-3 py-2 font-bold text-slate-700">{inst.ship_component_tree?.custom_name || inst.checklist_items?.component_library?.name}</td>
                                                                                    <td className="px-3 py-2 text-slate-500 italic">{inst.ship_component_tree?.position_description || "-"}</td>
                                                                                    <td className="px-3 py-2">
                                                                                        <div className="flex flex-col gap-2">
                                                                                            {(inst.ship_component_tree?.properties || []).map((prop: any, pIdx: number) => (
                                                                                                <div key={pIdx} className="flex items-center gap-2">
                                                                                                    <span className="shrink-0 w-24 font-medium text-slate-600 truncate" title={prop.title}>{prop.title}:</span>
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        defaultValue={prop.result || ""}
                                                                                                        onBlur={(e) => {
                                                                                                            if (e.target.value === prop.result) return;
                                                                                                            const updatedProps = [...inst.ship_component_tree.properties];
                                                                                                            updatedProps[pIdx] = { ...prop, result: e.target.value };
                                                                                                            const formData = new FormData();
                                                                                                            formData.append("intent", "update_component_properties");
                                                                                                            formData.append("id", inst.ship_component_tree.id.toString());
                                                                                                            formData.append("properties", JSON.stringify(updatedProps));
                                                                                                            submit(formData, { method: "post" });
                                                                                                        }}
                                                                                                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary/20"
                                                                                                        placeholder="Enter result..."
                                                                                                    />
                                                                                                </div>
                                                                                            ))}
                                                                                            {(inst.ship_component_tree?.properties || []).length === 0 && <span className="text-slate-300 italic">No properties</span>}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <div className="pt-2 space-y-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100 max-w-2xl">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Info size={12} className="text-primary/60" />
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Required Particulars</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 gap-3">
                                                                        {item.particulars.map((p: any, idx: number) => (
                                                                            <div key={p.key || idx} className="flex flex-col gap-1">
                                                                                <label className="text-[10px] font-medium text-slate-600 ml-0.5">{p.title}</label>
                                                                                {p.type === "boolean" ? (
                                                                                    <div className="flex gap-4 items-center h-8">
                                                                                        {["Yes", "No"].map((opt) => (
                                                                                            <label key={opt} className="flex items-center gap-1.5 cursor-pointer group">
                                                                                                <input
                                                                                                    type="radio"
                                                                                                    name={`particular-${item.id}-${idx}`}
                                                                                                    value={opt}
                                                                                                    checked={p.result === opt}
                                                                                                    onChange={(e) => {
                                                                                                        const updated = [...item.particulars];
                                                                                                        updated[idx] = { ...p, result: e.target.value };
                                                                                                        const formData = new FormData();
                                                                                                        formData.append("intent", "update_particulars");
                                                                                                        formData.append("id", item.id.toString());
                                                                                                        formData.append("particulars", JSON.stringify(updated));
                                                                                                        formData.append("type", activeType);
                                                                                                        submit(formData, { method: "post" });
                                                                                                    }}
                                                                                                    className="w-3 h-3 text-primary border-slate-300 focus:ring-primary/20"
                                                                                                />
                                                                                                <span className="text-xs text-slate-700 group-hover:text-primary transition-colors">{opt}</span>
                                                                                            </label>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <input
                                                                                        type={p.type === "number" ? "number" : p.type === "date" ? "date" : "text"}
                                                                                        defaultValue={p.result || ""}
                                                                                        placeholder={`Enter ${p.title.toLowerCase()}...`}
                                                                                        onBlur={(e) => {
                                                                                            if (e.target.value === p.result) return;
                                                                                            const updated = [...item.particulars];
                                                                                            updated[idx] = { ...p, result: e.target.value };
                                                                                            const formData = new FormData();
                                                                                            formData.append("intent", "update_particulars");
                                                                                            formData.append("id", item.id.toString());
                                                                                            formData.append("particulars", JSON.stringify(updated));
                                                                                            formData.append("type", activeType);
                                                                                            submit(formData, { method: "post" });
                                                                                        }}
                                                                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
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
