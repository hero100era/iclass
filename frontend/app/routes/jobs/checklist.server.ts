import { ApiGET, ApiPATCH } from "~/.server/lib/api";

export async function getChecklistData({ params, request }: any) {
    const { id } = params;
    const host = process.env.API_URL || "http://localhost:2000";

    const fetchJson = async (res: any, label?: string) => {
        try {
            if (!res.ok) {
                // console.error(`API Error [${label}]: ${res.status} ${res.statusText}`);
                return [];
            }
            const data = await res.json();
            // if (label) console.log(`API Success [${label}]:`, Array.isArray(data) ? data.length : 0, "items");
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error(`API Parse Error [${label}]:`, e);
            return [];
        }
    };

    const dummyRes = () => Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => []
    } as any);

    // 1. Get job and sub-jobs
    const [surveyJobRes, auditJobRes] = await Promise.all([
        ApiGET(request, `${host}/survey_jobs?job_id=eq.${id}`),
        ApiGET(request, `${host}/audit_jobs?job_id=eq.${id}`)
    ]);

    const [surveyJobs, auditJobs] = await Promise.all([
        fetchJson(surveyJobRes, "surveyJobs"),
        fetchJson(auditJobRes, "auditJobs")
    ]);

    const surveyJob = surveyJobs[0] || null;
    const auditJob = auditJobs[0] || null;

    // 2. Get survey/audit lines to know which surveys are in scope
    const [surveyLinesRes, auditLinesRes] = await Promise.all([
        surveyJob ? ApiGET(request, `${host}/survey_lines?job_id=eq.${surveyJob.id}&select=*,survey_audits(description,cert_code)`) : dummyRes(),
        auditJob ? ApiGET(request, `${host}/audit_lines?job_id=eq.${auditJob.id}&select=*,survey_audits(description,cert_code)`) : dummyRes()
    ]);

    const [surveyLines, auditLines] = await Promise.all([
        fetchJson(surveyLinesRes, "surveyLines"),
        fetchJson(auditLinesRes, "auditLines")
    ]);

    // 3. Get checklists and results
    const [surveyChecklistsRes, auditChecklistsRes, checklistResultsRes] = await Promise.all([
        surveyJob ? ApiGET(request, `${host}/survey_checklists?survey_job_id=eq.${surveyJob.id}&select=*,checklist_items(*,checklist_sections(*))`) : dummyRes(),
        auditJob ? ApiGET(request, `${host}/audit_checklists?audit_job_id=eq.${auditJob.id}&select=*,checklist_items(*,checklist_sections(*))`) : dummyRes(),
        ApiGET(request, `${host}/checklist_results`)
    ]);

    const [surveyChecklists, auditChecklists, checklistResults] = await Promise.all([
        fetchJson(surveyChecklistsRes, "surveyChecklists"),
        fetchJson(auditChecklistsRes, "auditChecklists"),
        fetchJson(checklistResultsRes, "checklistResults")
    ]);

    return {
        surveyLines,
        auditLines,
        surveyChecklists,
        auditChecklists,
        checklistResults,
        surveyJobId: surveyJob?.id,
        auditJobId: auditJob?.id
    };
}

export async function updateChecklistResult({ request }: any, { id, result, type }: any) {
    const host = process.env.API_URL || "http://localhost:2000";
    const endpoint = type === "survey" ? "survey_checklists" : "audit_checklists";

    const res = await ApiPATCH(request, `${host}/${endpoint}?id=eq.${id}`, { result });
    if (!res.ok) throw new Error("Failed to update result");
    return { success: true };
}

export async function updateChecklistParticulars({ request }: any, { id, particularsJson, type }: any) {
    const host = process.env.API_URL || "http://localhost:2000";
    const endpoint = type === "survey" ? "survey_checklists" : "audit_checklists";

    let particulars = {};
    try {
        particulars = JSON.parse(particularsJson as string);
    } catch (e) {
        throw new Error("Invalid JSON format for particulars");
    }

    const res = await ApiPATCH(request, `${host}/${endpoint}?id=eq.${id}`, { particulars });
    if (!res.ok) throw new Error("Failed to update particulars");
    return { success: true };
}
