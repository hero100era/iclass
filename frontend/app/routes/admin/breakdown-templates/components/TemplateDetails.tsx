import { Settings2, Save, Layers, X, Network } from "lucide-react";
import { Link } from "react-router";

import type { BreakdownTemplateData } from "../index";

interface TemplateDetailsProps {
    template: BreakdownTemplateData | null;
    editForm: Partial<BreakdownTemplateData>;
    isEditing: boolean;
    isSubmitting: boolean;
    error?: string;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    onDelete: (id: number) => void;
    onFormUpdate: (form: Partial<BreakdownTemplateData>) => void;
}

export function TemplateDetails({
    template,
    editForm,
    isEditing,
    isSubmitting,
    error,
    onEdit,
    onCancel,
    onSave,
    onDelete,
    onFormUpdate,
}: TemplateDetailsProps) {
    const data = isEditing ? editForm : template;

    return (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Settings2 size={16} className="text-slate-400" />
                    {isEditing ? "Edit Template Info" : "Template Overview"}
                </h3>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={onCancel} className="text-xs font-bold text-slate-500">Cancel</button>
                            <button onClick={onSave} disabled={isSubmitting} className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded flex items-center gap-1.5">
                                <Save size={12} /> {isSubmitting ? "Saving..." : "Save Template"}
                            </button>
                        </>
                    ) : (
                        <>
                            {template && <button onClick={() => onDelete(template.id)} className="text-[11px] font-bold text-red-500 px-3 py-1 hover:bg-red-50 rounded">Delete</button>}
                            <button onClick={onEdit} className="text-[11px] font-bold text-slate-600 border px-3 py-1 rounded">Edit Info</button>
                            {template && <Link to={`/admin/breakdown-templates/${template.id}`} className="bg-primary text-white text-[11px] font-bold px-3 py-1 rounded flex items-center gap-1.5"><Layers size={12} /> Edit Tree</Link>}
                        </>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {error && <div className="p-3 bg-red-50 text-red-600 rounded text-xs flex items-center gap-2"><X size={14} />{error}</div>}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Code</label>
                        {isEditing ? <input className="w-full text-xs font-mono px-3 py-2 border rounded" value={data?.code || ""} onChange={e => onFormUpdate({ ...data!, code: e.target.value })} /> : <div className="text-xs font-mono font-bold bg-slate-50 p-2 border rounded">{data?.code}</div>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Vessel Type</label>
                        {isEditing ? <input className="w-full text-xs px-3 py-2 border rounded" value={data?.vessel_type || ""} onChange={e => onFormUpdate({ ...data!, vessel_type: e.target.value })} /> : <div className="text-xs font-medium bg-slate-50 p-2 border rounded">{data?.vessel_type || "-"}</div>}
                    </div>
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Template Name</label>
                        {isEditing ? <input className="w-full text-xs px-3 py-2 border rounded" value={data?.name || ""} onChange={e => onFormUpdate({ ...data!, name: e.target.value })} /> : <div className="text-xs font-bold bg-slate-50 p-2 border rounded">{data?.name}</div>}
                    </div>
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                        {isEditing ? <textarea rows={3} className="w-full text-xs px-3 py-2 border rounded" value={data?.description || ""} onChange={e => onFormUpdate({ ...data!, description: e.target.value })} /> : <div className="text-xs text-slate-600 bg-slate-50 p-2 border rounded whitespace-pre-wrap">{data?.description || "-"}</div>}
                    </div>
                </div>

                {(!isEditing && template) && (
                    <div className="mt-8 p-12 text-center bg-slate-50 border border-dashed rounded-2xl">
                        <Network size={32} className="mx-auto text-slate-300 mb-3" />
                        <h4 className="text-sm font-bold text-slate-600">Template Logic</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Standardize equipment reporting for this vessel type.</p>
                        <Link to={`/admin/breakdown-templates/${template.id}`} className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-full"><Layers size={14} /> Open Tree Editor</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
