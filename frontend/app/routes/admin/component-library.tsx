import { useLoaderData, useSubmit, useNavigation, useRevalidator, useActionData } from "react-router";
import { ApiGET, ApiPOST, ApiPATCH, ApiDELETE } from "~/.server/lib/api";
import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronRight, Library, Settings2, Save, X } from "lucide-react";
import { cn } from "~/lib/utils";

export const handle = { fluid: true };

export async function loader({ request }: any) {
    const host = process.env.API_URL || "http://localhost:2000";
    const res = await ApiGET(request, `${host}/component_library?order=code.asc`);
    let components = [];
    if (res.ok) {
        const data = await res.json();
        components = Array.isArray(data) ? data : [];
    }
    return { components };
}

export async function action({ request }: any) {
    const host = process.env.API_URL || "http://localhost:2000";
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "save_component") {
        const id = formData.get("id");
        const code = formData.get("code");
        const name = formData.get("name");
        const duty = formData.get("duty");
        const description = formData.get("description");
        const propertiesJson = formData.get("properties");

        let properties = [];
        try {
            properties = propertiesJson ? JSON.parse(propertiesJson as string) : [];
        } catch (e) {
            return { success: false, error: "Invalid properties format" };
        }

        const data = { code, name, duty, description, properties };

        if (id) {
            const res = await ApiPATCH(request, `${host}/component_library?id=eq.${id}`, data);
            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: res.statusText }));
                return { success: false, error: err.message || "Failed to update component" };
            }
            return { success: true };
        } else {
            const res = await ApiPOST(request, `${host}/component_library`, data);
            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: res.statusText }));
                return { success: false, error: err.message || "Failed to create component" };
            }
            return { success: true };
        }
    }

    if (intent === "delete_component") {
        const id = formData.get("id");
        const res = await ApiDELETE(request, `${host}/component_library?id=eq.${id}`);
        return { success: res.ok };
    }

    return { error: "Unknown action" };
}

