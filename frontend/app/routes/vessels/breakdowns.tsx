import {
  useLoaderData,
  useSubmit,
  useNavigation,
  useRevalidator,
  useActionData,
  Link,
} from "react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Network,
  RefreshCcw,
  ArrowLeft,
  Layers,
  ChevronRight,
  Plus,
  Settings2,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type { Ship } from "~/definitions/database.iclass.types";

import { loader, action } from "./breakdowns.server";
import { BreakdownTree } from "./components/BreakdownTree";
import { NodeEditor } from "./components/NodeEditor";
import { AddNodeModal } from "./components/AddNodeModal";

export { loader, action };
export const handle = { fluid: true };

interface BreakdownNode {
  id: number;
  parent_node_id: number | null;
  code: string;
  name: string;
  category?: string;
  node_type?: string;
  description?: string;
  sort_order?: number;
  template_node_id?: number;
  is_modified?: boolean;
  children?: BreakdownNode[];
}

interface Particular {
  id?: number;
  ship_breakdown_node_id?: number;
  attr_key: string;
  attr_title: string;
  attr_value: string | null | undefined;
  data_type: string;
  unit: string | null;
  sort_order: number;
}

export default function VesselBreakdown() {
  const { vessel, activeBreakdown, tree, allParticulars, templates, templateNodes, vesselId } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const actionData = useActionData<typeof action>();

  const [selectedNode, setSelectedNode] = useState<BreakdownNode | null>(null);
  const [editingNode, setEditingNode] = useState<BreakdownNode | null>(null);
  const [editingParticulars, setEditingParticulars] = useState<Particular[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeData, setNewNodeData] = useState({
    parentId: null as number | null,
    parentTemplateNodeId: null as number | null,
    code: "",
    name: "",
    category: "EQUIPMENT",
    templateNodeId: null as number | null,
  });

  const isSavingNode = navigation.state === "submitting" && navigation.formData?.get("intent") === "update_node_info";
  const isSavingParticulars = navigation.state === "submitting" && navigation.formData?.get("intent") === "save_particulars";

  // Sync editing state with selected node
  useEffect(() => {
    if (selectedNode) {
      setEditingNode({ ...selectedNode });
      const particulars = (allParticulars as unknown as Particular[]).filter(
        (p) => p.ship_breakdown_node_id === selectedNode.id
      );
      setEditingParticulars(particulars);
    } else {
      setEditingNode(null);
      setEditingParticulars([]);
    }
  }, [selectedNode, allParticulars]);

  // Refresh tree after success
  useEffect(() => {
    if (actionData?.success && navigation.state === "idle") {
      revalidator.revalidate();
    }
  }, [actionData, navigation.state, revalidator]);

  const treeStructure = useMemo(() => {
    const build = (nodes: any[], parentId: number | null = null): any[] => {
      return nodes
        .filter((n) => n.parent_node_id === parentId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((n) => ({ ...n, children: build(nodes, n.id) }));
    };
    return build(tree);
  }, [tree]);

  const availableTemplateNodes = useMemo(() => {
    if (!showAddNodeModal) return [];
    if (newNodeData.parentTemplateNodeId) {
      return templateNodes.filter((tn: any) => tn.parent_node_id === newNodeData.parentTemplateNodeId);
    }
    if (!newNodeData.parentId && activeBreakdown?.template_id) {
      return templateNodes.filter((tn: any) => tn.template_id === activeBreakdown.template_id && !tn.parent_node_id);
    }
    return [];
  }, [showAddNodeModal, newNodeData, activeBreakdown, templateNodes]);

  const handleApplyTemplate = (templateId: number) => {
    if (!confirm("This will replace current breakdown. Continue?")) return;
    submit({ intent: "apply_template", template_id: templateId.toString() }, { method: "post" });
  };

  const handleCreateManualBreakdown = () => {
    submit({ intent: "create_manual_breakdown" }, { method: "post" });
  };

  const handleSaveNodeInfo = () => {
    if (!editingNode) return;
    submit({ intent: "update_node_info", ...editingNode } as any, { method: "post" });
  };

  const handleSaveParticulars = () => {
    if (!selectedNode) return;
    submit({
      intent: "save_particulars",
      node_id: selectedNode.id.toString(),
      particulars: JSON.stringify(editingParticulars)
    }, { method: "post" });
  };

  const handleDeleteNode = (id: number) => {
    if (!confirm("Delete node and children?")) return;
    submit({ intent: "delete_node", id: id.toString() }, { method: "post" });
    if (selectedNode?.id === id) setSelectedNode(null);
  };

  const handleCopyNode = (id: number) => {
    if (!confirm("Copy node and children?")) return;
    submit({ intent: "copy_node", id: id.toString() }, { method: "post" });
  };

  const handleAddNodeSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const intent = newNodeData.templateNodeId ? "add_template_node" : "add_custom_node";
    const data: any = { intent, ...newNodeData, breakdown_id: activeBreakdown?.id.toString() };
    submit(data, { method: "post" });
    setShowAddNodeModal(false);
    setNewNodeData({ parentId: null, parentTemplateNodeId: null, code: "", name: "", category: "EQUIPMENT", templateNodeId: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/vessels/${vesselId}`} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Network size={18} className="text-primary" />
              Breakdown: {vessel?.name}
            </h1>
            <p className="text-xs text-slate-500">Equipment hierarchy and technical particulars.</p>
          </div>
        </div>
        {activeBreakdown && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
              Rev: {activeBreakdown.revision}
            </span>
            <button onClick={() => revalidator.revalidate()} className="p-2 text-slate-400 hover:text-primary rounded-full">
              <RefreshCcw size={16} />
            </button>
          </div>
        )}
      </div>

      {!activeBreakdown ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-2xl mx-auto mt-10 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <Layers size={40} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Configure Breakdown Structure</h2>
          <p className="text-sm text-slate-500 mb-8">Select a template to initialize hierarchy.</p>
          <div className="space-y-3 text-left max-w-md mx-auto">
            <button onClick={handleCreateManualBreakdown} className="w-full p-4 bg-white border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Manual Initialization</span>
              <Plus size={16} className="text-slate-300" />
            </button>
            {templates.map((tmpl: any) => (
              <button key={tmpl.id} onClick={() => handleApplyTemplate(tmpl.id)} className="w-full p-4 bg-white border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700">{tmpl.name}</div>
                  <div className="text-[10px] text-slate-400">{tmpl.vessel_type} v{tmpl.version}</div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6 min-h-[600px]">
          <div className="col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-full overflow-hidden">
            <BreakdownTree
              rootNodes={treeStructure}
              selectedNodeId={selectedNode?.id}
              expandedNodes={expandedNodes}
              onSelect={setSelectedNode}
              onToggleExpand={(id) => {
                const next = new Set(expandedNodes);
                if (next.has(id)) next.delete(id); else next.add(id);
                setExpandedNodes(next);
              }}
              onAddChild={(node) => {
                setNewNodeData({ ...newNodeData, parentId: node.id, parentTemplateNodeId: node.template_node_id || null });
                setShowAddNodeModal(true);
              }}
              onCopy={handleCopyNode}
              onDelete={handleDeleteNode}
              onAddCustom={() => {
                setNewNodeData({ ...newNodeData, parentId: null, parentTemplateNodeId: null });
                setShowAddNodeModal(true);
              }}
            />
          </div>
          <div className="col-span-8 h-full">
            {editingNode ? (
              <NodeEditor
                selectedNode={editingNode}
                setSelectedNode={setEditingNode}
                particulars={editingParticulars}
                setParticulars={setEditingParticulars}
                onSaveInfo={handleSaveNodeInfo}
                onSaveParticulars={handleSaveParticulars}
                isSavingNode={isSavingNode}
                isSavingParticulars={isSavingParticulars}
              />
            ) : (
              <div className="h-full bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-20 shadow-sm">
                <Settings2 size={48} className="text-slate-100 mb-4" />
                <h3 className="text-slate-600 font-bold mb-2">Technical Specification</h3>
                <p className="text-xs text-slate-400">Select equipment from the tree to view details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <AddNodeModal
        show={showAddNodeModal}
        onClose={() => setShowAddNodeModal(false)}
        onSubmit={handleAddNodeSubmit}
        availableTemplateNodes={availableTemplateNodes}
        newNodeData={newNodeData}
        setNewNodeData={setNewNodeData}
        hasTemplate={!!activeBreakdown?.template_id}
      />
    </div>
  );
}
