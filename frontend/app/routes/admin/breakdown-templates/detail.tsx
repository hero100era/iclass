import { useLoaderData, useSubmit, useNavigation, useActionData, Link } from "react-router";
import { getDb } from "~/.server/lib/api";
import { useState, useEffect } from "react";
import { Plus, Settings2, ArrowLeft, Layers, Save, X } from "lucide-react";

import { TemplateTree } from "./components/TemplateTree";
import { TemplateNodeEditor } from "./components/TemplateNodeEditor";
import { TemplateAddNodeModal } from "./components/TemplateAddNodeModal";

export const handle = { fluid: true };

export async function loader({ request, params }: any) {
  const db = await getDb(request);
  const [{ data: templates }, { data: nodes }] = await Promise.all([
    db.get<any[]>("/breakdown_templates", { filters: { id: `eq.${params.id}` } }),
    db.get<any[]>("/breakdown_template_nodes", { filters: { template_id: `eq.${params.id}` }, order: "sort_order.asc" }),
  ]);
  if (!templates?.[0]) throw new Response("Template not found", { status: 404 });
  return { template: templates[0], nodes: nodes || [] };
}

export async function action({ request, params }: any) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const db = await getDb(request);

  if (intent === "save_node") {
    const id = formData.get("id");
    const data = {
      template_id: Number(params.id),
      parent_node_id: formData.get("parent_node_id") ? Number(formData.get("parent_node_id")) : null,
      code: formData.get("code"),
      name: formData.get("name"),
      category: formData.get("category"),
      node_type: formData.get("node_type"),
      level: Number(formData.get("level") || 0),
    };
    if (id) await db.patch("/breakdown_template_nodes", { filters: { id: `eq.${id}` }, body: data });
    else await db.post("/breakdown_template_nodes", { body: data });
    return { success: true };
  }

  if (intent === "delete_node") {
    await db.delete("/breakdown_template_nodes", { filters: { id: `eq.${formData.get("id")}` } });
    return { success: true };
  }

  if (intent === "save_particulars") {
    const nodeId = formData.get("node_id");
    const particulars = JSON.parse(formData.get("particulars") as string);
    await db.delete("/breakdown_template_node_particulars", { filters: { template_node_id: `eq.${nodeId}` } });
    if (particulars.length > 0) {
      await db.post("/breakdown_template_node_particulars", { body: particulars.map((p: any) => ({ ...p, template_node_id: Number(nodeId) })) });
    }
    return { success: true };
  }
  return { error: "Unknown action" };
}

export default function TemplateTreeAdmin() {
  const { template, nodes } = useLoaderData<typeof loader>();
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [particulars, setParticulars] = useState<any[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalProps, setAddModalProps] = useState({ parentId: null as number | null, level: 0 });

  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();

  useEffect(() => {
    if (selectedNode) {
      // Typically we'd fetch particulars here or they'd be in the loader
      // For now, assume we're rebuilding from the local state or loader
    }
  }, [selectedNode]);

  const buildTree = (flat: any[], pid: number | null = null): any[] =>
    flat.filter(n => n.parent_node_id === pid).sort((a, b) => a.sort_order - b.sort_order).map(n => ({ ...n, children: buildTree(flat, n.id) }));

  const rootNodes = buildTree(nodes);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/breakdown-templates" className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Layers size={18} className="text-emerald-600" /> Structure: {template.name}</h1>
            <p className="text-xs text-slate-500">Manage hierarchical nodes and technical properties.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        <div className="col-span-4 bg-white border rounded-2xl p-4 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase">Tree Hierarchy</h3>
            <button onClick={() => { setAddModalProps({ parentId: null, level: 0 }); setShowAddModal(true); }} className="text-[10px] font-bold text-emerald-600 hover:underline">+ Add Root</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TemplateTree
              nodes={rootNodes}
              selectedNodeId={selectedNode?.id}
              expandedNodes={expandedNodes}
              onSelect={setSelectedNode}
              onToggleExpand={(id) => { const next = new Set(expandedNodes); if (next.has(id)) next.delete(id); else next.add(id); setExpandedNodes(next); }}
              onAddChild={(node) => { setAddModalProps({ parentId: node.id, level: node.level + 1 }); setShowAddModal(true); }}
              onCopy={(id) => submit({ intent: "copy_node", id: id.toString() }, { method: "post" })}
              onDelete={(id) => confirm("Delete node?") && submit({ intent: "delete_node", id: id.toString() }, { method: "post" })}
            />
          </div>
        </div>

        <div className="col-span-8 bg-white border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {selectedNode ? (
            <TemplateNodeEditor
              node={selectedNode}
              particulars={particulars}
              isSavingInfo={navigation.state === "submitting" && navigation.formData?.get("intent") === "save_node"}
              isSavingParticulars={navigation.state === "submitting" && navigation.formData?.get("intent") === "save_particulars"}
              onUpdateNode={setSelectedNode}
              onSaveNode={() => submit({ intent: "save_node", ...selectedNode }, { method: "post" })}
              onUpdateParticulars={setParticulars}
              onSaveParticulars={() => submit({ intent: "save_particulars", node_id: selectedNode.id.toString(), particulars: JSON.stringify(particulars) }, { method: "post" })}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
              <Settings2 size={48} className="mb-4" />
              <p className="text-sm font-bold">Select a node to edit</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <TemplateAddNodeModal
          parentId={addModalProps.parentId}
          level={addModalProps.level}
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => {
            submit({ intent: "save_node", ...data }, { method: "post" });
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
