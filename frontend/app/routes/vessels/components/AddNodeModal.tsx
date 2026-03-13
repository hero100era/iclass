import { X } from "lucide-react";

interface TemplateNode {
    id: number;
    parent_node_id: number | null;
    template_id: number;
    code: string;
    name: string;
}

import type { NewNodeData } from "../breakdowns.types";

interface AddNodeModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    availableTemplateNodes: TemplateNode[];
    newNodeData: NewNodeData;
    setNewNodeData: (data: NewNodeData) => void;
    hasTemplate: boolean;
}

export function AddNodeModal({
    show,
    onClose,
    onSubmit,
    availableTemplateNodes,
    newNodeData,
    setNewNodeData,
    hasTemplate
}: AddNodeModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Add Equipment Node</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    {availableTemplateNodes.length > 0 ? (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                Standard Children
                            </label>
                            <select
                                required
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                value={newNodeData.templateNodeId || ""}
                                onChange={(e) => setNewNodeData({ ...newNodeData, templateNodeId: parseInt(e.target.value) })}
                            >
                                <option value="">Select a template node...</option>
                                {availableTemplateNodes.map((tn) => (
                                    <option key={tn.id} value={tn.id}>[{tn.code}] {tn.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : hasTemplate && (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-semibold mb-4">
                            No standard children defined in template for this level.
                        </div>
                    )}

                    {(!newNodeData.templateNodeId || !hasTemplate) && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Code</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="e.g. ME-01"
                                    value={newNodeData.code}
                                    onChange={(e) => setNewNodeData({ ...newNodeData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="e.g. Main Engine #1"
                                    value={newNodeData.name}
                                    onChange={(e) => setNewNodeData({ ...newNodeData, name: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
                        >
                            Add Component
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
