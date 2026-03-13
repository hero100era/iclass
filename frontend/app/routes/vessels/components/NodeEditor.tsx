import { Info, Save, Layers, Plus, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";
import type { ShipBreakdownNodeParticular } from "~/definitions/database.iclass.types";

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

interface NodeEditorProps {
    selectedNode: any;
    setSelectedNode: (node: any) => void;
    particulars: Particular[];
    setParticulars: (p: Particular[]) => void;
    onSaveInfo: () => void;
    onSaveParticulars: () => void;
    isSavingNode: boolean;
    isSavingParticulars: boolean;
}

export function NodeEditor({
    selectedNode,
    setSelectedNode,
    particulars,
    setParticulars,
    onSaveInfo,
    onSaveParticulars,
    isSavingNode,
    isSavingParticulars,
}: NodeEditorProps) {
    const addParticular = () => {
        setParticulars([
            ...particulars,
            {
                ship_breakdown_node_id: selectedNode.id,
                attr_key: "",
                attr_title: "",
                attr_value: "",
                data_type: "text",
                unit: "",
                sort_order: particulars.length,
            },
        ]);
    };

    const updateParticular = (idx: number, field: string, value: string) => {
        const next = [...particulars];
        next[idx] = { ...next[idx], [field]: value };
        setParticulars(next);
    };

    const removeParticular = (idx: number) => {
        setParticulars(particulars.filter((_, i) => i !== idx));
    };

    return (
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
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

            {/* Main Editor */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8">
                    {/* Basic Info */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-slate-400" />
                                <h3 className="font-semibold text-slate-800">Node Configuration</h3>
                            </div>
                            <button
                                onClick={onSaveInfo}
                                disabled={isSavingNode}
                                className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-3.5 h-3.5" />
                                {isSavingNode ? "Saving..." : "Save Info"}
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Name</label>
                                <input
                                    type="text"
                                    value={selectedNode.name}
                                    onChange={(e) => setSelectedNode({ ...selectedNode, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Code</label>
                                <input
                                    type="text"
                                    value={selectedNode.code}
                                    onChange={(e) => setSelectedNode({ ...selectedNode, code: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                                />
                            </div>
                            {/* ... other fields ... */}
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                                <textarea
                                    value={selectedNode.description || ""}
                                    onChange={(e) => setSelectedNode({ ...selectedNode, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Particulars */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-slate-400" />
                                <h3 className="font-semibold text-slate-800">Technical Specifications</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={addParticular}
                                    className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase rounded hover:bg-slate-50"
                                >
                                    <Plus className="w-3 h-3" /> Add spec
                                </button>
                                <button
                                    onClick={onSaveParticulars}
                                    disabled={isSavingParticulars}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSavingParticulars ? "Saving..." : "Save Particulars"}
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            {particulars.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm italic">No specifications defined.</div>
                            ) : (
                                <div className="space-y-2">
                                    {particulars.map((p, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                            <div className="grid grid-cols-12 gap-2 flex-1">
                                                <div className="col-span-4">
                                                    <input
                                                        type="text"
                                                        value={p.attr_title}
                                                        onChange={(e) => updateParticular(idx, "attr_title", e.target.value)}
                                                        placeholder="Title"
                                                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                                                    />
                                                </div>
                                                <div className="col-span-4">
                                                    <input
                                                        type="text"
                                                        value={p.attr_value || ""}
                                                        onChange={(e) => updateParticular(idx, "attr_value", e.target.value)}
                                                        placeholder="Value"
                                                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="text"
                                                        value={p.unit || ""}
                                                        onChange={(e) => updateParticular(idx, "unit", e.target.value)}
                                                        placeholder="Unit"
                                                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                                                    />
                                                </div>
                                                <div className="col-span-2 flex justify-end">
                                                    <button
                                                        onClick={() => removeParticular(idx)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
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
    );
}
