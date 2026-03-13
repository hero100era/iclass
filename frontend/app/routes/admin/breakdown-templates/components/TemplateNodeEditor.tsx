import { Info, Save, Layers, Plus, X } from "lucide-react";

interface Particular {
    id?: number;
    template_node_id?: number;
    attr_key: string;
    attr_title: string;
    data_type: string;
    sort_order: number;
}

interface TemplateNodeEditorProps {
    node: any;
    particulars: Particular[];
    isSavingInfo: boolean;
    isSavingParticulars: boolean;
    onUpdateNode: (node: any) => void;
    onSaveNode: () => void;
    onUpdateParticulars: (parts: Particular[]) => void;
    onSaveParticulars: () => void;
}

export function TemplateNodeEditor({
    node,
    particulars,
    isSavingInfo,
    isSavingParticulars,
    onUpdateNode,
    onSaveNode,
    onUpdateParticulars,
    onSaveParticulars,
}: TemplateNodeEditorProps) {
    const addParticular = () => {
        onUpdateParticulars([...particulars, {
            attr_key: "",
            attr_title: "",
            data_type: "text",
            sort_order: particulars.length * 10
        }]);
    };

    const updateParticular = (idx: number, field: string, value: any) => {
        const next = [...particulars];
        next[idx] = { ...next[idx], [field]: value };
        onUpdateParticulars(next);
    };

    const removeParticular = (idx: number) => {
        onUpdateParticulars(particulars.filter((_, i) => i !== idx));
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Node Config */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-slate-400" />
                        <h3 className="font-semibold text-slate-800 text-sm">Node Configuration</h3>
                    </div>
                    <button onClick={onSaveNode} disabled={isSavingInfo} className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 disabled:opacity-50">
                        {isSavingInfo ? "Saving..." : "Save Info"}
                    </button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Name</label>
                        <input className="w-full px-3 py-2 bg-slate-50 border rounded text-sm" value={node.name} onChange={e => onUpdateNode({ ...node, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Code</label>
                        <input className="w-full px-3 py-2 bg-slate-50 border rounded text-sm font-mono" value={node.code} onChange={e => onUpdateNode({ ...node, code: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                        <select className="w-full px-3 py-2 bg-slate-50 border rounded text-sm" value={node.category || ""} onChange={e => onUpdateNode({ ...node, category: e.target.value })}>
                            <option value="EQUIPMENT">Equipment</option>
                            <option value="SYSTEM">System</option>
                            <option value="SPACE">Space</option>
                            <option value="STRUCTURE">Structure</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Node Type</label>
                        <input className="w-full px-3 py-2 bg-slate-50 border rounded text-sm" value={node.node_type || ""} onChange={e => onUpdateNode({ ...node, node_type: e.target.value })} />
                    </div>
                </div>
            </section>

            {/* Specs Section */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <h3 className="font-semibold text-slate-800 text-sm">Technical Specifications</h3>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={addParticular} className="px-2 py-1 bg-white border text-[10px] font-bold uppercase rounded">Add Spec</button>
                        <button onClick={onSaveParticulars} disabled={isSavingParticulars} className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded disabled:opacity-50">
                            {isSavingParticulars ? "Saving..." : "Save Specs"}
                        </button>
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    {particulars.map((p, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg border">
                            <div className="col-span-3">
                                <label className="block text-[8px] font-bold text-slate-400 uppercase">Key</label>
                                <input className="w-full px-2 py-1 border rounded text-[10px] font-mono" value={p.attr_key} onChange={e => updateParticular(idx, "attr_key", e.target.value)} />
                            </div>
                            <div className="col-span-5">
                                <label className="block text-[8px] font-bold text-slate-400 uppercase">Title</label>
                                <input className="w-full px-2 py-1 border rounded text-[10px] font-bold" value={p.attr_title} onChange={e => updateParticular(idx, "attr_title", e.target.value)} />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-[8px] font-bold text-slate-400 uppercase">Type</label>
                                <select className="w-full px-2 py-1 border rounded text-[10px]" value={p.data_type} onChange={e => updateParticular(idx, "data_type", e.target.value)}>
                                    <option value="text">Text</option>
                                    <option value="integer">Integer</option>
                                    <option value="decimal">Decimal</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="date">Date</option>
                                </select>
                            </div>
                            <div className="col-span-1 flex items-end justify-center">
                                <button onClick={() => removeParticular(idx)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                            </div>
                        </div>
                    ))}
                    {particulars.length === 0 && <p className="text-center py-4 text-xs text-slate-400">No specifications defined.</p>}
                </div>
            </section>
        </div>
    );
}
