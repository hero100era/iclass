import { useLoaderData, useSubmit, useNavigation, useRevalidator, useActionData } from "react-router";
import { ApiGET, ApiPOST, ApiPATCH, ApiDELETE } from "~/.server/lib/api";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, ChevronRight, ListChecks, Settings2 } from "lucide-react";
import { cn } from "~/lib/utils";

export const handle = { fluid: true };

interface LoaderArgs {
    request: Request;
}

interface ActionArgs {
    request: Request;
}

interface ChecklistItemParticular {
    id?: number;
    temp_id?: string;
    attr_key: string;
    attr_title: string;
    data_type: string;
    unit?: string | null;
    default_value?: string | null;
    selection_options?: string[] | null;
    is_required?: boolean;
    sort_order?: number;
}

interface ChecklistItem {
    id: number;
    section_id: number;
    item_number: number;
    content: string;
    breakdown_template_node_id?: number | null;
    checklist_item_particulars?: ChecklistItemParticular[];
}

interface ChecklistSection {
    id: number;
    survey_id: number;
    section_number: string;
    title: string;
    checklist_items?: ChecklistItem[];
}

interface Survey {
    id: number;
    code: string;
    name: string;
    vessel_type?: string;
    checklist_sections?: ChecklistSection[];
}

interface BreakdownNode {
    id: number;
    code: string;
    name: string;
}

export async function loader({ request }: LoaderArgs) {
    const host = process.env.API_URL || "http://localhost:2000";
    const [surveysRes, resultsRes, breakdownNodesRes] = await Promise.all([
        ApiGET(request, `${host}/survey_pool?select=*,checklist_sections(*,checklist_items(*,checklist_item_particulars(*)))`),
        ApiGET(request, `${host}/checklist_results`),
        ApiGET(request, `${host}/breakdown_template_nodes?select=id,code,name&order=name.asc`)
    ]);

    return {
        surveys: await surveysRes.json(),
        results: await resultsRes.json(),
        breakdownNodes: await breakdownNodesRes.json()
    };
}

