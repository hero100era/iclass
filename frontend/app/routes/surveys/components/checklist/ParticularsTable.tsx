import { useSubmit } from "react-router";

interface ParticularItem {
    ship_breakdown_node_id?: number;
    ship_breakdown_nodes?: {
        name: string;
        code: string;
    };
    attr_key: string;
    title: string;
    unit?: string;
    type: string;
    result?: string;
    survey_checklist_id: number;
    id: number;
}

interface ParticularsTableProps {
    particulars: ParticularItem[];
    submit: ReturnType<typeof useSubmit>;
}

export function ParticularsTable({ particulars, submit }: ParticularsTableProps) {
    if (particulars.length === 0) return null;

    const nodes: any[] = [];
    const nodeMap: Record<string, any> = {};
    const attrKeys: string[] = [];
    const attrMap: Record<string, any> = {};

    particulars.forEach((p) => {
        const nodeId = p.ship_breakdown_node_id || "default";
        if (!nodeMap[nodeId]) {
            nodeMap[nodeId] = {
                id: nodeId,
                name: p.ship_breakdown_nodes?.name || "Shared",
                code: p.ship_breakdown_nodes?.code || "",
                particulars: {},
            };
            nodes.push(nodeMap[nodeId]);
        }
        nodeMap[nodeId].particulars[p.attr_key] = p;

        if (!attrMap[p.attr_key]) {
            attrMap[p.attr_key] = { key: p.attr_key, title: p.title, unit: p.unit, type: p.type };
            attrKeys.push(p.attr_key);
        }
    });

    const showNodeColumn = nodes.length > 1 || (nodes.length === 1 && nodes[0].id !== "default");

    const submitParticular = (p: ParticularItem, value: string) => {
        const formData = new FormData();
        formData.append("intent", "update_particulars");
        formData.append("id", p.survey_checklist_id.toString());
        formData.append("particulars", JSON.stringify([{ ...p, result: value }]));
        submit(formData, { method: "post" });
    };

    return (
        <div className="ml-6 pt-1">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="px-3 py-1.5 bg-slate-50/50 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Required Particulars</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px]">
                        <thead className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-400 uppercase tracking-tight text-[9px]">
                            <tr>
                                {showNodeColumn && <th className="px-3 py-1.5 border-r border-slate-100 min-w-30">Component / Node</th>}
                                {attrKeys.map((key) => (
                                    <th key={key} className="px-3 py-1.5 min-w-25 border-r border-slate-100 last:border-0">
                                        {attrMap[key].title} {attrMap[key].unit && <span className="lowercase font-normal">({attrMap[key].unit})</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {nodes.map((node) => (
                                <tr key={node.id} className="hover:bg-slate-50/30 transition-colors">
                                    {showNodeColumn && (
                                        <td className="px-3 py-1.5 border-r border-slate-100 font-medium text-slate-700 align-middle">
                                            <div className="flex flex-col">
                                                <span>{node.name}</span>
                                                {node.code && <span className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">{node.code}</span>}
                                            </div>
                                        </td>
                                    )}
                                    {attrKeys.map((key) => {
                                        const p = node.particulars[key];
                                        if (!p) return <td key={key} className="px-3 py-1.5 bg-slate-50/20 border-r border-slate-100 last:border-0"></td>;
                                        return (
                                            <td key={key} className="px-3 py-1.5 border-r border-slate-100 last:border-0 align-middle">
                                                {p.type === "boolean" ? (
                                                    <div className="flex gap-2 items-center">
                                                        {["Yes", "No"].map((opt) => (
                                                            <label key={opt} className="flex items-center gap-1 cursor-pointer group">
                                                                <input
                                                                    type="radio"
                                                                    name={`particular-${p.id}`}
                                                                    value={opt}
                                                                    checked={p.result === opt}
                                                                    onChange={(e) => submitParticular(p, e.target.value)}
                                                                    className="w-2.5 h-2.5 text-primary border-slate-300 focus:ring-primary/20"
                                                                />
                                                                <span className="text-[9px] text-slate-600 group-hover:text-primary">{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <input
                                                        type={p.type === "number" ? "number" : p.type === "date" ? "date" : "text"}
                                                        defaultValue={p.result || ""}
                                                        onBlur={(e) => { if (e.target.value !== p.result) submitParticular(p, e.target.value); }}
                                                        placeholder="-"
                                                        className="w-full bg-transparent border border-transparent rounded px-1 py-0.5 outline-none focus:bg-white focus:border-primary/20 hover:border-slate-200 transition-all text-slate-700"
                                                    />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
