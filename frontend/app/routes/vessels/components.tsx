import { useLoaderData, useSubmit, useNavigation, useRevalidator, useActionData, useParams, Link } from "react-router";
import { ApiGET, ApiPOST, ApiPATCH, ApiDELETE } from "~/.server/lib/api";
import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronRight, Network, Save, Search, Settings2, Info, X, ArrowLeft } from "lucide-react";
import { cn } from "~/lib/utils";

export const handle = { fluid: true };

export async function loader({ request, params }: any) {
    const host = process.env.API_URL || "http://localhost:2000";
    const vesselId = params.id;

    const [vesselRes, libRes, treeRes] = await Promise.all([
        ApiGET(request, `${host}/ships?id=eq.${vesselId}&select=id,name,imo_number`),
        ApiGET(request, `${host}/component_library?order=name.asc`),
        ApiGET(request, `${host}/ship_component_tree?ship_id=eq.${vesselId}&select=*,component_library(name,code,properties)&order=sequencer.asc`)
    ]);

    if (!vesselRes.ok) throw new Response("Vessel not found", { status: 404 });
    const vessels = await vesselRes.json();
    const vessel = vessels[0];
    if (!vessel) throw new Response("Vessel not found", { status: 404 });

    let library = [];
    if (libRes.ok) {
        const libData = await libRes.json();
        library = Array.isArray(libData) ? libData : [];
    }

    let tree = [];
    if (treeRes.ok) {
        const treeData = await treeRes.json();
        tree = Array.isArray(treeData) ? treeData : [];
    }

    return {
        vessel,
        library,
        tree,
        vesselId: parseInt(vesselId)
    };
}

