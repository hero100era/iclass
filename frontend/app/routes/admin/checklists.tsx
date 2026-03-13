import {
  useLoaderData,
  useSubmit,
  useNavigation,
  useRevalidator,
  useActionData,
} from "react-router";
import { getDb } from "~/.server/lib/api";
import { useState, useEffect } from "react";
import { Plus, Trash2, Settings2 } from "lucide-react";

import { SurveySidebar } from "./components/checklists/SurveySidebar";
import { ParticularsEditor } from "./components/checklists/ParticularsEditor";

export const handle = { fluid: true };

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

interface ChecklistItem {
  id: number;
  section_id: number;
  item_number: number;
  content: string;
  breakdown_template_node_id?: number | null;
  checklist_item_particulars?: ChecklistItemParticular[];
}

interface ChecklistSection {
  id: number;
  survey_id: number;
  section_number: string;
  title: string;
  checklist_items?: ChecklistItem[];
}

interface Survey {
  id: number;
  code: string;
  name: string;
  vessel_type?: string;
  checklist_sections?: ChecklistSection[];
}

interface BreakdownNode {
  id: number;
  code: string;
  name: string;
}

import type { Route } from "./+types/checklists";

export async function loader({ request }: Route.LoaderArgs) {
  const db = await getDb(request);
  const [{ data: surveys }, { data: breakdownNodes }] =
    await Promise.all([
      db.get<Survey[]>("/survey_pool", {
        select: "*,checklist_sections(*,checklist_items(*,checklist_item_particulars(*)))",
      }),
      db.get<BreakdownNode[]>("/breakdown_template_nodes", {
        select: "id,code,name",
        order: "name.asc",
      }),
    ]);

  return { surveys: surveys || [], breakdownNodes: breakdownNodes || [] };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const db = await getDb(request);

  if (intent === "update_item_particulars") {
    const id = formData.get("id");
    const particulars = JSON.parse(formData.get("particulars") as string);
    await db.delete("/checklist_item_particulars", { filters: { checklist_item_id: `eq.${id}` } });
    if (particulars.length > 0) {
      const toInsert = particulars.map((p: ChecklistItemParticular) => ({
        checklist_item_id: id,
        attr_key: p.attr_key,
        attr_title: p.attr_title,
        data_type: p.data_type,
        unit: p.unit || null,
        is_required: p.is_required ?? true,
        sort_order: p.sort_order ?? 0,
      }));
      await db.post("/checklist_item_particulars", { body: toInsert });
    }
    return { success: true };
  }

  if (intent === "update_item") {
    const id = formData.get("id");
    await db.patch("/checklist_items", {
      filters: { id: `eq.${id}` },
      body: {
        content: formData.get("content"),
        breakdown_template_node_id: formData.get("breakdown_node_id") === "null" ? null : formData.get("breakdown_node_id")
      },
    });
    return { success: true };
  }

  if (intent === "delete_item") {
    await db.delete("/checklist_items", { filters: { id: `eq.${formData.get("id")}` } });
    return { success: true };
  }

  if (intent === "add_item") {
    await db.post("/checklist_items", {
      body: {
        section_id: Number(formData.get("section_id")),
        item_number: Number(formData.get("item_number")),
        content: formData.get("content"),
      },
    });
    return { success: true };
  }

  if (intent === "add_section") {
    const section_number = formData.get("section_number");
    const surveyCode = formData.get("survey_code");
    const code = `${(surveyCode as string).replace(/\./g, "").substring(0, 2)}${section_number}`.toUpperCase();
    await db.post("/checklist_sections", {
      body: {
        survey_id: Number(formData.get("survey_id")),
        code,
        section_number,
        title: formData.get("title"),
      },
    });
    return { success: true };
  }

  return { error: "Unknown action" };
}

