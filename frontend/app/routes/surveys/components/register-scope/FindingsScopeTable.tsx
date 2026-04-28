import { Plus, Trash2 } from "lucide-react";
import { Form } from "react-router";
import { formatDate } from "~/lib/format";
import { cn } from "~/lib/utils";

export interface FindingCommentProps {
  id: number;
  comment_type?: string;
  text?: string;
  date_issued?: string;
  due_date?: string;
}

export interface CommentLineProps {
  id: number;
  finding_comment?: FindingCommentProps;
}

interface FindingsScopeTableProps {
  commentLines: CommentLineProps[];
  availableFindings: FindingCommentProps[];
  isSubmitting: boolean;
  jobId: number;
}

export function FindingsScopeTable({
  commentLines,
  availableFindings,
  isSubmitting,
  jobId,
}: FindingsScopeTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Findings / Recommendations Scope
        </h3>
      </div>
      <table className="w-full text-left text-[11px]">
        <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
          <tr>
            <th className="px-4 py-2 w-10">Type</th>
            <th className="px-4 py-2">Details</th>
            <th className="px-4 py-2">Issued</th>
            <th className="px-4 py-2">Due Date</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {commentLines.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                No recommendations linked.
              </td>
            </tr>
          ) : (
            commentLines.map((line) => (
              <tr key={line.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-2">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                      line.finding_comment?.comment_type === "condition"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {line.finding_comment?.comment_type}
                  </span>
                </td>
                <td className="px-4 py-2 font-medium text-slate-900">
                  {line.finding_comment?.text}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {formatDate(line.finding_comment?.date_issued)}
                </td>
                <td className="px-4 py-2 font-bold">
                  {formatDate(line.finding_comment?.due_date)}
                </td>
                <td className="px-4 py-2 text-right">
                  <Form method="post">
                    <input type="hidden" name="line_id" value={line.id} />
                    <button
                      type="submit"
                      name="intent"
                      value="remove_comment_line"
                      disabled={isSubmitting}
                      className="p-1.5 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </Form>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="p-4 bg-slate-50/50 border-t">
        <Form method="post" className="flex items-end gap-2 max-w-lg">
          <input type="hidden" name="job_id" value={jobId} />
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Link Open Finding
            </label>
            <select
              name="finding_id"
              className="w-full bg-white border rounded px-2 py-1.5 text-xs"
            >
              <option value="">-- Select Open Finding --</option>
              {availableFindings.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.text?.substring(0, 60)}...
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            name="intent"
            value="add_finding"
            disabled={isSubmitting}
            className="bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5"
          >
            <Plus size={14} /> Link
          </button>
        </Form>
      </div>
    </div>
  );
}
