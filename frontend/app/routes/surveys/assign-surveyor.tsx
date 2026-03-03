import { UserPlus, Trash2, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { useLoaderData, Form, useActionData } from "react-router";
import { ApiGET, ApiPOST, ApiDELETE } from "~/.server/lib/api";
import type { Route } from "./+types/assign-surveyor";

interface Employee {
  id: number;
  display_name: string;
  email: string;
}

interface Participant {
  id: number;
  employee_id: number;
  is_trainee: boolean;
  is_monitor: boolean;
  employees?: {
    display_name: string;
    email: string;
  };
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params;
  const host = process.env.API_URL || "http://localhost:2000";

  const [surveyJobRes, employeesRes] = await Promise.all([
    ApiGET(request, `${host}/survey_jobs?id=eq.${id}`),
    ApiGET(request, `${host}/employees?is_active=eq.true&order=display_name.asc`)
  ]);

  const surveyJobs = await surveyJobRes.json();
  const employees = await employeesRes.json();
  const surveyJobId = surveyJobs.length > 0 ? surveyJobs[0].id : null;

  let participants: Participant[] = [];
  if (surveyJobId) {
    const participantsRes = await ApiGET(request, `${host}/job_participants?survey_job_id=eq.${surveyJobId}&select=*,employees(display_name,email)`);
    participants = await participantsRes.json();
  }

  return { surveyJobId, participants, employees };
}

export async function action({ request, params: _params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const host = process.env.API_URL || "http://localhost:2000";

  if (intent === "add_participant") {
    const employeeId = formData.get("employee_id");
    const type = formData.get("participant_type");
    const surveyJobId = formData.get("survey_job_id");

    const data: Record<string, unknown> = {
      employee_id: parseInt(employeeId as string),
      is_trainee: type === "trainee",
      is_monitor: type === "monitor"
    };

    if (surveyJobId) data.survey_job_id = parseInt(surveyJobId as string);

    const res = await ApiPOST(request, `${host}/job_participants`, data);
    if (!res.ok) return { error: "Failed to add participant" };
    return { success: "Participant added" };
  }

  if (intent === "remove_participant") {
    const id = formData.get("id");
    const res = await ApiDELETE(request, `${host}/job_participants?id=eq.${id}`);
    if (!res.ok) return { error: "Failed to remove participant" };
    return { success: "Participant removed" };
  }

  return { error: "Unknown action" };
}

export default function RegisterScope() {
  const { surveyJobId, participants, employees } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Job Participants
        </h2>
        <p className="text-sm text-slate-500">Manage Team Members, Trainees, and Monitors for this job.</p>
      </div>

      {actionData?.error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded font-bold">
          {actionData.error}
        </div>
      )}

      {/* Current Participants */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3">Participant</th>
              <th className="px-4 py-3">Role / Purpose</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {participants.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">
                  No participants added yet.
                </td>
              </tr>
            ) : (
              participants.map((p: Participant) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{p.employees?.display_name}</div>
                    <div className="text-[11px] text-slate-400">{p.employees?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.is_trainee && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-bold">
                          <GraduationCap size={10} />
                          TRAINEE
                        </span>
                      )}
                      {p.is_monitor && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-bold">
                          <ShieldCheck size={10} />
                          MONITOR
                        </span>
                      )}
                      {!p.is_trainee && !p.is_monitor && (
                        <span className="text-slate-400">Team Member</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Form method="post">
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        name="intent"
                        value="remove_participant"
                        className="p-1.5 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded transition-all"
                        title="Remove Participant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </Form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Participant Form */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <UserPlus size={16} />
          Add New Participant
        </h3>
        <Form method="post" className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <input type="hidden" name="survey_job_id" value={surveyJobId || ""} />

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Select Employee</label>
            <select
              name="employee_id"
              required
              className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((e: Employee) => (
                <option key={e.id} value={e.id}>{e.display_name} ({e.email})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Participant Type</label>
            <select
              name="participant_type"
              className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="member">Team Member</option>
              <option value="trainee">Trainee</option>
              <option value="monitor">Monitor</option>
            </select>
          </div>

          <button
            type="submit"
            name="intent"
            value="add_participant"
            className="bg-primary text-primary-foreground font-bold text-sm px-4 py-2 rounded shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            Add Participant
          </button>
        </Form>
      </div>
    </div>
  );
}