export default function AdminChecklists() {
  const { surveys } = useLoaderData<typeof loader>();
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ content: "", breakdownNodeId: "" });
  const [addingToSection, setAddingToSection] = useState<number | null>(null);
  const [newItemContent, setNewItemContent] = useState("");

  const submit = useSubmit();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const actionData = useActionData<typeof action>();

  const [prevSurveys, setPrevSurveys] = useState(surveys);
  if (surveys !== prevSurveys) {
    setPrevSurveys(surveys);
    if (selectedSurvey) {
      const fresh = surveys.find((s: Survey) => s.id === selectedSurvey.id);
      if (fresh) setSelectedSurvey(fresh);
    }
  }

  useEffect(() => {
    if (actionData?.success && navigation.state === "idle") revalidator.revalidate();
  }, [actionData, navigation.state, revalidator]);

  const handleUpdateParticulars = (itemId: number, particulars: ChecklistItemParticular[]) => {
    if (!selectedSurvey) return;
    const next = { ...selectedSurvey };
    next.checklist_sections = next.checklist_sections?.map(s => ({
      ...s, checklist_items: s.checklist_items?.map(i => i.id === itemId ? { ...i, checklist_item_particulars: particulars } : i)
    }));
    setSelectedSurvey(next);
  };

  const handleSaveParticulars = (itemId: number, particulars: ChecklistItemParticular[]) => {
    submit({ intent: "update_item_particulars", id: itemId.toString(), particulars: JSON.stringify(particulars) }, { method: "post" });
  };

  const handleAddItem = (sectionId: number, num: number) => {
    submit({ intent: "add_item", section_id: sectionId.toString(), item_number: num.toString(), content: newItemContent }, { method: "post" });
    setAddingToSection(null);
    setNewItemContent("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings2 size={18} className="text-primary" /> Checklist Management
          </h1>
          <p className="text-xs text-slate-500">Configure checklist templates and dynamic fields.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 min-h-[600px]">
        <div className="col-span-3">
          <SurveySidebar surveys={surveys} selectedSurveyId={selectedSurvey?.id} onSelect={setSelectedSurvey} />
        </div>

        <div className="col-span-9 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-y-auto max-h-[800px]">
          {selectedSurvey ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold text-slate-800">{selectedSurvey.name} Template</h2>
                <button className="px-3 py-1 bg-slate-100 text-[11px] font-bold rounded" title="Add Section">Add Section</button>
              </div>

              <div className="space-y-4">
                {selectedSurvey.checklist_sections?.sort((a, b) => a.section_number.localeCompare(b.section_number, undefined, { numeric: true })).map(section => (
                  <div key={section.id} className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{section.section_number}</span>
                        <h3 className="text-xs font-bold text-slate-700 uppercase">{section.title}</h3>
                      </div>
                      <button onClick={() => setAddingToSection(section.id)} className="p-1 hover:text-primary"><Plus size={16} /></button>
                    </div>

                    <div className="divide-y">
                      {section.checklist_items?.sort((a, b) => a.item_number - b.item_number).map(item => (
                        <div key={item.id} className="p-4 space-y-4 group">
                          {editingItemId === item.id ? (
                            <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                              <textarea className="w-full text-xs p-2 border rounded" value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingItemId(null)} className="text-xs font-bold text-slate-500">Cancel</button>
                                <button onClick={() => {
                                  submit({ intent: "update_item", id: item.id.toString(), content: editForm.content, breakdown_node_id: editForm.breakdownNodeId || "null" }, { method: "post" });
                                  setEditingItemId(null);
                                }} className="bg-primary text-white text-[11px] font-bold px-3 py-1 rounded">Save</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex gap-2">
                                <span className="text-[10px] font-mono font-bold text-slate-300 mt-1">{item.item_number}.</span>
                                <p className="text-xs text-slate-800 font-medium leading-relaxed">{item.content}</p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingItemId(item.id); setEditForm({ content: item.content, breakdownNodeId: item.breakdown_template_node_id?.toString() || "" }); }} className="p-1 text-slate-400 hover:text-primary"><Settings2 size={14} /></button>
                                <button onClick={() => submit({ intent: "delete_item", id: item.id.toString() }, { method: "post" })} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          )}

                          <ParticularsEditor
                            particulars={item.checklist_item_particulars || []}
                            onUpdate={(p) => handleUpdateParticulars(item.id, p)}
                            onSave={(p) => handleSaveParticulars(item.id, p)}
                          />
                        </div>
                      ))}
                      {addingToSection === section.id && (
                        <div className="p-4 bg-primary/5">
                          <textarea className="w-full text-xs p-2 border rounded mb-2" placeholder="New item content..." value={newItemContent} onChange={e => setNewItemContent(e.target.value)} />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setAddingToSection(null)} className="text-xs font-bold text-slate-500">Cancel</button>
                            <button onClick={() => handleAddItem(section.id, section.checklist_items?.length ? Math.max(...section.checklist_items.map(i => i.item_number)) + 1 : 1)} className="bg-primary text-white text-[11px] font-bold px-4 py-1 rounded">Add Item</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Settings2 size={32} /></div>
              <p className="text-sm font-medium">Select a survey type to manage its checklist.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
