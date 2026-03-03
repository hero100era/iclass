import { useLoaderData, useSubmit, useNavigation, useActionData, Link } from "react-router";
import { ApiGET, ApiPOST, ApiPATCH, ApiDELETE } from "~/.server/lib/api";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, Settings2, Save, X, Layers, ArrowLeft, Info, Copy } from "lucide-react";
import { cn } from "~/lib/utils";

export const handle = { fluid: true };

interface BreakdownNode {
  id: number;
  template_id: number;
  parent_node_id: number | null;
  code: string;
  name: string;
  category?: string;
  node_type?: string;
  sort_order: number;
  level: number;
  children?: BreakdownNode[];
}

interface LoaderArgs {
  request: Request;
  params: { id: string };
}

interface ActionArgs {
  request: Request;
  params: { id: string };
}

export async function loader({ request, params }: LoaderArgs) {
  const host = process.env.API_URL || "http://localhost:2000";
  const { id } = params;

  const [tmplRes, treeRes, particularsRes] = await Promise.all([
    ApiGET(request, `${host}/breakdown_templates?id=eq.${id}`),
    ApiGET(request, `${host}/v_template_tree?template_id=eq.${id}&order=sort_order.asc`),
    ApiGET(request, `${host}/breakdown_template_node_particulars?template_id=eq.${id}&order=sort_order.asc`)
  ]);

  if (!tmplRes.ok) throw new Response("Template not found", { status: 404 });
  const templates = await tmplRes.ok ? await tmplRes.json() : [];
  if (!templates || templates.length === 0) throw new Response("Template not found", { status: 404 });

  const treeData = treeRes.ok ? await treeRes.json() : [];
  const particularsData = particularsRes.ok ? await particularsRes.json() : [];

  return {
    template: templates[0],
    tree: treeData,
    allParticulars: particularsData,
    host
  };
}

export async function action({ request, params }: ActionArgs) {
  const host = process.env.API_URL || "http://localhost:2000";
  const formData = await request.formData();
  const intent = formData.get("intent");
  const templateId = params.id;

  if (intent === "save_node") {
    const id = formData.get("id");
    const parent_node_id = formData.get("parent_node_id");
    const code = formData.get("code");
    const name = formData.get("name");
    const category = formData.get("category");
    const node_type = formData.get("node_type");
    const description = formData.get("description");
    const sort_order = parseInt(formData.get("sort_order") as string) || 0;
    const level = parseInt(formData.get("level") as string) || 0;

    const data: Record<string, unknown> = {
      template_id: parseInt(templateId),
      code, name, description, category, node_type, sort_order, level
    };
    if (parent_node_id) data.parent_node_id = parseInt(parent_node_id as string);

    if (id) {
      const res = await ApiPATCH(request, `${host}/breakdown_template_nodes?id=eq.${id}`, data);
      return { success: res.ok };
    } else {
      const res = await ApiPOST(request, `${host}/breakdown_template_nodes`, data);
      return { success: res.ok };
    }
  }

  if (intent === "delete_node") {
    const id = formData.get("id");
    const res = await ApiDELETE(request, `${host}/breakdown_template_nodes?id=eq.${id}`);
    return { success: res.ok };
  }

  if (intent === "copy_node") {
    const id = formData.get("id");
    const res = await ApiPOST(request, `${host}/rpc/fn_copy_breakdown_template_node`, {
      p_source_node_id: parseInt(id as string)
    });
    return { success: res.ok };
  }

  if (intent === "save_particulars") {
    const nodeId = formData.get("node_id");
    const particularsJson = formData.get("particulars");
    let particulars: Record<string, unknown>[] = [];
    try {
      particulars = JSON.parse(particularsJson as string);
    } catch {
      return { success: false, error: "Invalid particulars format" };
    }

    // Simplistic sync: delete existing and insert new (or use UPSERT if supported)
    await ApiDELETE(request, `${host}/breakdown_template_node_particulars?template_node_id=eq.${nodeId}`);
    if (particulars.length > 0) {
      const dataToInsert = particulars.map((p) => {
        const { id: _unused, ...pData } = p as { id?: number; [key: string]: unknown };
        // The underscore prefix tells ESLint this is intentionally unused
        void _unused;
        return {
          ...pData,
          template_node_id: parseInt(nodeId as string)
        };
      });
      await ApiPOST(request, `${host}/breakdown_template_node_particulars`, dataToInsert);
    }
    return { success: true, intent: "save_particulars" };
  }

  return { error: "Unknown action" };
}

