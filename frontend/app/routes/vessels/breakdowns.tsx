import { useLoaderData, useSubmit, useNavigation, useRevalidator, useActionData, Link } from "react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, Network, Save, Settings2, Info, X, ArrowLeft, Layers, RefreshCcw, Copy } from "lucide-react";
import { cn } from "~/lib/utils";

export const handle = { fluid: true };

import { loader, action } from "./breakdowns.server";
export { loader, action };

export default function VesselBreakdown() {
    const { vessel, activeBreakdown, tree, allParticulars, templates, templateNodes, vesselId, host } = useLoaderData<typeof loader>();
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [nodeParticulars, setNodeParticulars] = useState<any[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const [isApplying, setIsApplying] = useState(false);
    const [showAddNodeModal, setShowAddNodeModal] = useState(false);
    const [newNodeData, setNewNodeData] = useState({ parentId: null as number | null, parentTemplateNodeId: null as number | null, code: "", name: "", category: "EQUIPMENT", templateNodeId: null as number | null });
    const [availableTemplateNodes, setAvailableTemplateNodes] = useState<any[]>([]);

    const submit = useSubmit();
    const navigation = useNavigation();
    const revalidator = useRevalidator();
    const actionData = useActionData<typeof action>();

    const isSubmitting = navigation.state !== "idle";
    const isSavingParticulars = navigation.state === "submitting" && navigation.formData?.get("intent") === "save_particulars";
    const isSavingNode = navigation.state === "submitting" && navigation.formData?.get("intent") === "update_node_info";

    useEffect(() => {
        if (selectedNode) {
            const nodeParts = allParticulars.filter((p: any) => p.ship_breakdown_node_id === selectedNode.id);
            setNodeParticulars(nodeParts);
        }
    }, [allParticulars, selectedNode?.id]);

    useEffect(() => {
        if (actionData?.success && navigation.state === "idle") {
            revalidator.revalidate();
        }
    }, [actionData, navigation.state]);

    // Build hierarchical tree structure
    const buildTree = (nodes: any[], parentId: number | null = null): any[] => {
        return nodes
            .filter(n => n.parent_node_id === parentId)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map(n => ({
                ...n,
                children: buildTree(nodes, n.id)
            }));
    };

    const rootNodes = buildTree(tree);

    const toggleExpand = (id: number) => {
        const next = new Set(expandedNodes);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedNodes(next);
    };

    const handleSelectNode = (node: any) => {
        setSelectedNode(node);
    };

    const handleApplyTemplate = (templateId: number) => {
        if (!confirm("This will replace any existing breakdown for this vessel. Continue?")) return;
        setIsApplying(true);
        const formData = new FormData();
        formData.append("intent", "apply_template");
        formData.append("template_id", templateId.toString());
        submit(formData, { method: "post" });
    };

    useEffect(() => {
        if (showAddNodeModal) {
            if (newNodeData.parentTemplateNodeId) {
                const children = templateNodes.filter((tn: any) => tn.parent_node_id === newNodeData.parentTemplateNodeId);
                setAvailableTemplateNodes(children);
            } else if (!newNodeData.parentId && activeBreakdown?.template_id) {
                const roots = templateNodes.filter((tn: any) => tn.template_id === activeBreakdown.template_id && !tn.parent_node_id);
                setAvailableTemplateNodes(roots);
            } else {
                setAvailableTemplateNodes([]);
            }
        } else {
            setAvailableTemplateNodes([]);
        }
    }, [showAddNodeModal, newNodeData.parentTemplateNodeId, newNodeData.parentId, activeBreakdown?.template_id, templateNodes]);

    const handleCreateManualBreakdown = () => {
        setIsApplying(true);
        const formData = new FormData();
        formData.append("intent", "create_manual_breakdown");
        submit(formData, { method: "post" });
    };

    const handleAddNode = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();

        if (newNodeData.templateNodeId) {
            formData.append("intent", "add_template_node");
            formData.append("template_node_id", newNodeData.templateNodeId.toString());
        } else {
            formData.append("intent", "add_custom_node");
            formData.append("code", newNodeData.code);
            formData.append("name", newNodeData.name);
            formData.append("category", newNodeData.category);
        }

        formData.append("breakdown_id", activeBreakdown.id.toString());
        if (newNodeData.parentId) formData.append("parent_id", newNodeData.parentId.toString());

        submit(formData, { method: "post" });
        setShowAddNodeModal(false);
        setNewNodeData({ parentId: null, parentTemplateNodeId: null, code: "", name: "", category: "EQUIPMENT", templateNodeId: null });
    };

    const handleDeleteNode = (id: number) => {
        if (!confirm("Are you sure you want to delete this node and all its children?")) return;
        const formData = new FormData();
        formData.append("intent", "delete_node");
        formData.append("id", id.toString());
        submit(formData, { method: "post" });
        if (selectedNode?.id === id) setSelectedNode(null);
        setNewNodeData({ parentId: null, parentTemplateNodeId: null, code: "", name: "", category: "EQUIPMENT", templateNodeId: null });
    };

    const handleCopyNode = (id: number) => {
        if (!confirm("Create a copy of this node and all its children?")) return;
        const formData = new FormData();
        formData.append("intent", "copy_node");
        formData.append("id", id.toString());
        submit(formData, { method: "post" });
    };

    const handleSaveNodeInfo = () => {
        if (!selectedNode) return;
        const formData = new FormData();
        formData.append("intent", "update_node_info");
        formData.append("id", selectedNode.id.toString());
        formData.append("code", selectedNode.code);
        formData.append("name", selectedNode.name);
        formData.append("category", selectedNode.category || "");
        formData.append("node_type", selectedNode.node_type || "");
        formData.append("description", selectedNode.description || "");
        formData.append("sort_order", (selectedNode.sort_order || 0).toString());
        submit(formData, { method: "post" });
    };

    const handleSaveParticulars = () => {
        if (!selectedNode) return;
        const formData = new FormData();
        formData.append("intent", "save_particulars");
        formData.append("node_id", selectedNode.id.toString());
        formData.append("particulars", JSON.stringify(nodeParticulars));
        submit(formData, { method: "post" });
    };

    const addParticular = () => {
        setNodeParticulars([...nodeParticulars, {
            attr_key: "",
            attr_title: "",
            data_type: "text",
            sort_order: nodeParticulars.length * 10
        }]);
    };

    const updateParticular = (idx: number, field: string, value: any) => {
        const next = [...nodeParticulars];
        next[idx] = { ...next[idx], [field]: value };
        setNodeParticulars(next);
    };

    const removeParticular = (idx: number) => {
        const next = [...nodeParticulars];
        next.splice(idx, 1);
        setNodeParticulars(next);
    };

    const renderTreeNode = (node: any) => {
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = selectedNode?.id === node.id;
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.id}>
                <div
                    className={cn(
                        "group flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all",
                        isSelected ? "bg-primary/5 text-primary" : "hover:bg-slate-50 text-slate-600"
                    )}
                    onClick={() => handleSelectNode(node)}
                >
                    <div
                        className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(node.id);
                        }}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        ) : (
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-300 group-hover:text-primary/40">{node.code}</span>
                        <span className="text-xs font-semibold truncate">{node.name}</span>
                        {node.is_modified && <div className="w-1 h-1 rounded-full bg-amber-400" title="Modified from template" />}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setNewNodeData({ ...newNodeData, parentId: node.id, parentTemplateNodeId: node.template_node_id });
                                setShowAddNodeModal(true);
                            }}
                            className="p-1 hover:bg-primary/10 rounded-md text-slate-400 hover:text-primary"
                            title="Add Child"
                        >
                            <Plus size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopyNode(node.id); }}
                            className="p-1 hover:bg-white/50 rounded text-slate-400 hover:text-primary transition-colors"
                            title="Copy Node"
                        >
                            <Copy className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                            className="p-1 hover:bg-white/50 rounded text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete Node"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                {isExpanded && hasChildren && (
                    <div className="ml-4 border-l border-slate-100 pl-2 mt-1 space-y-0.5">
                        {node.children.map((child: any) => renderTreeNode(child))}
                    </div>
                )}
            </div>
        );
    };

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
                            Vessel Breakdown: {vessel.name}
                        </h1>
                        <p className="text-xs text-slate-500">Structured equipment hierarchy and technical particulars.</p>
                    </div>
                </div>
                {activeBreakdown && (
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                            Revision: {activeBreakdown.revision}
                        </span>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                            title="Refresh Tree"
                        >
                            <RefreshCcw size={16} />
                        </button>
                    </div>
                )}
            </div>

            {!activeBreakdown ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <Layers size={40} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">Configure Breakdown Structure</h2>
                    <p className="text-sm text-slate-500 mb-8">
                        This vessel does not have a breakdown structure configured yet.
                        Select a standard template to initialize the equipment hierarchy.
                    </p>

                    <div className="grid grid-cols-1 gap-3 text-left max-w-md mx-auto">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Actions</label>
                        <button
                            onClick={handleCreateManualBreakdown}
                            disabled={isSubmitting}
                            className="group w-full p-4 bg-white border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center justify-between"
                        >
                            <div>
                                <div className="text-xs font-bold text-slate-700 group-hover:text-primary">Manual Initialization</div>
                                <div className="text-[10px] text-slate-400">Start with an empty structure and add nodes manually</div>
                            </div>
                            <Plus size={16} className="text-slate-200 group-hover:text-primary" />
                        </button>

                        <div className="h-4" />
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Standard Templates</label>
                        {templates.map((tmpl: any) => (
                            <button
                                key={tmpl.id}
                                onClick={() => handleApplyTemplate(tmpl.id)}
                                disabled={isSubmitting}
                                className="group w-full p-4 bg-white border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center justify-between"
                            >
                                <div>
                                    <div className="text-xs font-bold text-slate-700 group-hover:text-primary">{tmpl.name}</div>
                                    <div className="text-[10px] text-slate-400">{tmpl.vessel_type} • v{tmpl.version}</div>
                                </div>
                                <ChevronRight size={16} className="text-slate-200 group-hover:text-primary" />
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-12 gap-6 min-h-[600px]">
                    {/* Tree Sidebar */}
                    <div className="col-span-4 flex flex-col gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipment Tree</h3>
                            <button
                                onClick={() => {
                                    setNewNodeData({ ...newNodeData, parentId: null, parentTemplateNodeId: null });
                                    setShowAddNodeModal(true);
                                }}
                                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                <Plus size={12} /> Add Custom
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-1">
                                {rootNodes.map(node => renderTreeNode(node))}
                            </div>
                        </div>
                    </div>

                    {/* Node Config */}
                    <div className="col-span-8 flex flex-col gap-4 overflow-hidden">
                        {selectedNode ? (
                            <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                {/* Status Alerts */}
                                {actionData?.error && (
                                    <div className="p-4 bg-red-50 border-b border-red-100 text-xs text-red-600 font-semibold flex items-center gap-2">
                                        <X size={14} /> {actionData.error}
                                    </div>
                                )}
                                {actionData?.success && navigation.state === "idle" && (
                                    <div className="p-4 bg-green-50 border-b border-green-100 text-xs text-green-600 font-semibold flex items-center gap-2">
                                        <Save size={14} /> Changes saved successfully.
                                    </div>
                                )}

                                {/* Header */}
                                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase">
                                            <span>Equipment Node</span>
                                            <span>/</span>
                                            <span className="text-primary font-bold">{selectedNode.code}</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-800">{selectedNode.name}</h2>
                                    </div>
                                </div>

                                {/* Main Editor Scrollable Area */}
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                    <div className="space-y-8">
                                        {/* Basic Info */}
                                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Info className="w-4 h-4 text-slate-400" />
                                                    <h3 className="font-semibold text-slate-800">Node Configuration</h3>
                                                </div>
                                                <button
                                                    onClick={handleSaveNodeInfo}
                                                    disabled={isSavingNode}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                    {isSavingNode ? "Saving..." : "Save Info"}
                                                </button>
                                            </div>
                                            <div className="p-4 grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Node Name</label>
                                                    <input
                                                        type="text"
                                                        value={selectedNode.name}
                                                        onChange={(e) => setSelectedNode({ ...selectedNode, name: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Node Code</label>
                                                    <input
                                                        type="text"
                                                        value={selectedNode.code}
                                                        onChange={(e) => setSelectedNode({ ...selectedNode, code: e.target.value.toUpperCase() })}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                                                    <select
                                                        value={selectedNode.category || ""}
                                                        onChange={(e) => setSelectedNode({ ...selectedNode, category: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                                    >
                                                        <option value="EQUIPMENT">Equipment</option>
                                                        <option value="SYSTEM">System</option>
                                                        <option value="SPACE">Space</option>
                                                        <option value="STRUCTURE">Structure</option>
                                                        <option value="OTHER">Other</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Node Type</label>
                                                    <input
                                                        type="text"
                                                        value={selectedNode.node_type || ""}
                                                        onChange={(e) => setSelectedNode({ ...selectedNode, node_type: e.target.value })}
                                                        placeholder="e.g. diesel_engine"
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                                    <textarea
                                                        value={selectedNode.description || ""}
                                                        onChange={(e) => setSelectedNode({ ...selectedNode, description: e.target.value })}
                                                        rows={3}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        {/* Node Particulars (Specs) */}
                                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="w-4 h-4 text-slate-400" />
                                                    <h3 className="font-semibold text-slate-800">Technical Specifications (Specs)</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={addParticular}
                                                        className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase rounded hover:bg-slate-50 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add spec
                                                    </button>
                                                    <button
                                                        onClick={handleSaveParticulars}
                                                        disabled={isSavingParticulars}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                                    >
                                                        <Save className="w-3.5 h-3.5" />
                                                        {isSavingParticulars ? "Saving..." : "Save Particulars"}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                {nodeParticulars.length === 0 ? (
                                                    <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                                        <p className="text-sm text-slate-400">No particulars defined for this component.</p>
                                                        <button
                                                            onClick={addParticular}
                                                            className="mt-2 text-xs text-primary font-semibold hover:underline"
                                                        >
                                                            Add your first technical specification
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {nodeParticulars.map((p, idx) => (
                                                            <div key={idx} className="group flex items-start gap-2 p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-slate-200 transition-all">
                                                                <div className="grid grid-cols-12 gap-2 flex-1">
                                                                    <div className="col-span-3">
                                                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Title</label>
                                                                        <input
                                                                            type="text"
                                                                            value={p.attr_title}
                                                                            onChange={(e) => updateParticular(idx, "attr_title", e.target.value)}
                                                                            onBlur={(e) => {
                                                                                if (!p.attr_key) {
                                                                                    const key = e.target.value.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
                                                                                    updateParticular(idx, "attr_key", key);
                                                                                }
                                                                            }}
                                                                            placeholder="e.g. Material"
                                                                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Value</label>
                                                                        <input
                                                                            type="text"
                                                                            value={p.attr_value || ""}
                                                                            onChange={(e) => updateParticular(idx, "attr_value", e.target.value)}
                                                                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Unit</label>
                                                                        <input
                                                                            type="text"
                                                                            value={p.unit || ""}
                                                                            onChange={(e) => updateParticular(idx, "unit", e.target.value)}
                                                                            placeholder="e.g. mm"
                                                                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Type</label>
                                                                        <select
                                                                            value={p.data_type}
                                                                            onChange={(e) => updateParticular(idx, "data_type", e.target.value)}
                                                                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                                        >
                                                                            <option value="text">Text</option>
                                                                            <option value="integer">Integer</option>
                                                                            <option value="decimal">Decimal</option>
                                                                            <option value="boolean">Boolean</option>
                                                                            <option value="selection">Selection</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Key</label>
                                                                        <input
                                                                            type="text"
                                                                            value={p.attr_key}
                                                                            onChange={(e) => updateParticular(idx, "attr_key", e.target.value)}
                                                                            className="w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-[10px] focus:outline-none"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-1 flex items-end justify-center pb-1">
                                                                        <button
                                                                            onClick={() => removeParticular(idx)}
                                                                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-20 shadow-sm">
                                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                    <Settings2 size={32} className="text-slate-200" />
                                </div>
                                <h3 className="text-slate-600 font-bold mb-2">Technical Specification</h3>
                                <p className="text-xs text-slate-400 max-w-sm">
                                    Select equipment from the tree to view its detailed technical
                                    specifications and recorded particulars.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Node Modal */}
            {showAddNodeModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">Add Custom Equipment</h3>
                            <button onClick={() => setShowAddNodeModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddNode} className="p-6 space-y-4">
                            {availableTemplateNodes.length > 0 ? (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Standard Children</label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={newNodeData.templateNodeId || ""}
                                        onChange={e => setNewNodeData({ ...newNodeData, templateNodeId: parseInt(e.target.value) })}
                                    >
                                        <option value="">Select a template node...</option>
                                        {availableTemplateNodes.map(tn => (
                                            <option key={tn.id} value={tn.id}>
                                                [{tn.code}] {tn.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-slate-400 px-1 pt-1">Selecting a standard node will automatically copy its technical particulars.</p>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-semibold mb-4">
                                    No standard children defined in template for this level.
                                    Switch to "Custom" mode to add nodes manually.
                                </div>
                            )}

                            {(availableTemplateNodes.length === 0 || !activeBreakdown.template_id) && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Node Code</label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="e.g. ME-01"
                                            value={newNodeData.code}
                                            onChange={e => setNewNodeData({ ...newNodeData, code: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="e.g. Main Engine #1"
                                            value={newNodeData.name}
                                            onChange={e => setNewNodeData({ ...newNodeData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Category</label>
                                        <select
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={newNodeData.category}
                                            onChange={e => setNewNodeData({ ...newNodeData, category: e.target.value })}
                                        >
                                            <option value="EQUIPMENT">Equipment</option>
                                            <option value="HULL">Hull Section</option>
                                            <option value="SYSTEM">System</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddNodeModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all"
                                >
                                    Add Component
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
