import {
    FileText,
    Plus,
    Trash2,
    Edit2,
    AlertCircle,
    Clock,
    CheckCircle2,
    X,
    Save,
} from "lucide-react";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { getDb } from "~/.server/lib/api";
import { cn } from "~/lib/utils";
import { useState } from "react";
import type { Route } from "./+types/memo-finding";

const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(new Date(dateString));
};

interface CommentType {
    code: string;
    name: string;
}

interface CommentStatus {
    code: string;
    name: string;
}

interface FindingComment {
    id: number;
    ship_id: number;
    subject: string;
    text: string;
    comment_type: string;
    status: string;
    date_issued: string;
    due_date?: string;
    mms_reference?: string;
}

interface CommentLine {
    id: number;
    survey_job_id: number;
    finding_comment_id?: number;
    comment_type?: string;
    subject?: string;
    text?: string;
    status?: string;
    due_date?: string;
    mms_reference?: string;
    is_private: boolean;
    finding_comment?: FindingComment;
}

export async function loader({ params, request }: Route.LoaderArgs) {
    const { id } = params;
    const db = await getDb(request);

    // 1. Get the survey_job to get ship_id and company_id
    const { data: surveyJob } = await db.getOne<Record<string, unknown>>("/survey_jobs", {
        filters: { id: `eq.${id}` },
    });

    // 2. Fetch comment lines for this survey job
    const { data: commentLines } = await db.get<CommentLine[]>("/comment_lines", {
        filters: { survey_job_id: `eq.${id}` },
        select: "*,finding_comment:finding_comments(*)",
        order: "id.desc",
    });

    // 3. Fetch all active findings for the ship (Existing conditions)
    const { data: shipFindings } = await db.get<FindingComment[]>("/finding_comments", {
        filters: {
            ship_id: `eq.${surveyJob?.ship_id}`,
            status: "neq.C", // Not Closed
            is_active: "is.true"
        },
        order: "date_issued.desc",
    });

    // 4. Fetch types and statuses
    const { data: commentTypes } = await db.get<CommentType[]>("/comment_types");
    const { data: commentStatuses } = await db.get<CommentStatus[]>("/comment_statuses");

    return {
        commentLines: commentLines || [],
        shipFindings: shipFindings || [],
        commentTypes: commentTypes || [],
        commentStatuses: commentStatuses || [],
        surveyJob,
    };
}

export async function action({ params, request }: Route.ActionArgs) {
    const { id } = params;
    const db = await getDb(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create" || intent === "update") {
        const findingId = formData.get("id");
        const payload = {
            survey_job_id: Number(id),
            comment_type: formData.get("comment_type"),
            subject: formData.get("subject"),
            text: formData.get("text"),
            status: formData.get("status"),
            due_date: formData.get("due_date") || null,
            mms_reference: formData.get("mms_reference") || null,
            is_private: formData.get("is_private") === "true",
        };

        if (intent === "create") {
            await db.post("/comment_lines", { body: payload });
        } else {
            await db.patch("/comment_lines", {
                filters: { id: `eq.${findingId}` },
                body: payload,
            });
        }
        return { success: true };
    }

    if (intent === "delete") {
        const findingId = formData.get("id");
        await db.delete("/comment_lines", {
            filters: { id: `eq.${findingId}` },
        });
        return { success: true };
    }

    if (intent === "add_existing") {
        const commentId = formData.get("comment_id");
        await db.post("/comment_lines", {
            body: {
                survey_job_id: Number(id),
                finding_comment_id: Number(commentId),
            },
        });
        return { success: true };
    }

    return { error: "Unknown action" };
}

