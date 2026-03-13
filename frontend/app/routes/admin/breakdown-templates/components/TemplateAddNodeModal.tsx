import { X } from "lucide-react";
import { useState } from "react";

import type { NewNodeData } from "../breakdown-templates.types";

interface TemplateAddNodeModalProps {
    parentId: number | null;
    level: number;
    onClose: () => void;
    onSubmit: (data: NewNodeData) => void;
}

export function TemplateAddNodeModal({ parentId, level, onClose, onSubmit }: TemplateAddNodeModalProps) {
    const [data, setData] = useState({ code: "", name: "", category: "EQUIPMENT", node_type: "" });

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm italic">Add Template Node</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500"><X size={20} /></button>
                </div>
                <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...data, parentId, level }); }}>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Code</label>
                        <input required className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono" value={data.code} onChange={e => setData({ ...data, code: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Name</label>
                        <input required className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                        <select className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" value={data.category} onChange={e => setData({ ...data, category: e.target.value })}>
                            <option value="EQUIPMENT">Equipment</option>
                            <option value="SYSTEM">System</option>
                            <option value="SPACE">Space</option>
                            <option value="STRUCTURE">Structure</option>
                        </select>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-xl text-xs font-bold">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Add Node</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
