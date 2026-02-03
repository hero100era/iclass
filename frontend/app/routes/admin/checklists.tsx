import { useLoaderData, useSubmit, useNavigation, useRevalidator, useActionData } from "react-router";
import { ApiGET, ApiPOST, ApiPATCH } from "~/.server/lib/api";
import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronRight, ListChecks, Settings2 } from "lucide-react";
import { cn } from "~/lib/utils";

export const handle = { fluid: true };

export async function loader({ request }: any) {
    const host = process.env.API_URL || "http://localhost:2000";
    const [surveysRes, resultsRes] = await Promise.all([
        ApiGET(request, `${host}/survey_pool?select=*,checklist_sections(*,checklist_items(*))`),
        ApiGET(request, `${host}/checklist_results`)
    ]);

    return {
        surveys: await surveysRes.json(),
        results: await resultsRes.json()
    };
}

export async function action({ request }: any) {
    const host = process.env.API_URL || "http://localhost:2000";
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "update_item_particulars") {
        const id = formData.get("id");
        const particulars = JSON.parse(formData.get("particulars") as string);
        const res = await ApiPATCH(request, `${host}/checklist_items?id=eq.${id}`, { particulars });
        return { success: res.ok };
    }

    if (intent === "add_item") {
        const section_id = formData.get("section_id");
        const item_number = formData.get("item_number");
        const content = formData.get("content");
        const res = await ApiPOST(request, `${host}/checklist_items`, { section_id, item_number, content, particulars: [] });
        return { success: res.ok };
    }

    if (intent === "add_section") {
        const survey_id = formData.get("survey_id");
        const section_number = formData.get("section_number");
        const title = formData.get("title");
        const code = formData.get("survey_code");
        const res = await ApiPOST(request, `${host}/checklist_sections`, { survey_id, section_number, title, code });
        return { success: res.ok };
    }

    return { error: "Unknown action" };
}