export async function action({ request, params }: any) {
    const host = process.env.API_URL || "http://localhost:2000";
    const formData = await request.formData();
    const intent = formData.get("intent");
    const vesselId = params.id;

    if (intent === "add_to_tree") {
        const lib_id = parseInt(formData.get("lib_id") as string);
        const propertiesJson = formData.get("properties");
        const name = formData.get("name");
        const sequencer = parseInt(formData.get("sequencer") as string) || 10;

        let properties = [];
        try {
            properties = propertiesJson ? JSON.parse(propertiesJson as string) : [];
        } catch (e) {
            return { success: false, error: "Invalid properties format" };
        }

        const res = await ApiPOST(request, `${host}/ship_component_tree`, {
            ship_id: parseInt(vesselId),
            lib_id,
            properties,
            custom_name: name,
            sequencer
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return { success: false, error: err.message || "Failed to add component to ship" };
        }
        return { success: true };
    }

    if (intent === "update_node") {
        const id = parseInt(formData.get("id") as string);
        const custom_name = formData.get("custom_name");
        const position_description = formData.get("position_description");
        const propertiesJson = formData.get("properties");
        const sequencer = parseInt(formData.get("sequencer") as string) || 10;

        let properties = [];
        try {
            properties = propertiesJson ? JSON.parse(propertiesJson as string) : [];
        } catch (e) {
            return { success: false, error: "Invalid properties format" };
        }

        const res = await ApiPATCH(request, `${host}/ship_component_tree?id=eq.${id}`, {
            custom_name,
            position_description,
            properties,
            sequencer
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return { success: false, error: err.message || "Failed to update component" };
        }
        return { success: true };
    }

    if (intent === "delete_node") {
        const id = parseInt(formData.get("id") as string);
        const res = await ApiDELETE(request, `${host}/ship_component_tree?id=eq.${id}`);
        return { success: res.ok };
    }

    return { error: "Unknown action" };
}

export default function VesselComponents() {
    const { vessel, library, tree, vesselId } = useLoaderData<typeof loader>();
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [addingItem, setAddingItem] = useState<any>(null);
    const [addingConfig, setAddingConfig] = useState({ name: "", sequencer: 10 });
    const [searchQuery, setSearchQuery] = useState("");
    const [successHandled, setSuccessHandled] = useState(false);

    const submit = useSubmit();
    const navigation = useNavigation();
    const revalidator = useRevalidator();
    const actionData = useActionData<typeof action>();
    const isUpdating = navigation.state !== "idle" && navigation.formData?.get("intent") === "update_node";
    const isAddingNode = navigation.state !== "idle" && navigation.formData?.get("intent") === "add_to_tree";
    const addingLibId = navigation.formData?.get("lib_id");

    useEffect(() => {
        if (actionData?.success && !successHandled && navigation.state === "idle") {
            revalidator.revalidate();
            setIsAdding(false);
            setAddingItem(null);
            setSuccessHandled(true);
        } else if (navigation.state === "submitting") {
            setSuccessHandled(false);
        }
    }, [actionData, navigation.state, successHandled]);

    useEffect(() => {
        if (selectedNode?.id) {
            const fresh = tree.find((n: any) => n.id === selectedNode.id);
            if (fresh) setSelectedNode(fresh);
        }
    }, [tree]);

    const handleAddComponent = () => {
        if (!addingItem) return;
        const formData = new FormData();
        formData.append("intent", "add_to_tree");
        formData.append("lib_id", addingItem.id.toString());
        formData.append("name", addingConfig.name || addingItem.name);
        formData.append("sequencer", addingConfig.sequencer.toString());
        const propsWithResults = (addingItem.properties || []).map((p: any) => ({ ...p, result: "" }));
        formData.append("properties", JSON.stringify(propsWithResults));
        submit(formData, { method: "post" });
    };

    const handleUpdateNode = () => {
        if (!selectedNode) return;
        const formData = new FormData();
        formData.append("intent", "update_node");
        formData.append("id", selectedNode.id.toString());
        formData.append("custom_name", selectedNode.custom_name);
        formData.append("position_description", selectedNode.position_description || "");
        formData.append("sequencer", (selectedNode.sequencer || 10).toString());
        formData.append("properties", JSON.stringify(selectedNode.properties || []));
        submit(formData, { method: "post" });
    };

    const handleDeleteNode = (id: number) => {
        if (!confirm("Remove this component from the ship?")) return;
        const formData = new FormData();
        formData.append("intent", "delete_node");
        formData.append("id", id.toString());
        submit(formData, { method: "post" });
        setSelectedNode(null);
    };

    const filteredLibrary = library.filter((item: any) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to={`/vessels/${vesselId}`}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Network size={18} className="text-primary" />
                            Breakdown: {vessel.name}
                        </h1>
                        <p className="text-xs text-slate-500">Configure technical components and equipment for {vessel.name} ({vessel.imo_number}).</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Components</h3>
                        <button
                            onClick={() => {
                                setSelectedNode(null);
                                setIsAdding(true);
                            }}
                            className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                        >
                            <Plus size={12} /> Add New
                        </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[400px]">
                        <div className="divide-y divide-slate-100 max-h-[calc(100vh-250px)] overflow-y-auto">
                            {(tree || []).map((node: any) => (
                                <button
                                    key={node.id}
                                    onClick={() => {
                                        setSelectedNode(node);
                                        setIsAdding(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-4 py-3 transition-all flex items-center justify-between group",
                                        selectedNode?.id === node.id ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-slate-50 border-l-4 border-l-transparent"
                                    )}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-mono font-bold text-slate-400">{node.component_library?.code}</span>
                                        <span className="text-xs font-bold text-slate-700">{node.custom_name}</span>
                                        <span className="text-[10px] text-slate-400 line-clamp-1">{node.position_description || "No position specified"}</span>
                                    </div>
                                    <ChevronRight size={14} className={cn("transition-transform text-slate-300", selectedNode?.id === node.id ? "translate-x-1 text-primary" : "opacity-0 group-hover:opacity-100")} />
                                </button>
                            ))}
                            {tree.length === 0 && !isAdding && (
                                <div className="p-12 text-center text-slate-400">
                                    <p className="text-[11px] italic">No components assigned.</p>
                                </div>
                            )}
                            {isAdding && (
                                <div className="p-3 bg-primary/5 animate-in slide-in-from-top duration-200">
                                    <div className="relative mb-3">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Search library..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full text-xs pl-8 pr-8 py-1.5 border border-slate-200 rounded bg-white outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                                        {filteredLibrary.map((item: any) => {
                                            const isSelectedForAdd = addingItem?.id === item.id;
                                            return (
                                                <div key={item.id} className="space-y-2">
                                                    <button
                                                        disabled={isAddingNode}
                                                        onClick={() => {
                                                            setAddingItem(isSelectedForAdd ? null : item);
                                                            setAddingConfig({ name: item.name, sequencer: 10 });
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-white hover:text-primary rounded transition-colors flex items-center justify-between group",
                                                            isSelectedForAdd && "bg-white text-primary ring-1 ring-primary/20 shadow-sm"
                                                        )}
                                                    >
                                                        <span>{item.name}</span>
                                                        <Plus size={12} className={cn("transition-transform", isSelectedForAdd && "rotate-45")} />
                                                    </button>

                                                    {isSelectedForAdd && (
                                                        <div className="bg-white border border-slate-100 rounded-lg p-3 space-y-3 shadow-inner animate-in slide-in-from-top-2 duration-200">
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Instance Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={addingConfig.name}
                                                                    onChange={(e) => setAddingConfig({ ...addingConfig, name: e.target.value })}
                                                                    className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-primary/20"
                                                                    placeholder="e.g. #1 Main Engine"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sequencer</label>
                                                                <input
                                                                    type="number"
                                                                    value={addingConfig.sequencer}
                                                                    onChange={(e) => setAddingConfig({ ...addingConfig, sequencer: parseInt(e.target.value) || 0 })}
                                                                    className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-primary/20"
                                                                />
                                                            </div>
                                                            <button
                                                                disabled={isAddingNode}
                                                                onClick={handleAddComponent}
                                                                className="w-full py-2 bg-primary text-white text-[10px] font-bold rounded flex items-center justify-center gap-1.5 hover:bg-primary/95 transition-all shadow-sm"
                                                            >
                                                                {isAddingNode ? (
                                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                ) : (
                                                                    <Save size={12} />
                                                                )}
                                                                Add Component
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="w-full mt-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-span-8 space-y-4">
                    {actionData?.error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium flex items-center gap-2 animate-in shake duration-300">
                            <X size={14} />
                            {actionData.error}
                        </div>
                    )}

                    {selectedNode ? (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
                                    <Settings2 size={16} className="text-slate-400" />
                                    Configure Component
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDeleteNode(selectedNode.id)}
                                        className="px-3 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/10 rounded flex items-center gap-1.5"
                                    >
                                        <Trash2 size={12} /> Remove
                                    </button>
                                    <button
                                        disabled={isUpdating}
                                        onClick={handleUpdateNode}
                                        className={cn(
                                            "px-4 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 hover:bg-primary/90 shadow-sm transition-all",
                                            isUpdating && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isUpdating ? (
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save size={14} />
                                        )}
                                        {isUpdating ? "Updating..." : "Update Configuration"}
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-8 flex-1 overflow-y-auto font-inter">
                                <div className="grid grid-cols-12 gap-6 pb-6 border-b border-slate-100">
                                    <div className="col-span-5 space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instance Name</label>
                                        <input
                                            type="text"
                                            value={selectedNode.custom_name}
                                            onChange={(e) => setSelectedNode({ ...selectedNode, custom_name: e.target.value })}
                                            className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="e.g. Port Main Engine"
                                        />
                                    </div>
                                    <div className="col-span-5 space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position / Remark</label>
                                        <input
                                            type="text"
                                            value={selectedNode.position_description || ""}
                                            onChange={(e) => setSelectedNode({ ...selectedNode, position_description: e.target.value })}
                                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="e.g. Engine Room, Port Side"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order</label>
                                        <input
                                            type="number"
                                            value={selectedNode.sequencer || 0}
                                            onChange={(e) => setSelectedNode({ ...selectedNode, sequencer: parseInt(e.target.value) || 0 })}
                                            className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            Component Properties & Current Values
                                            <Info size={12} className="text-primary/40" />
                                        </h4>
                                        <p className="text-[10px] text-slate-400 mt-1">These values are used during surveys. "Current Result" is synced from latest survey findings.</p>
                                    </div>

                                    <div className="grid grid-cols-12 gap-x-4 gap-y-3">
                                        {selectedNode.properties.map((prop: any, idx: number) => (
                                            <div key={idx} className="col-span-12 grid grid-cols-12 gap-4 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                <div className="col-span-4">
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">{prop.code}</div>
                                                    <div className="text-[11px] font-bold text-slate-700">{prop.title}</div>
                                                </div>
                                                <div className="col-span-8">
                                                    <input
                                                        type={prop.type === "checkbox" ? "checkbox" : (prop.type || "text")}
                                                        checked={prop.type === "checkbox" ? prop.result === "true" || prop.result === true : undefined}
                                                        value={prop.type === "checkbox" ? undefined : (prop.result || "")}
                                                        onChange={(e) => {
                                                            const updated = [...selectedNode.properties];
                                                            const val = prop.type === "checkbox" ? e.target.checked.toString() : e.target.value;
                                                            updated[idx] = { ...prop, result: val };
                                                            setSelectedNode({ ...selectedNode, properties: updated });
                                                        }}
                                                        className={cn(
                                                            "border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 bg-white outline-none font-medium text-xs",
                                                            prop.type === "checkbox" ? "w-5 h-5" : "w-full px-3 py-2"
                                                        )}
                                                        placeholder={prop.type === "checkbox" ? "" : `Current ${prop.title.toLowerCase()}...`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedNode.properties.length === 0 && (
                                        <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[11px]">
                                            No standard properties defined in library for this component.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl p-20 text-center shadow-sm">
                            <Network size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-slate-600 font-bold">Manage ship components</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                Add components from the library and configure their specific properties for this vessel.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
