import { ClipboardCheck, Info, ListChecks } from "lucide-react";
import { useLoaderData, useSubmit } from "react-router";
import { getChecklistData, updateChecklistResult, updateChecklistParticulars } from "./checklist.server";
import { cn } from "~/lib/utils";
import { useState } from "react";

interface LoaderArgs {
  request: Request;
  params: Record<string, string>;
}

interface ActionArgs {
  request: Request;
  params: Record<string, string>;
}

export async function loader(args: LoaderArgs) {
  return await getChecklistData(args);
}

export async function action(args: ActionArgs) {
  const formData = await args.request.formData();
  const intent = formData.get("intent");

  if (intent === "update_result") {
    const id = formData.get("id");
    const result = formData.get("result");
    const type = formData.get("type");
    return await updateChecklistResult(args, { id, result, type });
  }

  if (intent === "update_particulars") {
    const id = formData.get("id");
    const particularsJson = formData.get("particulars");
    const type = formData.get("type");
    return await updateChecklistParticulars(args, { id, particularsJson, type });
  }

  return { error: "Unknown action" };
}

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

interface ChecklistItem {
  id: number;
  item_id: number;
  survey_line_id: number;
  result?: string;
  checklist_items?: {
    item_number: number;
    content?: string;
    reg_reference?: string;
    checklist_sections?: {
      id: number;
      section_number: string;
      title: string;
    };
  };
  particulars?: ParticularItem[];
}

interface SurveyLine {
  id: number;
  survey_audits?: {
    description?: string;
    cert_code?: string;
  };
  survey_pool?: {
    name?: string;
    code?: string;
  };
}

interface ChecklistResult {
  code: string;
  description: string;
}