export default function ComponentLibraryAdmin() {
    const { components } = useLoaderData<typeof loader>();
    const [selectedComponent, setSelectedComponent] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({
        code: "",
        name: "",
        duty: "",
        description: "",
        properties: []
    });
    const [successHandled, setSuccessHandled] = useState(false);

    const submit = useSubmit();
    const navigation = useNavigation();
    const revalidator = useRevalidator();
    const actionData = useActionData<typeof action>();
    const isSubmitting = navigation.state !== "idle" && navigation.formData?.get("intent") === "save_component";

    useEffect(() => {
        if (actionData?.success && !successHandled && navigation.state === "idle") {
            revalidator.revalidate();
            if (isEditing) {
                setIsEditing(false);
            }
            setSuccessHandled(true);
        } else if (navigation.state === "submitting") {
            setSuccessHandled(false);
        }
    }, [actionData, navigation.state, isEditing, successHandled]);

    // Handle selection and sync
    useEffect(() => {
        if (selectedComponent?.id) {
            const fresh = components.find((c: any) => c.id === selectedComponent.id);
            if (fresh) {
                setSelectedComponent(fresh);
                if (!isEditing) {
                    setEditForm(fresh);
                }
            }
        }
    }, [components]);

    const handleNew = () => {
        setSelectedComponent(null);
        setEditForm({
            code: "",
            name: "",
            duty: "",
            description: "",
            properties: []
        });
        setIsEditing(true);
    };

    const handleEdit = () => {
        setEditForm(selectedComponent);
        setIsEditing(true);
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append("intent", "save_component");
        if (selectedComponent?.id) {
            formData.append("id", selectedComponent.id.toString());
        }
        formData.append("code", editForm.code);
        formData.append("name", editForm.name);
        formData.append("duty", editForm.duty);
        formData.append("description", editForm.description);
        formData.append("properties", JSON.stringify(editForm.properties || []));
        submit(formData, { method: "post" });
    };

    const handleDelete = (id: number) => {
        if (!confirm("Are you sure you want to delete this component?")) return;
        const formData = new FormData();
        formData.append("intent", "delete_component");
        formData.append("id", id.toString());
        submit(formData, { method: "post" });
        setSelectedComponent(null);
    };

    const addProperty = () => {
        setEditForm({
            ...editForm,
            properties: [...(editForm.properties || []), { code: "", title: "", type: "text" }]
        });
    };

    const removeProperty = (idx: number) => {
        const updated = [...editForm.properties];
        updated.splice(idx, 1);
        setEditForm({ ...editForm, properties: updated });
    };

    const updateProperty = (idx: number, field: string, value: string) => {
        const updated = [...editForm.properties];
        updated[idx] = { ...updated[idx], [field]: value };
        setEditForm({ ...editForm, properties: updated });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Library size={18} className="text-primary" />
                        Component Library
                    </h1>
                    <p className="text-xs text-slate-500">Manage global component definitions and their standard properties.</p>
                </div>
                <button
                    onClick={handleNew}
                    className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-primary/90 flex items-center gap-2 transition-colors"
                >
                    <Plus size={14} /> Add Component
                </button>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* List */}
                <div className="col-span-4 space-y-2">
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100 max-h-[calc(100vh-250px)] overflow-y-auto">
                            {(components || []).map((comp: any) => (
                                <button
                                    key={comp.id}
                                    onClick={() => {
                                        setSelectedComponent(comp);
                                        setIsEditing(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-4 py-3 transition-all flex items-center justify-between group",
                                        selectedComponent?.id === comp.id ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-slate-50 border-l-4 border-l-transparent"
                                    )}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-mono font-bold text-slate-400">{comp.code}</span>
                                        <span className="text-xs font-bold text-slate-700">{comp.name}</span>
                                        <span className="text-[10px] text-slate-500 italic">{comp.duty}</span>
                                    </div>
                                    <ChevronRight size={14} className={cn("transition-transform text-slate-300", selectedComponent?.id === comp.id ? "translate-x-1 text-primary" : "opacity-0 group-hover:opacity-100")} />
                                </button>
                            ))}
                            {(components || []).length === 0 && (
                                <div className="p-8 text-center text-slate-400 italic text-xs">No components defined</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Editor/Viewer */}
                <div className="col-span-8">
                    {isEditing || selectedComponent ? (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
                                    <Settings2 size={16} className="text-slate-400" />
                                    {isEditing ? (selectedComponent ? "Edit Component" : "New Component") : "Component Details"}
                                </h3>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                disabled={isSubmitting}
                                                onClick={handleSave}
                                                className={cn(
                                                    "px-3 py-1 bg-primary text-white text-[11px] font-bold rounded flex items-center gap-1.5 hover:bg-primary/90 transition-all",
                                                    isSubmitting && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Save size={12} />
                                                )}
                                                {isSubmitting ? "Saving..." : "Save Changes"}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleDelete(selectedComponent.id)}
                                                className="px-3 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/10 rounded flex items-center gap-1.5"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                            <button
                                                onClick={handleEdit}
                                                className="px-3 py-1 border border-slate-200 text-slate-600 text-[11px] font-bold rounded hover:bg-slate-100"
                                            >
                                                Edit Component
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                {actionData?.error && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium flex items-center gap-2 animate-in shake duration-300">
                                        <X size={14} />
                                        {actionData.error}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.code}
                                                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                placeholder="e.g. ME-01"
                                            />
                                        ) : (
                                            <div className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{selectedComponent.code}</div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duty / Type</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.duty}
                                                onChange={(e) => setEditForm({ ...editForm, duty: e.target.value })}
                                                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                placeholder="e.g. Main Engine"
                                            />
                                        ) : (
                                            <div className="text-xs font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{selectedComponent.duty || "-"}</div>
                                        )}
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Component Name</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                placeholder="Full descriptive name"
                                            />
                                        ) : (
                                            <div className="text-xs font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{selectedComponent.name}</div>
                                        )}
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                                        {isEditing ? (
                                            <textarea
                                                rows={3}
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                placeholder="Technical description or library notes..."
                                            />
                                        ) : (
                                            <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 min-h-[60px] whitespace-pre-wrap">{selectedComponent.description || "-"}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard Properties (Dynamic Fields)</label>
                                        {isEditing && (
                                            <button
                                                onClick={addProperty}
                                                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                                            >
                                                <Plus size={12} /> Add Property
                                            </button>
                                        )}
                                    </div>

                                    {(isEditing ? editForm.properties : selectedComponent.properties || []).length > 0 ? (
                                        <div className="grid grid-cols-12 gap-3">
                                            <div className="col-span-3 text-[9px] font-bold text-slate-400 px-2">Property Code</div>
                                            <div className="col-span-5 text-[9px] font-bold text-slate-400 px-2">Display Title</div>
                                            <div className="col-span-3 text-[9px] font-bold text-slate-400 px-2">Type</div>
                                            <div className="col-span-1"></div>

                                            {(isEditing ? editForm.properties : selectedComponent.properties || []).map((prop: any, idx: number) => (
                                                <div key={idx} className="col-span-12 grid grid-cols-12 gap-3 items-center group">
                                                    <div className="col-span-3">
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={prop.code}
                                                                onChange={(e) => updateProperty(idx, "code", e.target.value)}
                                                                className="w-full text-[11px] font-mono px-3 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                placeholder="e.g. SERIAL"
                                                            />
                                                        ) : (
                                                            <div className="text-[11px] font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">{prop.code}</div>
                                                        )}
                                                    </div>
                                                    <div className="col-span-5">
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={prop.title}
                                                                onChange={(e) => updateProperty(idx, "title", e.target.value)}
                                                                className="w-full text-[11px] px-3 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none"
                                                                placeholder="e.g. Serial Number"
                                                            />
                                                        ) : (
                                                            <div className="text-[11px] font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">{prop.title}</div>
                                                        )}
                                                    </div>
                                                    <div className="col-span-3">
                                                        {isEditing ? (
                                                            <select
                                                                value={prop.type || "text"}
                                                                onChange={(e) => updateProperty(idx, "type", e.target.value)}
                                                                className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-primary/20 outline-none bg-white"
                                                            >
                                                                <option value="text">Text</option>
                                                                <option value="number">Number</option>
                                                                <option value="date">Date</option>
                                                                <option value="checkbox">Checkbox</option>
                                                            </select>
                                                        ) : (
                                                            <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-100 capitalize">{prop.type || "text"}</div>
                                                        )}
                                                    </div>
                                                    <div className="col-span-1 flex justify-end">
                                                        {isEditing && (
                                                            <button
                                                                onClick={() => removeProperty(idx)}
                                                                className="p-1.5 text-slate-300 hover:text-destructive transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center">
                                            <p className="text-xs text-slate-400 italic">No standard properties defined for this component.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl p-20 text-center shadow-sm">
                            <Library size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-slate-600 font-bold">Select a component to view or edit</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                Components from this library can be assigned to ships and will automatically populate checklist items with their properties.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