interface Template {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface Particular {
  id?: number;
  template_node_id?: number;
  attr_key: string;
  attr_title: string;
  data_type: string;
  sort_order: number;
  [key: string]: unknown;
}

export default function TemplateTreeAdmin() {
  const { template, tree, allParticulars } = useLoaderData<typeof loader>();
  const [selectedNode, setSelectedNode] = useState<BreakdownNode | null>(null);
  const [nodeParticulars, setNodeParticulars] = useState<Particular[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const prevSelectedNodeIdRef = useRef<number | undefined>(undefined);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newNodeData, setNewNodeData] = useState({ parentId: null as number | null, level: 0, code: "", name: "", category: "EQUIPMENT", node_type: "" });

  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();

  const isSavingParticulars = navigation.state === "submitting" && navigation.formData?.get("intent") === "save_particulars";
  const isSavingNode = navigation.state === "submitting" && navigation.formData?.get("intent") === "save_node";

  useEffect(() => {
    if (selectedNode && selectedNode.id !== prevSelectedNodeIdRef.current) {
      const nodeParts = allParticulars.filter((p: { template_node_id?: number }) => p.template_node_id === selectedNode.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNodeParticulars(nodeParts);
      prevSelectedNodeIdRef.current = selectedNode.id;
    }
  }, [allParticulars, selectedNode]);

  // Build hierarchical tree structure from flat list
  const buildTree = (nodes: BreakdownNode[], parentId: number | null = null): BreakdownNode[] => {
    return nodes
      .filter(n => n.parent_node_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
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

  const handleSelectNode = (node: BreakdownNode) => {
    setSelectedNode(node);
  };

  const handleAddNode = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("intent", "save_node");
    if (newNodeData.parentId) formData.append("parent_node_id", newNodeData.parentId.toString());
    formData.append("code", newNodeData.code);
    formData.append("name", newNodeData.name);
    formData.append("category", newNodeData.category);
    formData.append("node_type", newNodeData.node_type);
    formData.append("level", newNodeData.level.toString());
    formData.append("sort_order", "0");
    submit(formData, { method: "post" });
    setShowAddModal(false);
    setNewNodeData({ parentId: null, level: 0, code: "", name: "", category: "EQUIPMENT", node_type: "" });
  };

  const handleDeleteNode = (id: number) => {
    if (!confirm("Delete this node and all its children?")) return;
    const formData = new FormData();
    formData.append("intent", "delete_node");
    formData.append("id", id.toString());
    submit(formData, { method: "post" });
    if (selectedNode?.id === id) {
      setSelectedNode(null);
      setNodeParticulars([]);
    }
  };

  const handleCopyNode = (id: number) => {
    if (!confirm("Create a copy of this node and all its children?")) return;
    const formData = new FormData();
    formData.append("intent", "copy_node");
    formData.append("id", id.toString());
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

  const handleSaveNodeProperties = () => {
    if (!selectedNode) return;
    const formData = new FormData();
    formData.append("intent", "save_node");
    formData.append("id", selectedNode.id.toString());
    formData.append("template_id", (template as Template).id.toString());
    if (selectedNode.parent_node_id) formData.append("parent_node_id", selectedNode.parent_node_id.toString());
    formData.append("code", selectedNode.code);
    formData.append("name", selectedNode.name);
    formData.append("description", (selectedNode as BreakdownNode & { description?: string }).description || "");
    formData.append("category", selectedNode.category || "");
    formData.append("node_type", selectedNode.node_type || "");
    formData.append("sort_order", selectedNode.sort_order.toString());
    formData.append("level", selectedNode.level.toString());
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

  const updateParticular = (idx: number, field: string, value: unknown) => {
    const next = [...nodeParticulars];
    next[idx] = { ...next[idx], [field]: value };
    setNodeParticulars(next);
  };

  const removeParticular = (idx: number) => {
    const next = [...nodeParticulars];
    next.splice(idx, 1);
    setNodeParticulars(next);
  };

  // Recursive Tree Renderer
  const renderTreeNode = (node: BreakdownNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "group flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all",
            isSelected ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50 text-slate-600"
          )}
          onClick={() => handleSelectNode(node)}
        >
          <div
            className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-emerald-500"
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
            <span className="text-[10px] font-mono font-bold text-slate-300 group-hover:text-emerald-300">{node.code}</span>
            <span className="text-xs font-semibold truncate">{node.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewNodeData({ ...newNodeData, parentId: node.id, level: node.level + 1 });
                setShowAddModal(true);
              }}
              className="p-1 hover:bg-emerald-100 rounded text-emerald-600"
              title="Add Child"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleCopyNode(node.id); }}
              className="p-1 hover:bg-amber-100 rounded text-amber-600"
              title="Copy Node"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
              className="p-1 hover:bg-destructive/10 rounded text-destructive"
              title="Delete Node"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-4 border-l border-slate-100 pl-2 mt-1 space-y-0.5">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/breakdown-templates"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-emerald-600" />
              Structure: {(template as Template).name}
            </h1>
            <p className="text-xs text-slate-500">Define the hierarchical tree and properties for this breakdown template.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
        {/* Tree Sidebar */}
        <div className="col-span-4 flex flex-col gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hierarchy Tree</h3>
            <button
              onClick={() => {
                setNewNodeData({ ...newNodeData, parentId: null, level: 0 });
                setShowAddModal(true);
              }}
              className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Add Root
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-1">
              {rootNodes.map(node => renderTreeNode(node))}
              {tree.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic text-xs">
                  No nodes defined yet. Add a root node to start.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Node Editor */}
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
                <div className="p-4 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-600 font-semibold flex items-center gap-2">
                  <Save size={14} /> Changes saved successfully.
                </div>
              )}

              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase">
                    <span>Template Node</span>
                    <span>/</span>
                    <span className="text-emerald-600 font-bold">{selectedNode.code}</span>
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
                        onClick={handleSaveNodeProperties}
                        disabled={isSavingNode}
                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
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
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Node Code</label>
                        <input
                          type="text"
                          value={selectedNode.code}
                          onChange={(e) => setSelectedNode({ ...selectedNode, code: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                        <select
                          value={selectedNode.category || ""}
                          onChange={(e) => setSelectedNode({ ...selectedNode, category: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
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
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                        <textarea
                          value={(selectedNode as BreakdownNode & { description?: string }).description || ""}
                          onChange={(e) => setSelectedNode({ ...selectedNode, description: e.target.value } as BreakdownNode)}
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm resize-none"
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
                          className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-md hover:shadow-slate-200 transition-colors disabled:opacity-50"
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
                            className="mt-2 text-xs text-emerald-600 font-semibold hover:underline"
                          >
                            Add your first technical specification
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {nodeParticulars.map((p, idx) => (
                            <div key={idx} className="group flex items-start gap-2 p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-slate-200 transition-all">
                              <div className="grid grid-cols-12 gap-2 flex-1">
                                <div className="col-span-3">
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Key Code</label>
                                  <input
                                    type="text"
                                    value={p.attr_key}
                                    onChange={(e) => updateParticular(idx, "attr_key", e.target.value.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, ''))}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Display Title</label>
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
                                    placeholder="Serial Number"
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Data Type</label>
                                  <select
                                    value={p.data_type}
                                    onChange={(e) => updateParticular(idx, "data_type", e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                  >
                                    <option value="text">Text</option>
                                    <option value="integer">Integer</option>
                                    <option value="decimal">Decimal</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="date">Date</option>
                                    <option value="selection">Selection</option>
                                  </select>
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
              <h3 className="text-slate-600 font-bold mb-2">Configure breakdown nodes</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Select a node from the tree on the left to edit its classification
                and define standard technical properties for this template.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Add Template Node</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddNode} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Node Code</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  placeholder="e.g. ME-01"
                  value={newNodeData.code}
                  onChange={e => setNewNodeData({ ...newNodeData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  placeholder="e.g. Main Engine #1"
                  value={newNodeData.name}
                  onChange={e => setNewNodeData({ ...newNodeData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Category</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={newNodeData.category}
                  onChange={e => setNewNodeData({ ...newNodeData, category: e.target.value })}
                >
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="SYSTEM">System</option>
                  <option value="SPACE">Space</option>
                  <option value="STRUCTURE">Structure</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Node Type</label>
                <input
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  placeholder="e.g. diesel_engine"
                  value={newNodeData.node_type}
                  onChange={e => setNewNodeData({ ...newNodeData, node_type: e.target.value })}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all"
                >
                  Add Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
