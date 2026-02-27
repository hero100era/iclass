import { ApiGET, ApiPATCH } from "~/.server/lib/api";

const API_HOST = process.env.API_URL || "http://localhost:2000";

async function fetchJson(res: any, label?: string) {
    try {
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error(`API Parse Error [${label}]:`, e);
        return [];
    }
}

function mapParticulars(items: any[], sourceKey: string) {
    return items.map((item: any) => ({
        ...item,
        particulars: (item[sourceKey] || []).map((p: any) => ({
            ...p,
            result: p.attr_result || "",
            type: p.data_type,
            title: p.attr_title
        }))
    }));
}

export async function getChecklistData({ params, request }: any) {
    const { id } = params;

    // 1. Get job and sub-jobs
    const [surveyJobs, auditJobs] = await Promise.all([
        ApiGET(request, `${API_HOST}/survey_jobs?job_id=eq.${id}`).then(r => fetchJson(r, "surveyJobs")),
        ApiGET(request, `${API_HOST}/audit_jobs?job_id=eq.${id}`).then(r => fetchJson(r, "auditJobs"))
    ]);

    const surveyJob = surveyJobs[0] || null;
    const auditJob = auditJobs[0] || null;

    // 2. Get survey/audit lines
    const [surveyLines, auditLines] = await Promise.all([
        surveyJob ? ApiGET(request, `${API_HOST}/survey_lines?job_id=eq.${surveyJob.id}&select=*,survey_audits(description,cert_code),survey_pool(name,code)`).then(r => fetchJson(r, "surveyLines")) : [],
        auditJob ? ApiGET(request, `${API_HOST}/audit_lines?job_id=eq.${auditJob.id}&select=*,survey_audits(description,cert_code),survey_pool(name,code)`).then(r => fetchJson(r, "auditLines")) : []
    ]);

    // 3. Get checklists and results
    const checklistSelect = `*,checklist_items(*,checklist_sections(*),breakdown_template_nodes(*))`;
    const [surveyChecklistsRaw, auditChecklistsRaw, checklistResults] = await Promise.all([
        surveyJob ? ApiGET(request, `${API_HOST}/survey_checklists?survey_job_id=eq.${surveyJob.id}&select=${checklistSelect},survey_checklist_item_particulars(*,ship_breakdown_nodes(name,code))`).then(r => fetchJson(r, "surveyChecklists")) : [],
        auditJob ? ApiGET(request, `${API_HOST}/audit_checklists?audit_job_id=eq.${auditJob.id}&select=${checklistSelect},audit_checklist_item_particulars(*,ship_breakdown_nodes(name,code))`).then(r => fetchJson(r, "auditChecklists")) : [],
        ApiGET(request, `${API_HOST}/checklist_results`).then(r => fetchJson(r, "checklistResults"))
    ]);

    return {
        surveyLines,
        auditLines,
        surveyChecklists: mapParticulars(surveyChecklistsRaw, "survey_checklist_item_particulars"),
        auditChecklists: mapParticulars(auditChecklistsRaw, "audit_checklist_item_particulars"),
        checklistResults,
        surveyJobId: surveyJob?.id,
        auditJobId: auditJob?.id
    };
}

export async function updateChecklistResult({ request }: any, { id, result, type }: any) {
    const endpoint = type === "survey" ? "survey_checklists" : "audit_checklists";
    const res = await ApiPATCH(request, `${API_HOST}/${endpoint}?id=eq.${id}`, { result });
    if (!res.ok) throw new Error("Failed to update result");
    return { success: true };
}

export async function updateChecklistParticulars({ request }: any, { id, particularsJson, type }: any) {
    const endpoint = type === "survey" ? "survey_checklist_item_particulars" : "audit_checklist_item_particulars";

    let particulars = [];
    try {
        particulars = JSON.parse(particularsJson as string);
    } catch (e) {
        throw new Error("Invalid JSON format for particulars");
    }

    for (const p of particulars) {
        if (p.id) {
            await ApiPATCH(request, `${API_HOST}/${endpoint}?id=eq.${p.id}`, {
                attr_result: p.result
            });
        }
    }

    return { success: true };
}