export default function AdminChecklists() {
    const { surveys, results } = useLoaderData<typeof loader>();
    const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
    const [addingToSection, setAddingToSection] = useState<number | null>(null);
    const [newItemContent, setNewItemContent] = useState("");
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [newSectionNumber, setNewSectionNumber] = useState("");

    const submit = useSubmit();
    const navigation = useNavigation();
    const revalidator = useRevalidator();
    const actionData = useActionData<typeof action>();

    // Revalidate when action completes successfully
    useEffect(() => {
        if (actionData?.success && navigation.state === "idle") {
            revalidator.revalidate();
        }
    }, [actionData, navigation.state]);

    // Sync local state with loader data when it updates (e.g. after revalidation)
    useEffect(() => {
        if (selectedSurvey?.id) {
            const fresh = surveys.find((s: any) => s.id === selectedSurvey.id);
            if (fresh) {
                setSelectedSurvey(fresh);
            }
        }
    }, [surveys]);

    const handleLocalParticularsUpdate = (itemId: number, newParticulars: any[]) => {
        if (!selectedSurvey) return;

        const updatedSurvey = {
            ...selectedSurvey,
            checklist_sections: selectedSurvey.checklist_sections.map((section: any) => ({
                ...section,
                checklist_items: section.checklist_items.map((item: any) => {
                    if (item.id === itemId) {
                        return { ...item, particulars: newParticulars };
                    }
                    return item;
                })
            }))
        };
        setSelectedSurvey(updatedSurvey);
    };

    const handleSaveParticulars = (itemId: number, particulars: any) => {
        const formData = new FormData();
        formData.append("intent", "update_item_particulars");
        formData.append("id", itemId.toString());
        formData.append("particulars", JSON.stringify(particulars));
        submit(formData, { method: "post" });
    };

    const handleAddItem = (sectionId: number, itemNumber: number) => {
        if (!newItemContent.trim()) return;

        const formData = new FormData();
        formData.append("intent", "add_item");
        formData.append("section_id", sectionId.toString());
        formData.append("item_number", itemNumber.toString());
        formData.append("content", newItemContent);
        submit(formData, { method: "post" });
        setAddingToSection(null);
        setNewItemContent("");
    };

    const handleAddSection = () => {
        if (!newSectionTitle.trim() || !newSectionNumber.trim() || !selectedSurvey) return;

        const formData = new FormData();
        formData.append("intent", "add_section");
        formData.append("survey_id", selectedSurvey.id.toString());
        formData.append("survey_code", selectedSurvey.code);
        formData.append("section_number", newSectionNumber);
        formData.append("title", newSectionTitle);
        submit(formData, { method: "post" });
        setIsAddingSection(false);
        setNewSectionTitle("");
        setNewSectionNumber("");
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Settings2 size={18} className="text-primary" />
                        Checklist Template Management
                    </h1>
                    <p className="text-xs text-slate-500">Configure checklist sections, items and dynamic particulars templates.</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
                {/* Survey Selection */}
                <div className="col-span-3 space-y-1">
                    <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Survey Types</h3>
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {surveys.map((survey: any) => (
                                <button
                                    key={survey.id}
                                    onClick={() => setSelectedSurvey(survey)}
                                    className={cn(
                                        "w-full text-left px-2 py-1.5 text-[11px] font-medium transition-colors flex items-center justify-between group",
                                        selectedSurvey?.id === survey.id ? "bg-primary/5 text-primary" : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    <span>{survey.name} ({survey.code})</span>
                                    <ChevronRight size={12} className={cn("transition-transform", selectedSurvey?.id === survey.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100")} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Checklist Editor */}
                <div className="col-span-9">
                    {selectedSurvey ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                                    {selectedSurvey.name} Template
                                </h2>
                                <button
                                    onClick={() => setIsAddingSection(!isAddingSection)}
                                    className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600 font-bold rounded border border-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={12} /> Add Section
                                </button>
                            </div>

                            {isAddingSection && (
                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-3">
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-3">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Number</label>
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="e.g. 1.0"
                                                value={newSectionNumber}
                                                onChange={(e) => setNewSectionNumber(e.target.value)}
                                                className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-9">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Navigation Equipment"
                                                value={newSectionTitle}
                                                onChange={(e) => setNewSectionTitle(e.target.value)}
                                                className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setIsAddingSection(false)}
                                            className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={!newSectionTitle.trim() || !newSectionNumber.trim()}
                                            onClick={handleAddSection}
                                            className="px-2 py-1 text-[10px] font-bold bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            Create Section
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedSurvey.checklist_sections && selectedSurvey.checklist_sections.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedSurvey.checklist_sections
                                        .sort((a: any, b: any) => (a.section_number || "").localeCompare(b.section_number || "", undefined, { numeric: true }))
                                        .map((section: any) => (
                                            <div key={section.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                                <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-mono font-bold text-slate-400">{section.section_number}</span>
                                                        <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{section.title}</h3>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setAddingToSection(addingToSection === section.id ? null : section.id);
                                                            setNewItemContent("");
                                                        }}
                                                        className="p-0.5 text-slate-400 hover:text-primary transition-colors"
                                                    >
                                                        <Plus size={14} className={cn("transition-transform", addingToSection === section.id && "rotate-45")} />
                                                    </button>
                                                </div>

                                                {addingToSection === section.id && (
                                                    <div className="p-3 bg-primary/5 border-b border-slate-100 flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1">
                                                                <textarea
                                                                    autoFocus
                                                                    placeholder="Enter item content..."
                                                                    value={newItemContent}
                                                                    onChange={(e) => setNewItemContent(e.target.value)}
                                                                    className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none min-h-[60px]"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setAddingToSection(null)}
                                                                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                disabled={!newItemContent.trim()}
                                                                onClick={() => {
                                                                    const nextNum = section.checklist_items.length > 0
                                                                        ? Math.max(...section.checklist_items.map((i: any) => i.item_number)) + 1
                                                                        : 1;
                                                                    handleAddItem(section.id, nextNum);
                                                                }}
                                                                className="px-2 py-1 text-[10px] font-bold bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                                                            >
                                                                Add Item
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="divide-y divide-slate-100">
                                                    {section.checklist_items.sort((a: any, b: any) => a.item_number - b.item_number).map((item: any) => (
                                                        <div key={item.id} className="px-2 py-2 space-y-2">
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-[9px] font-mono font-bold text-slate-300 mt-0.5">{item.item_number}.</span>
                                                                <div className="flex-1">
                                                                    <p className="text-[11px] font-medium text-slate-800 leading-tight">{item.content}</p>
                                                                </div>
                                                            </div>

                                                            {/* Particulars Template Editor */}
                                                            <div className="ml-4 space-y-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Particulars</h4>
                                                                    <button
                                                                        className="text-[9px] text-primary font-bold flex items-center gap-0.5 hover:underline"
                                                                        onClick={() => {
                                                                            const currentParticulars = Array.isArray(item.particulars) ? item.particulars : [];
                                                                            const newParticulars = [...currentParticulars, { key: "", title: "", type: "text", result: "" }];
                                                                            handleSaveParticulars(item.id, newParticulars);
                                                                        }}
                                                                    >
                                                                        <Plus size={10} /> Add
                                                                    </button>
                                                                </div>

                                                                {item.particulars && item.particulars.length > 0 ? (
                                                                    <div className="grid grid-cols-12 gap-1.5">
                                                                        <div className="col-span-3 text-[8px] font-bold text-slate-400 px-1">Key</div>
                                                                        <div className="col-span-4 text-[8px] font-bold text-slate-400 px-1">Title</div>
                                                                        <div className="col-span-3 text-[8px] font-bold text-slate-400 px-1">Type</div>
                                                                        <div className="col-span-2"></div>

                                                                        {item.particulars.map((p: any, idx: number) => (
                                                                            <div key={idx} className="col-span-12 grid grid-cols-12 gap-1.5 items-center group">
                                                                                <div className="col-span-3">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={p.key}
                                                                                        onChange={(e) => {
                                                                                            const currentParticulars = Array.isArray(item.particulars) ? item.particulars : [];
                                                                                            const updated = [...currentParticulars];
                                                                                            updated[idx] = { ...p, key: e.target.value };
                                                                                            handleLocalParticularsUpdate(item.id, updated);
                                                                                        }}
                                                                                        onBlur={(e) => {
                                                                                            if (e.target.value === p.key) return;
                                                                                            const currentParticulars = Array.isArray(item.particulars) ? item.particulars : [];
                                                                                            const updated = [...currentParticulars];
                                                                                            updated[idx] = { ...p, key: e.target.value };
                                                                                            handleSaveParticulars(item.id, updated);
                                                                                        }}
                                                                                        className="w-full text-[10px] px-1.5 py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                                        placeholder="e.g. pressure_gauge"
                                                                                    />
                                                                                </div>
                                                                                <div className="col-span-4">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={p.title}
                                                                                        onChange={(e) => {
                                                                                            const currentParticulars = Array.isArray(item.particulars) ? item.particulars : [];
                                                                                            const updated = [...currentParticulars];
                                                                                            updated[idx] = { ...p, title: e.target.value };
                                                                                            handleLocalParticularsUpdate(item.id, updated);
                                                                                        }}
                                                                                        onBlur={(e) => {
                                                                                            if (e.target.value === p.title) return;
                                                                                            const currentParticulars = Array.isArray(item.particulars) ? item.particulars : [];
                                                                                            const updated = [...currentParticulars];
                                                                                            updated[idx] = { ...p, title: e.target.value };
                                                                                            handleSaveParticulars(item.id, updated);
                                                                                        }}
                                                                                        className="w-full text-[10px] px-1.5 py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                                        placeholder="e.g. Pressure Gauge Serial"
                                                                                    />
                                                                                </div>
                                                                                <div className="col-span-3">
                                                                                    <select
                                                                                        value={p.type}
                                                                                        onChange={(e) => {
                                                                                            const currentParticulars = Array.isArray(item.particulars) ? item.particulars : [];
                                                                                            const updated = [...currentParticulars];
                                                                                            updated[idx] = { ...p, type: e.target.value };
                                                                                            handleSaveParticulars(item.id, updated);
                                                                                        }}
                                                                                        className="w-full text-[10px] px-1.5 py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                                    >
                                                                                        <option value="text">Text</option>
                                                                                        <option value="number">Number</option>
                                                                                        <option value="date">Date</option>
                                                                                        <option value="boolean">Yes/No</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div className="col-span-2 flex justify-end">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const currentParticulars = Array.isArray(item.particulars) ? item.particulars : [];
                                                                                            const updated = currentParticulars.filter((_: any, i: number) => i !== idx);
                                                                                            handleSaveParticulars(item.id, updated);
                                                                                        }}
                                                                                        className="p-0.5 text-slate-300 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                                                    >
                                                                                        <Trash2 size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-slate-50 border border-slate-100 border-dashed rounded p-2 text-center">
                                                                        <p className="text-[9px] text-slate-400 italic">No particulars defined</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-200 rounded-lg p-12 text-center flex flex-col items-center justify-center">
                                    <ListChecks size={48} className="text-slate-200 mb-4" />
                                    <h3 className="text-slate-600 font-bold">No sections found</h3>
                                    <p className="text-xs text-slate-400 mb-4">Start by adding the first section to this checklist template.</p>
                                    <button
                                        onClick={() => setIsAddingSection(true)}
                                        className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-primary/90 flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Add First Section
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                            <ListChecks size={40} className="mx-auto text-slate-200 mb-3" />
                            <h3 className="text-sm text-slate-500 font-medium">Select a survey type from the left to manage its checklist.</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
