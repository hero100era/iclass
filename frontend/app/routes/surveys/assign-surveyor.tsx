import { UserPlus, Trash2, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { useLoaderData, Form, useActionData } from "react-router";
import { getDb } from "~/.server/lib/api";

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
  const db = await getDb(request);

  const [{ data: surveyJobs }, { data: employees }, { data: participants }] =
    await Promise.all([
      db.get<any[]>("/survey_jobs", {
        filters: { id: `eq.${id}` },
        select: "id,job_id",
      }),
      db.get<Employee[]>("/employees", {
        filters: { is_active: "eq.true" },
        order: "display_name.asc",
      }),
      db.get<Participant[]>("/job_participants", {
        filters: { survey_job_id: `eq.${id}` },
        select: "*,employees(*)",
      }),
    ]);

  const surveyJobId = surveyJobs?.[0]?.id || null;

  return {
    surveyJobId,
    participants: participants || [],
    employees: employees || [],
  };
}


export async function action({ request, params: _params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    const db = await getDb(request);

    if (intent === "add_participant") {
      const employeeId = formData.get("employee_id");
      const type = formData.get("participant_type");
      const surveyJobId = formData.get("survey_job_id");

      await db.post("/job_participants", {
        body: {
          survey_job_id: Number(surveyJobId),
          employee_id: Number(employeeId),
          is_trainee: type === "trainee",
          is_monitor: type === "monitor",
        },
      });
      return { success: "Participant added" };
    }

    if (intent === "remove_participant") {
      const participantId = formData.get("id");
      await db.delete("/job_participants", {
        filters: { id: `eq.${participantId}` },
      });
      return { success: "Participant removed" };
    }
  } catch (error: any) {
    return { error: error.message || "Failed to perform action" };
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
