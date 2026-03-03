import { useLoaderData, useSubmit, useNavigation, useRevalidator, useActionData, Link } from "react-router";
import { ApiGET, ApiPOST, ApiPATCH, ApiDELETE } from "~/.server/lib/api";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, ChevronRight, Network, Settings2, Save, X, Layers } from "lucide-react";
import { cn } from "~/lib/utils";

export const handle = { fluid: true };

interface Template {
  id: number;
  code: string;
  name: string;
  vessel_type?: string;
  version?: string;
  description?: string;
}

interface LoaderArgs {
  request: Request;
}

interface ActionArgs {
  request: Request;
}

export async function loader({ request }: LoaderArgs) {
  const host = process.env.API_URL || "http://localhost:2000";
  const res = await ApiGET(request, `${host}/breakdown_templates?order=code.asc`);
  let templates: Template[] = [];
  if (res.ok) {
    const data = await res.json();
    templates = Array.isArray(data) ? data : [];
  }
  return { templates };
}

export async function action({ request }: ActionArgs) {
  const host = process.env.API_URL || "http://localhost:2000";
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save_template") {
    const id = formData.get("id");
    const code = formData.get("code");
    const name = formData.get("name");
    const vessel_type = formData.get("vessel_type");
    const version = formData.get("version") || "1.0";
    const description = formData.get("description");

    const data = { code, name, vessel_type, version, description };

    if (id) {
      const res = await ApiPATCH(request, `${host}/breakdown_templates?id=eq.${id}`, data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        return { success: false, error: err.message || "Failed to update template" };
      }
      return { success: true };
    } else {
      const res = await ApiPOST(request, `${host}/breakdown_templates`, data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        return { success: false, error: err.message || "Failed to create template" };
      }
      return { success: true };
    }
  }

  if (intent === "delete_template") {
    const id = formData.get("id");
    const res = await ApiDELETE(request, `${host}/breakdown_templates?id=eq.${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { success: false, error: err.message || "Failed to delete template" };
    }
    return { success: true };
  }

  return { error: "Unknown action" };
}

export default function BreakdownTemplatesAdmin() {
  const { templates } = useLoaderData<typeof loader>();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    vessel_type: "",
    version: "1.0",
    description: ""
  });
  const prevSuccessHandledRef = useRef<boolean>(false);
  const prevSelectedTemplateIdRef = useRef<number | undefined>(undefined);

  const submit = useSubmit();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const actionData = useActionData<typeof action>();
  const isSubmitting = navigation.state !== "idle" && navigation.formData?.get("intent") === "save_template";

  useEffect(() => {
    if (actionData?.success && !prevSuccessHandledRef.current && navigation.state === "idle") {
      revalidator.revalidate();
      if (isEditing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsEditing(false);
      }
      prevSuccessHandledRef.current = true;
    } else if (navigation.state === "submitting") {
      prevSuccessHandledRef.current = false;
    }
  }, [actionData, navigation.state, isEditing, revalidator]);

  useEffect(() => {
    if (selectedTemplate?.id && selectedTemplate.id !== prevSelectedTemplateIdRef.current) {
      const fresh = templates.find((t) => t.id === selectedTemplate.id);
      if (fresh) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedTemplate(fresh);
        if (!isEditing) {
           
          setEditForm(fresh);
        }
        prevSelectedTemplateIdRef.current = selectedTemplate.id;
      }
    }
  }, [templates, selectedTemplate, isEditing]);

  const handleNew = () => {
    setSelectedTemplate(null);
    setEditForm({
      code: "",
      name: "",
      vessel_type: "",
      version: "1.0",
      description: ""
    });
    setIsEditing(true);
  };

  const handleEdit = () => {
    if (selectedTemplate) {
      setEditForm(selectedTemplate);
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append("intent", "save_template");
    if (selectedTemplate?.id) {
      formData.append("id", selectedTemplate.id.toString());
    }
    formData.append("code", editForm.code);
    formData.append("name", editForm.name);
    formData.append("vessel_type", editForm.vessel_type);
    formData.append("version", editForm.version);
    formData.append("description", editForm.description);
    submit(formData, { method: "post" });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this breakdown template? This will also delete all associated nodes.")) return;
    const formData = new FormData();
    formData.append("intent", "delete_template");
    formData.append("id", id.toString());
    submit(formData, { method: "post" });
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Network size={18} className="text-emerald-600" />
            Breakdown Templates
          </h1>
          <p className="text-xs text-slate-500">Manage hierarchical breakdown structures for different ship types.</p>
        </div>
        <button
          onClick={handleNew}
          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={14} /> Create Template
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* List */}
        <div className="col-span-4 space-y-2">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 max-h-[calc(100vh-250px)] overflow-y-auto">
              {(templates || []).map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl);
                    setIsEditing(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-all flex items-center justify-between group",
                    selectedTemplate?.id === tmpl.id ? "bg-emerald-50 border-l-4 border-l-emerald-500" : "hover:bg-slate-50 border-l-4 border-l-transparent"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{tmpl.code}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">v{tmpl.version}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{tmpl.name}</span>
                    <span className="text-[10px] text-slate-500 italic">{tmpl.vessel_type}</span>
                  </div>
                  <ChevronRight size={14} className={cn("transition-transform text-slate-300", selectedTemplate?.id === tmpl.id ? "translate-x-1 text-emerald-500" : "opacity-0 group-hover:opacity-100")} />
                </button>
              ))}
              {(templates || []).length === 0 && (
                <div className="p-8 text-center text-slate-400 italic text-xs">No templates defined</div>
              )}
            </div>
          </div>
        </div>

        {/* Editor/Viewer */}
        <div className="col-span-8">
          {isEditing || selectedTemplate ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
                  <Settings2 size={16} className="text-slate-400" />
                  {isEditing ? (selectedTemplate ? "Edit Template Basic Info" : "New Template") : "Template Overview"}
                </h3>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={isSubmitting}
                        onClick={handleSave}
                        className={cn(
                          "px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded flex items-center gap-1.5 hover:bg-emerald-700 transition-all",
                          isSubmitting && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isSubmitting ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}
                        {isSubmitting ? "Saving..." : "Save Template"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => selectedTemplate && handleDelete(selectedTemplate.id)}
                        className="px-3 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/10 rounded flex items-center gap-1.5"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                      <button
                        onClick={handleEdit}
                        className="px-3 py-1 border border-slate-200 text-slate-600 text-[11px] font-bold rounded hover:bg-slate-100"
                      >
                        Edit Info
                      </button>
                      {selectedTemplate && (
                        <Link
                          to={`/admin/breakdown-templates/${selectedTemplate.id}`}
                          className="px-3 py-1 bg-primary text-white text-[11px] font-bold rounded flex items-center gap-1.5 hover:bg-primary/90"
                        >
                          <Layers size={12} /> Edit Nodes Tree
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {actionData?.error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium flex items-center gap-2 animate-in shake duration-300">
                    <X size={14} />
                    {actionData.error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.code}
                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                        className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        placeholder="e.g. TMPL-BULK-001"
                      />
                    ) : (
                      selectedTemplate && <div className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{selectedTemplate.code}</div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vessel Type</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.vessel_type}
                        onChange={(e) => setEditForm({ ...editForm, vessel_type: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        placeholder="e.g. Bulk Carrier"
                      />
                    ) : (
                      selectedTemplate && <div className="text-xs font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{selectedTemplate.vessel_type || "-"}</div>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Template Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        placeholder="Full descriptive name"
                      />
                    ) : (
                      selectedTemplate && <div className="text-xs font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{selectedTemplate.name}</div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.version}
                        onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      />
                    ) : (
                      selectedTemplate && <div className="text-xs font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{selectedTemplate.version}</div>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        placeholder="Template notes or usage guidelines..."
                      />
                    ) : (
                      selectedTemplate && <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 min-h-[60px] whitespace-pre-wrap">{selectedTemplate.description || "-"}</div>
                    )}
                  </div>
                </div>

                {!isEditing && selectedTemplate && (
                  <div className="mt-8 p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <Network size={32} className="mx-auto text-slate-300 mb-3" />
                    <h4 className="text-sm font-bold text-slate-600">Template Logic</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      This template defines the standard equipment hierarchy for {selectedTemplate.vessel_type}.
                      Click &quot;Edit Nodes Tree&quot; to manage the breakdown structure and default properties.
                    </p>
                    <Link
                      to={`/admin/breakdown-templates/${selectedTemplate.id}`}
                      className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-sm hover:bg-emerald-700 transition-all"
                    >
                      <Layers size={14} /> Open Tree Editor
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-20 text-center shadow-sm">
              <Network size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-slate-600 font-bold">Select a template to manage</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Breakdown templates help standardize equipment reporting across different vessel fleets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
