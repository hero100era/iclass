import { Plus, Trash2, X } from "lucide-react";

interface ChecklistItemParticular {
    id?: number;
    temp_id?: string;
    attr_key: string;
    attr_title: string;
    data_type: string;
    unit?: string | null;
    default_value?: string | null;
    selection_options?: string[] | null;
    is_required?: boolean;
    sort_order?: number;
}

interface ParticularsEditorProps {
    particulars: ChecklistItemParticular[];
    onUpdate: (newParticulars: ChecklistItemParticular[]) => void;
    onSave: (particulars: ChecklistItemParticular[]) => void;
}

export function ParticularsEditor({ particulars, onUpdate, onSave }: ParticularsEditorProps) {
    const addField = () => {
        const newField: ChecklistItemParticular = {
            temp_id: `temp_${Date.now()}`,
            attr_key: "",
            attr_title: "",
            data_type: "text",
            sort_order: particulars.length,
            is_required: true,
        };
        onUpdate([...particulars, newField]);
    };

    const updateField = (idx: number, field: string, value: any) => {
        const next = [...particulars];
        next[idx] = { ...next[idx], [field]: value };
        onUpdate(next);
    };

    const removeField = (idx: number) => {
        onUpdate(particulars.filter((_, i) => i !== idx));
    };

    return (
        <div className="ml-4 space-y-1.5 pt-2 border-t border-slate-50">
            <div className="flex items-center justify-between">
                <h4 className="text-[8px] font-bold text-slate-400 uppercase">Particulars Template</h4>
                <div className="flex items-center gap-2">
                    <button onClick={addField} className="text-[9px] text-primary font-bold flex items-center gap-0.5">
                        <Plus size={10} /> Add Field
                    </button>
                    <button onClick={() => onSave(particulars)} className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                        Save
                    </button>
                </div>
            </div>

            <div className="space-y-1">
                {particulars.map((p, idx) => (
                    <div key={p.id || p.temp_id} className="grid grid-cols-12 gap-1 items-center p-1 hover:bg-slate-50 rounded">
                        <input
                            className="col-span-3 text-[10px] px-1 py-0.5 border rounded"
                            value={p.attr_title}
                            onChange={(e) => updateField(idx, "attr_title", e.target.value)}
                            placeholder="Label"
                        />
                        <input
                            className="col-span-2 text-[10px] px-1 py-0.5 border rounded font-mono"
                            value={p.attr_key}
                            onChange={(e) => updateField(idx, "attr_key", e.target.value)}
                            placeholder="key"
                        />
                        <select
                            className="col-span-2 text-[10px] px-1 py-0.5 border rounded"
                            value={p.data_type}
                            onChange={(e) => updateField(idx, "data_type", e.target.value)}
                        >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="selection">Select</option>
                        </select>
                        <input
                            className="col-span-2 text-[10px] px-1 py-0.5 border rounded"
                            value={p.unit || ""}
                            onChange={(e) => updateField(idx, "unit", e.target.value)}
                            placeholder="Unit"
                        />
                        <div className="col-span-2 flex justify-end">
                            <button onClick={() => removeField(idx)} className="text-slate-300 hover:text-red-500">
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
