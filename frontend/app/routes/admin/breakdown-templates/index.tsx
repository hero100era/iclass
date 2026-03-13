import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { getDb } from "~/.server/lib/api";
import { useState } from "react";
import { Plus, Network } from "lucide-react";

import { TemplateList } from "./components/TemplateList";
import { TemplateDetails } from "./components/TemplateDetails";

export const handle = { fluid: true };

export async function loader({ request }: any) {
  const db = await getDb(request);
  const { data: templates } = await db.get<any[]>("/breakdown_templates", { order: "name.asc" });
  return { templates: templates || [] };
}

export async function action({ request }: any) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const db = await getDb(request);
  if (intent === "save_template") {
    const id = formData.get("id");
    const data = { code: formData.get("code"), name: formData.get("name"), vessel_type: formData.get("vessel_type"), version: formData.get("version") || "1.0", description: formData.get("description") };
    if (id) await db.patch("/breakdown_templates", { filters: { id: `eq.${id}` }, body: data });
    else await db.post("/breakdown_templates", { body: data });
    return { success: true };
  }
  if (intent === "delete_template") {
    await db.delete("/breakdown_templates", { filters: { id: `eq.${formData.get("id")}` } });
    return { success: true };
  }
  return { error: "Unknown action" };
}

export default function BreakdownTemplatesAdmin() {
  const { templates } = useLoaderData<typeof loader>();
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData<any>();

  const handleNew = () => { setSelectedTemplate(null); setEditForm({ code: "", name: "", vessel_type: "", version: "1.0", description: "" }); setIsEditing(true); };
  const handleEdit = () => { if (selectedTemplate) setEditForm(selectedTemplate); setIsEditing(true); };
  const handleSave = () => { submit({ intent: "save_template", ...editForm, id: selectedTemplate?.id || "" }, { method: "post" }); setIsEditing(false); };
  const handleDelete = (id: number) => { if (confirm("Delete template?")) { submit({ intent: "delete_template", id: id.toString() }, { method: "post" }); setSelectedTemplate(null); } };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Network size={18} className="text-emerald-600" /> Breakdown Templates</h1>
          <p className="text-xs text-slate-500">Manage hierarchical breakdown structures for ships.</p>
        </div>
        <button onClick={handleNew} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-2"><Plus size={14} /> Create Template</button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4"><TemplateList templates={templates} selectedId={selectedTemplate?.id} onSelect={(t) => { setSelectedTemplate(t); setIsEditing(false); }} /></div>
        <div className="col-span-8">
          {(isEditing || selectedTemplate) ? (
            <TemplateDetails
              template={selectedTemplate}
              editForm={editForm}
              isEditing={isEditing}
              isSubmitting={navigation.state === "submitting"}
              error={actionData?.error}
              onEdit={handleEdit}
              onCancel={() => setIsEditing(false)}
              onSave={handleSave}
              onDelete={handleDelete}
              onFormUpdate={setEditForm}
            />
          ) : (
            <div className="bg-white border rounded-xl p-20 text-center opacity-30 shadow-sm">
              <Network size={48} className="mx-auto mb-4" />
              <p className="text-sm font-bold">Select a template to manage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