export async function action({ request }: ActionArgs) {
    const host = process.env.API_URL || "http://localhost:2000";
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "update_item_particulars") {
        const id = formData.get("id");
        const particulars = JSON.parse(formData.get("particulars") as string);

        // 1. Delete existing
        await ApiDELETE(request, `${host}/checklist_item_particulars?checklist_item_id=eq.${id}`);

        // 2. Insert new
        if (particulars.length > 0) {
            const toInsert = particulars.map((p: Record<string, unknown>) => ({
                checklist_item_id: id,
                attr_key: p.attr_key || p.key,
                attr_title: p.attr_title || p.title,
                data_type: p.data_type || p.type,
                unit: p.unit || null,
                default_value: p.default_value || null,
                selection_options: p.selection_options || null,
                is_required: p.is_required ?? true,
                sort_order: p.sort_order ?? 0
            }));
            const res = await ApiPOST(request, `${host}/checklist_item_particulars`, toInsert);
            return { success: res.ok };
        }
        return { success: true };
    }

    if (intent === "update_item") {
        const id = formData.get("id");
        const content = formData.get("content");
        const breakdown_node_id = formData.get("breakdown_node_id") || null;
        const res = await ApiPATCH(request, `${host}/checklist_items?id=eq.${id}`, {
            content,
            breakdown_template_node_id: breakdown_node_id === "null" ? null : breakdown_node_id
        });
        return { success: res.ok };
    }

    if (intent === "delete_item") {
        const id = formData.get("id");
        const res = await ApiDELETE(request, `${host}/checklist_items?id=eq.${id}`);
        return { success: res.ok };
    }

    if (intent === "add_item") {
        const section_id = formData.get("section_id");
        const item_number = formData.get("item_number");
        const content = formData.get("content");
        const res = await ApiPOST(request, `${host}/checklist_items`, { section_id, item_number, content });
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
    const { surveys, breakdownNodes } = useLoaderData<typeof loader>();
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const prevSelectedSurveyIdRef = useRef<number | undefined>(undefined);
    const [addingToSection, setAddingToSection] = useState<number | null>(null);
    const [newItemContent, setNewItemContent] = useState("");
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [newSectionNumber, setNewSectionNumber] = useState("");

    // Edit item state
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editFormContent, setEditFormContent] = useState("");
    const [editBreakdownNodeId, setEditBreakdownNodeId] = useState<string>("");

    const submit = useSubmit();
    const navigation = useNavigation();
    const revalidator = useRevalidator();
    const actionData = useActionData<typeof action>();

    // Revalidate when action completes successfully
    useEffect(() => {
        if (actionData?.success && navigation.state === "idle") {
            revalidator.revalidate();
        }
    }, [actionData, navigation.state, revalidator]);

    useEffect(() => {
        if (selectedSurvey?.id && selectedSurvey.id !== prevSelectedSurveyIdRef.current) {
            const fresh = surveys.find((s) => s.id === selectedSurvey.id);
            if (fresh) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedSurvey((prev) => {
                    if (!prev || prev.id !== fresh.id) return fresh;

                    // Preserve items that have temporary IDs (drafts)
                    return {
                        ...fresh,
                        checklist_sections: fresh.checklist_sections?.map((freshSection) => {
                            const prevSection = prev.checklist_sections?.find((s) => s.id === freshSection.id);
                            if (!prevSection) return freshSection;

                            return {
                                ...freshSection,
                                checklist_items: freshSection.checklist_items?.map((freshItem) => {
                                    const prevItem = prevSection.checklist_items?.find((i) => i.id === freshItem.id);
                                    if (!prevItem) return freshItem;

                                    const hasTemp = prevItem.checklist_item_particulars?.some((p) => p.temp_id);
                                    if (hasTemp) {
                                        return { ...freshItem, checklist_item_particulars: prevItem.checklist_item_particulars };
                                    }
                                    return freshItem;
                                })
                            };
                        })
                    };
                });
                prevSelectedSurveyIdRef.current = selectedSurvey.id;
            }
        }
    }, [surveys, selectedSurvey]);

    const handleLocalParticularsUpdate = (itemId: number, newParticulars: ChecklistItemParticular[]) => {
        if (!selectedSurvey) return;

        const updatedSurvey = {
            ...selectedSurvey,
            checklist_sections: selectedSurvey.checklist_sections?.map((section) => ({
                ...section,
                checklist_items: section.checklist_items?.map((item: ChecklistItem) => {
                    if (item.id === itemId) {
                        return { ...item, checklist_item_particulars: newParticulars };
                    }
                    return item;
                })
            }))
        };
        setSelectedSurvey(updatedSurvey);
    };

    const handleSaveParticulars = (itemId: number, particulars: ChecklistItemParticular[]) => {
        // Validation: only save if all items have attr_key and attr_title
        const validParticulars = particulars.filter((p) => (p.attr_key || (p as Record<string, unknown>).key) && (p.attr_title || (p as Record<string, unknown>).title));
        if (validParticulars.length === 0 && particulars.length > 0) return; // Don't save if we added an empty one

        const formData = new FormData();
        formData.append("intent", "update_item_particulars");
        formData.append("id", itemId.toString());
        formData.append("particulars", JSON.stringify(validParticulars));
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

    const handleUpdateItem = (id: number) => {
        const formData = new FormData();
        formData.append("intent", "update_item");
        formData.append("id", id.toString());
        formData.append("content", editFormContent);
        formData.append("breakdown_node_id", editBreakdownNodeId || "null");
        submit(formData, { method: "post" });
        setEditingItemId(null);
    };

    const handleDeleteItem = (id: number) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        const formData = new FormData();
        formData.append("intent", "delete_item");
        formData.append("id", id.toString());
        submit(formData, { method: "post" });
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
                            {surveys.map((survey: Survey) => (
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
                                        .sort((a: ChecklistSection, b: ChecklistSection) => (a.section_number || "").localeCompare(b.section_number || "", undefined, { numeric: true }))
                                        .map((section: ChecklistSection) => (
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
                                                                        ? Math.max(...section.checklist_items.map((i: ChecklistItem) => i.item_number)) + 1
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
                                                    {section.checklist_items.sort((a: ChecklistItem, b: ChecklistItem) => a.item_number - b.item_number).map((item: ChecklistItem) => (
                                                        <div key={item.id} className="px-2 py-2 space-y-2 group/item">
                                                            {editingItemId === item.id ? (
                                                                <div className="bg-slate-50 p-2 rounded border border-slate-200 space-y-2">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Item Content</label>
                                                                        <textarea
                                                                            value={editFormContent}
                                                                            onChange={(e) => setEditFormContent(e.target.value)}
                                                                            className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none min-h-[60px]"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Component Library Link</label>
                                                                        <select
                                                                            value={editBreakdownNodeId}
                                                                            onChange={(e) => setEditBreakdownNodeId(e.target.value)}
                                                                            className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                        >
                                                                            <option value="">None</option>
                                                                            {breakdownNodes.map((comp: BreakdownNode) => (
                                                                                <option key={comp.id} value={comp.id}>{comp.name} ({comp.code})</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => setEditingItemId(null)}
                                                                            className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleUpdateItem(item.id)}
                                                                            className="px-2 py-1 text-[10px] font-bold bg-primary text-white rounded hover:bg-primary/90"
                                                                        >
                                                                            Save Changes
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-[9px] font-mono font-bold text-slate-300 mt-0.5">{item.item_number}.</span>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div>
                                                                                <p className="text-[11px] font-medium text-slate-800 leading-tight">{item.content}</p>
                                                                                {item.breakdown_template_node_id && (
                                                                                    <div className="mt-1 flex items-center gap-1">
                                                                                        <span className="text-[8px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-bold uppercase tracking-tighter" title={breakdownNodes.find((c: BreakdownNode) => c.id === item.breakdown_template_node_id)?.name || item.breakdown_template_node_id}>
                                                                                            Linked: {breakdownNodes.find((c: BreakdownNode) => c.id === item.breakdown_template_node_id)?.name || item.breakdown_template_node_id}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setEditingItemId(item.id);
                                                                                        setEditFormContent(item.content);
                                                                                        setEditBreakdownNodeId(item.breakdown_template_node_id?.toString() || "");
                                                                                    }}
                                                                                    className="p-1 text-slate-400 hover:text-primary transition-colors"
                                                                                    title="Edit Item"
                                                                                >
                                                                                    <Settings2 size={12} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                                    className="p-1 text-slate-400 hover:text-destructive transition-colors"
                                                                                    title="Delete Item"
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Particulars Template Editor */}
                                                            <div className="ml-4 space-y-1.5 pt-2 border-t border-slate-50">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Particulars Template</h4>
                                                                        <span className="text-[7px] text-slate-300 font-medium italic">(Defines required inputs for surveyors)</span>
                                                                    </div>
                                                                    <button
                                                                        className="text-[9px] text-primary font-bold flex items-center gap-0.5 hover:underline"
                                                                        onClick={() => {
                                                                            const currentParticulars = Array.isArray(item.checklist_item_particulars) ? item.checklist_item_particulars : [];
                                                                            const newParticulars = [...currentParticulars, {
                                                                                temp_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                                                                attr_key: "",
                                                                                attr_title: "",
                                                                                data_type: "text",
                                                                                sort_order: currentParticulars.length,
                                                                                is_required: true
                                                                            }];
                                                                            handleLocalParticularsUpdate(item.id, newParticulars);
                                                                        }}
                                                                    >
                                                                        <Plus size={10} /> Add Field
                                                                    </button>
                                                                </div>

                                                                {item.checklist_item_particulars && item.checklist_item_particulars.length > 0 ? (
                                                                    <div className="space-y-1.5">
                                                                        <div className="grid grid-cols-12 gap-1 px-1">
                                                                            <div className="col-span-2 text-[7px] font-bold text-slate-400 uppercase">Key</div>
                                                                            <div className="col-span-3 text-[7px] font-bold text-slate-400 uppercase">Title / Label</div>
                                                                            <div className="col-span-2 text-[7px] font-bold text-slate-400 uppercase">Type</div>
                                                                            <div className="col-span-1 text-[7px] font-bold text-slate-400 uppercase">Unit</div>
                                                                            <div className="col-span-1 text-[7px] font-bold text-slate-400 uppercase">Order</div>
                                                                            <div className="col-span-2 text-[7px] font-bold text-slate-400 uppercase">Default</div>
                                                                            <div className="col-span-1"></div>
                                                                        </div>

                                                                        {item.checklist_item_particulars.sort((a: ChecklistItemParticular, b: ChecklistItemParticular) => (a.sort_order || 0) - (b.sort_order || 0)).map((p: ChecklistItemParticular, idx: number) => (
                                                                            <div key={p.id || p.temp_id || `idx_${idx}`} className="space-y-1 p-1 rounded hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                                                <div className="grid grid-cols-12 gap-1 items-center group/prow">
                                                                                    <div className="col-span-2">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={p.attr_key || ""}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...item.checklist_item_particulars];
                                                                                                updated[idx] = { ...p, attr_key: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                                                                                                handleLocalParticularsUpdate(item.id, updated);
                                                                                            }}
                                                                                            onBlur={() => handleSaveParticulars(item.id, item.checklist_item_particulars)}
                                                                                            className="w-full text-[9px] px-1 py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none font-mono"
                                                                                            placeholder="key_name"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="col-span-3">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={p.attr_title || ""}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...item.checklist_item_particulars];
                                                                                                updated[idx] = { ...p, attr_title: e.target.value };
                                                                                                handleLocalParticularsUpdate(item.id, updated);
                                                                                            }}
                                                                                            onBlur={() => handleSaveParticulars(item.id, item.checklist_item_particulars)}
                                                                                            className="w-full text-[9px] px-1 py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                                            placeholder="Display Label"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="col-span-2">
                                                                                        <select
                                                                                            value={p.data_type || "text"}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...item.checklist_item_particulars];
                                                                                                updated[idx] = { ...p, data_type: e.target.value };
                                                                                                handleLocalParticularsUpdate(item.id, updated);
                                                                                                handleSaveParticulars(item.id, updated);
                                                                                            }}
                                                                                            className="w-full text-[9px] px-1 py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                                        >
                                                                                            <option value="text">Text</option>
                                                                                            <option value="integer">Integer</option>
                                                                                            <option value="decimal">Decimal</option>
                                                                                            <option value="date">Date</option>
                                                                                            <option value="boolean">Yes/No</option>
                                                                                            <option value="selection">Selection</option>
                                                                                            <option value="multi_select">Multi Select</option>
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="col-span-1">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={p.unit || ""}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...item.checklist_item_particulars];
                                                                                                updated[idx] = { ...p, unit: e.target.value };
                                                                                                handleLocalParticularsUpdate(item.id, updated);
                                                                                            }}
                                                                                            onBlur={() => handleSaveParticulars(item.id, item.checklist_item_particulars)}
                                                                                            className="w-full text-[9px] px-1 py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                                            placeholder="unit"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="col-span-1">
                                                                                        <input
                                                                                            type="number"
                                                                                            value={p.sort_order ?? 0}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...item.checklist_item_particulars];
                                                                                                updated[idx] = { ...p, sort_order: parseInt(e.target.value) || 0 };
                                                                                                handleLocalParticularsUpdate(item.id, updated);
                                                                                            }}
                                                                                            onBlur={() => handleSaveParticulars(item.id, item.checklist_item_particulars)}
                                                                                            className="w-full text-[9px] px-1 py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="col-span-2">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={p.default_value || ""}
                                                                                            onChange={(e) => {
                                                                                                const updated = [...item.checklist_item_particulars];
                                                                                                updated[idx] = { ...p, default_value: e.target.value };
                                                                                                handleLocalParticularsUpdate(item.id, updated);
                                                                                            }}
                                                                                            onBlur={() => handleSaveParticulars(item.id, item.checklist_item_particulars)}
                                                                                            className="w-full text-[9px] px-1 py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                                            placeholder="default"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="col-span-1 flex justify-end">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                 const updated = item.checklist_item_particulars.filter((_: ChecklistItemParticular, i: number) => i !== idx);
                                                                                                handleSaveParticulars(item.id, updated);
                                                                                            }}
                                                                                            className="p-0.5 text-slate-300 hover:text-destructive transition-colors opacity-0 group-hover/prow:opacity-100"
                                                                                        >
                                                                                            <Trash2 size={10} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>

                                                                                {(p.data_type === "selection" || p.data_type === "multi_select") && (
                                                                                    <div className="mt-1 pl-4 border-l-2 border-primary/20 space-y-1">
                                                                                        <label className="text-[7px] font-bold text-primary uppercase">Selection Options (comma separated)</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            placeholder="Option 1, Option 2, Option 3"
                                                                                            value={Array.isArray(p.selection_options) ? p.selection_options.join(", ") : (p.selection_options || "")}
                                                                                            onChange={(e) => {
                                                                                                const options = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                                                                                const updated = [...item.checklist_item_particulars];
                                                                                                updated[idx] = { ...p, selection_options: options };
                                                                                                handleLocalParticularsUpdate(item.id, updated);
                                                                                            }}
                                                                                            onBlur={() => handleSaveParticulars(item.id, item.checklist_item_particulars)}
                                                                                            className="w-full text-[9px] px-1.5 py-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none bg-primary/5"
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-slate-50 border border-slate-100 border-dashed rounded p-3 text-center">
                                                                        <p className="text-[9px] text-slate-400 italic">No particulars defined. Add fields to collect specific data for this item.</p>
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