export default function MemoFindingPage() {
    const { commentLines, shipFindings, commentTypes, commentStatuses } =
        useLoaderData<typeof loader>();
    const submit = useSubmit();
    const navigation = useNavigation();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const isSubmitting = navigation.state !== "idle";

    // Filtering ship findings to only show those NOT already in the job's report scope
    const linkedCommentIds = commentLines.map(cl => cl.finding_comment_id).filter(id => id !== null);
    const availableExistingFindings = shipFindings.filter(sf => !linkedCommentIds.includes(sf.id));

    const handleAdd = () => {
        setIsAdding(true);
        setEditingId(null);
    };

    const handleEdit = (finding: CommentLine) => {
        setEditingId(finding.id);
        setIsAdding(false);
    };

    const handleDelete = (findingId: number) => {
        if (confirm("Are you sure you want to delete this finding from the report?")) {
            submit({ intent: "delete", id: findingId.toString() }, { method: "post" });
        }
    };

    const handleAddExisting = (commentId: number) => {
        submit({ intent: "add_existing", comment_id: commentId.toString() }, { method: "post" });
    };

    const getTypeLabel = (code: string | undefined) =>
        commentTypes.find((t) => t.code === code)?.name || code || "Unknown";
    const getStatusLabel = (code: string | undefined) =>
        commentStatuses.find((s) => s.code === code)?.name || code || "Unknown";

    const getDisplayData = (finding: CommentLine) => {
        const base = finding.finding_comment || {} as FindingComment;
        return {
            subject: finding.subject || base.subject || "No Subject",
            text: finding.text || base.text || "No description provided.",
            comment_type: finding.comment_type || base.comment_type,
            status: finding.status || base.status,
            due_date: finding.due_date || base.due_date,
            mms_reference: finding.mms_reference || base.mms_reference,
            is_linked: !!finding.finding_comment_id
        };
    };

    return (
        <div className="flex flex-col h-full space-y-4 max-w-5xl mx-auto">
            {/* Header section */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <FileText size={20} className="text-primary" />
                        </div>
                        Memo & Findings
                    </h2>
                    <p className="text-[11px] text-slate-400 ml-10">
                        Manage memoranda, class conditions, and deficiencies for this survey.
                    </p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md shadow-primary/20 active:scale-95"
                >
                    <Plus size={16} />
                    Add Finding
                </button>
            </div>

            {/* Form Area */}
            {(isAdding || editingId) && (
                <FindingForm
                    commentTypes={commentTypes}
                    commentStatuses={commentStatuses}
                    onCancel={() => {
                        setIsAdding(false);
                        setEditingId(null);
                    }}
                    finding={commentLines.find((f) => f.id === editingId)}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* List Area */}
            <div className="grid gap-4">
                {commentLines.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-50 rounded-full">
                            <AlertCircle size={40} className="text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-700">No findings in report</h3>
                            <p className="text-slate-500 max-w-sm">
                                {availableExistingFindings.length > 0
                                    ? "There are existing conditions for this ship. You can add them to the report below or record a new one."
                                    : "Record any observations or conditions found during the survey."}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAdd}
                                className="mt-2 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                            >
                                Record New Finding
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="px-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reporting Scope</h3>
                        </div>
                        {commentLines.map((finding) => {
                            const data = getDisplayData(finding);
                            return (
                                <div
                                    key={finding.id}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                                >
                                    <div className="p-3 flex gap-4">
                                        {/* Left side: Type Icon/Badge */}
                                        <div className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                                                data.comment_type === 'M' ? "bg-blue-50 text-blue-600" :
                                                    data.comment_type === 'C' ? "bg-amber-50 text-amber-600" :
                                                        data.comment_type === 'D' ? "bg-red-50 text-red-600" :
                                                            "bg-slate-50 text-slate-600"
                                            )}>
                                                {data.comment_type === 'M' ? <Clock size={20} /> :
                                                    data.comment_type === 'C' ? <AlertCircle size={20} /> :
                                                        data.comment_type === 'D' ? <AlertCircle size={20} /> :
                                                            <FileText size={18} />}
                                            </div>
                                            <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400 text-center leading-none">
                                                {getTypeLabel(data.comment_type)}
                                            </span>
                                        </div>

                                        {/* Center: Content */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm leading-tight">
                                                        {data.subject}
                                                        {data.is_linked && <span className="ml-1.5 text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded align-middle font-medium uppercase">Linked</span>}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1",
                                                            data.status === 'A' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                                                        )}>
                                                            {data.status === 'A' ? <CheckCircle2 size={8} /> : <Clock size={8} />}
                                                            {getStatusLabel(data.status)}
                                                        </span>
                                                        {data.due_date && (
                                                            <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                                                <Clock size={8} />
                                                                Due: {formatDate(data.due_date)}
                                                            </span>
                                                        )}
                                                        {data.mms_reference && (
                                                            <span className="text-[9px] text-slate-400 bg-slate-50 px-1 rounded">
                                                                Ref: {data.mms_reference}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(finding)}
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                                        title="Edit Overrides"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(finding.id)}
                                                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-300 hover:text-red-500 transition-colors"
                                                        title="Remove from Report"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 bg-slate-50/50 p-2 rounded-lg border border-slate-50/50">
                                                {data.text}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Existing Conditions Section */}
            {availableExistingFindings.length > 0 && (
                <div className="space-y-4 pt-4">
                    <div className="px-2 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Existing Conditions</h3>
                        <p className="text-[10px] text-slate-400 italic">Findings already active on the ship but not in this report yet.</p>
                    </div>
                    <div className="grid gap-2">
                        {availableExistingFindings.map((finding) => (
                            <div key={finding.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2 px-3 flex items-center justify-between group hover:bg-white hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                        finding.comment_type === 'M' ? "bg-blue-100 text-blue-600" :
                                            finding.comment_type === 'C' ? "bg-amber-100 text-amber-600" :
                                                finding.comment_type === 'D' ? "bg-red-100 text-red-600" :
                                                    "bg-slate-200 text-slate-600"
                                    )}>
                                        <AlertCircle size={16} />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-bold text-slate-700">{finding.subject || "No Subject"}</h5>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{getTypeLabel(finding.comment_type)}</span>
                                            <span className="text-[9px] text-slate-400 tracking-tighter">• {formatDate(finding.date_issued)}</span>
                                            {finding.due_date && <span className="text-[9px] text-red-400 font-medium tracking-tighter">• Due: {formatDate(finding.due_date)}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddExisting(finding.id)}
                                    className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-md text-[10px] font-bold hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95"
                                >
                                    Add to Report
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
        </div>
    );
}

interface FindingFormProps {
    commentTypes: CommentType[];
    commentStatuses: CommentStatus[];
    onCancel: () => void;
    finding?: CommentLine;
    isSubmitting: boolean;
}

function FindingForm({ commentTypes, commentStatuses, onCancel, finding, isSubmitting }: FindingFormProps) {
    const submit = useSubmit();

    const base = (finding?.finding_comment || {}) as FindingComment;
    const initialData = {
        subject: finding?.subject || base.subject || "",
        text: finding?.text || base.text || "",
        comment_type: finding?.comment_type || base.comment_type || "M",
        status: finding?.status || base.status || "A",
        due_date: finding?.due_date || base.due_date || "",
        mms_reference: finding?.mms_reference || base.mms_reference || ""
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.append("intent", finding ? "update" : "create");
        if (finding) formData.append("id", finding.id.toString());
        submit(formData, { method: "post" });
        onCancel();
    };

    return (
        <div className="bg-white rounded-xl shadow-xl border-t-2 border-primary p-5 animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {finding ? (finding.finding_comment_id ? "Edit Overrides" : "Edit Finding") : "New Finding"}
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Type</label>
                        <select
                            name="comment_type"
                            defaultValue={initialData.comment_type}
                            className="w-full bg-slate-50 border-none rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary font-medium"
                            required
                        >
                            {commentTypes.map((t) => (
                                <option key={t.code} value={t.code}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                        <select
                            name="status"
                            defaultValue={initialData.status}
                            className="w-full bg-slate-50 border-none rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary font-medium"
                            required
                        >
                            {commentStatuses.map((s) => (
                                <option key={s.code} value={s.code}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Subject</label>
                    <input
                        name="subject"
                        type="text"
                        defaultValue={initialData.subject}
                        placeholder="E.g. Main engine fuel pump leak..."
                        className="w-full bg-slate-50 border-none rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary font-medium placeholder:text-slate-300"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Detail Narrative</label>
                    <textarea
                        name="text"
                        rows={3}
                        defaultValue={initialData.text}
                        placeholder="Provide a detailed description of the finding or memorandum..."
                        className="w-full bg-slate-50 border-none rounded-lg p-3 text-xs focus:ring-2 focus:ring-primary font-medium placeholder:text-slate-300 resize-none"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Due Date</label>
                        <input
                            name="due_date"
                            type="date"
                            defaultValue={initialData.due_date ? initialData.due_date.split('T')[0] : ""}
                            className="w-full bg-slate-50 border-none rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">MMS Reference</label>
                        <input
                            name="mms_reference"
                            type="text"
                            defaultValue={initialData.mms_reference}
                            placeholder="Internal ID..."
                            className="w-full bg-slate-50 border-none rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary font-medium placeholder:text-slate-300"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 px-1">
                    <input
                        name="is_private"
                        type="checkbox"
                        id="is_private"
                        value="true"
                        defaultChecked={finding?.is_private}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="is_private" className="text-[11px] font-medium text-slate-500">
                        Keep this finding private (not visible to customers)
                    </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                        {isSubmitting ? "Saving..." : <><Save size={14} /> {finding ? "Update" : "Record Result"}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