/** Renders the particulars table for a checklist item across all its instances. */
function ParticularsTable({ particulars, submit }: {
  particulars: ParticularItem[];
  submit: ReturnType<typeof useSubmit>;
}) {
  if (particulars.length === 0) return null;

  // Group by node
  const nodes: { id: number | string; name: string; code: string; particulars: Record<string, ParticularItem> }[] = [];
  const nodeMap: Record<string, { id: number | string; name: string; code: string; particulars: Record<string, ParticularItem> }> = {};
  const attrKeys: string[] = [];
  const attrMap: Record<string, { key: string; title: string; unit?: string; type: string }> = {};

  particulars.forEach((p) => {
    const nodeId = p.ship_breakdown_node_id || "default";
    if (!nodeMap[nodeId]) {
      nodeMap[nodeId] = {
        id: nodeId,
        name: p.ship_breakdown_nodes?.name || "Shared",
        code: p.ship_breakdown_nodes?.code || "",
        particulars: {}
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
                {showNodeColumn && <th className="px-3 py-1.5 border-r border-slate-100 min-w-[120px]">Component / Node</th>}
                {attrKeys.map(key => (
                  <th key={key} className="px-3 py-1.5 min-w-[100px] border-r border-slate-100 last:border-0">
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
                  {attrKeys.map(key => {
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
                                <span className="text-[9px] text-slate-600 group-hover:text-primary transition-colors">{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input
                            type={p.type === "number" ? "number" : p.type === "date" ? "date" : "text"}
                            defaultValue={p.result || ""}
                            onBlur={(e) => {
                              if (e.target.value !== p.result) submitParticular(p, e.target.value);
                            }}
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

export default function JobChecklist() {
  const { surveyLines, surveyChecklists, checklistResults } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const allLines: SurveyLine[] = Array.isArray(surveyLines) ? surveyLines : [];
  const [activeLineId, setActiveLineId] = useState<number | null>(allLines.length > 0 ? allLines[0].id : null);

  const currentChecklist = (Array.isArray(surveyChecklists) ? surveyChecklists : []).filter(
    (c: ChecklistItem) => c.survey_line_id === activeLineId
  );

  // Group by sections
  const sections: Record<string, { section: { id: number; section_number: string; title: string }; items: ChecklistItem[][] }> = {};
  currentChecklist.forEach((c: ChecklistItem) => {
    const sectionData = c.checklist_items?.checklist_sections;
    const sectionId = sectionData?.id;
    if (!sectionId) return;
    if (!sections[sectionId]) {
      sections[sectionId] = { section: { id: sectionData.id, section_number: sectionData.section_number || "", title: sectionData.title || "" }, items: [] };
    }
  });

  // Sort sections by section_number
  const sortedSections = Object.values(sections).sort((a, b) =>
    (a.section?.section_number || "").localeCompare(b.section?.section_number || "", undefined, { numeric: true })
  );

  // Sort items within sections, grouped by item_id
  sortedSections.forEach(s => {
    const grouped: Record<number, ChecklistItem[]> = {};
    currentChecklist.forEach((item: ChecklistItem) => {
      if (item.checklist_items?.checklist_sections?.id === s.section.id) {
        (grouped[item.item_id] ||= []).push(item);
      }
    });
    s.items = Object.values(grouped).sort((a: ChecklistItem[], b: ChecklistItem[]) =>
      (a[0].checklist_items?.item_number || 0) - (b[0].checklist_items?.item_number || 0)
    );
  });

  const handleResultChange = (checklistId: number, result: string) => {
    const formData = new FormData();
    formData.append("intent", "update_result");
    formData.append("id", checklistId.toString());
    formData.append("result", result);
    submit(formData, { method: "post" });
  };

  return (
    <div className="flex flex-col h-full space-y-4 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ListChecks size={20} className="text-primary" />
            Checklist Reporting
          </h2>
          <p className="text-sm text-slate-500">Record verification results for each checklist item.</p>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">Surveys in Scope</div>
          {allLines.map((line: SurveyLine) => (
            <button
              key={line.id}
              onClick={() => setActiveLineId(line.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 shadow-sm",
                activeLineId === line.id
                  ? "bg-white border-primary border-2 ring-1 ring-primary/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              <span className="text-[9px] font-bold uppercase w-fit px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                survey
              </span>
              <span className="text-xs font-bold text-slate-700 line-clamp-2">
                {line.survey_audits?.description || line.survey_pool?.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {line.survey_audits?.cert_code || line.survey_pool?.code}
              </span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-3 pb-20">
          {activeLineId ? (
            sortedSections.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                <ClipboardCheck size={40} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-slate-500 font-medium">No checklist items found for this survey.</h3>
                <p className="text-xs text-slate-400 mt-1">Please ensure checklist sections and items are configured for this cert code and type.</p>
              </div>
            ) : (
              sortedSections.map((sect) => (
                <div key={sect.section?.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{sect.section?.section_number}</span>
                    <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{sect.section?.title}</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {sect.items.map((instances: ChecklistItem[]) => {
                      const item = instances[0];
                      const allParticulars = instances.flatMap(inst => inst.particulars || []);
                      return (
                        <div key={item.id} className="py-2 px-3 hover:bg-slate-50/30 transition-colors flex flex-col gap-2">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0 space-y-1.5 cursor-default">
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] font-mono font-bold text-slate-400 py-0.5 shrink-0">{item.checklist_items?.item_number}.</span>
                                <div className="flex-1 space-y-1.5">
                                  <p className="text-xs text-slate-800 leading-normal">{item.checklist_items?.content}</p>
                                  {item.checklist_items?.reg_reference && (
                                    <div className="flex items-center gap-1.5">
                                      <Info size={11} className="text-slate-300" />
                                      <span className="text-[9px] text-slate-400 font-medium italic">Ref: {item.checklist_items.reg_reference}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="w-20 shrink-0">
                              <select
                                value={item.result || ""}
                                onChange={(e) => instances.forEach(inst => handleResultChange(inst.id, e.target.value))}
                                className="w-full bg-slate-100 border border-slate-200 rounded-md py-0.5 px-2 text-[10px] font-bold outline-none focus:ring-1 focus:ring-primary/20 appearance-none text-center hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                {(checklistResults || []).map((res: ChecklistResult) => (
                                  <option key={res.code} value={res.code}>{res.code}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <ParticularsTable particulars={allParticulars} submit={submit} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <ListChecks size={40} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-slate-500 font-medium">Select a survey from the side to begin reporting.</h3>
            </div>
          )}

          {activeLineId && sortedSections.length > 0 && (
            <footer className="mt-4 border-t border-slate-200 p-3 pb-6 bg-slate-50/50 rounded-xl shadow-inner border-dashed">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Info size={12} />
                Checklist Result Codes Legend
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1">
                {(checklistResults || []).map((res: ChecklistResult) => (
                  <div key={res.code} className="flex gap-2 items-start border-b border-slate-100 pb-1 last:border-0 md:[&:nth-last-child(-n+2)]:border-0 lg:[&:nth-last-child(-n+4)]:border-0">
                    <div className="flex-shrink-0 w-7 h-4.5 flex items-center justify-center bg-slate-200 rounded text-[9px] font-bold text-slate-600 shadow-sm border border-slate-300">
                      {res.code}
                    </div>
                    <span className="text-[9px] text-slate-500 leading-tight font-medium py-0.5">{res.description}</span>
                  </div>
                ))}
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
