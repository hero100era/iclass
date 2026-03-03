import { ApiGET, ApiPATCH } from "~/.server/lib/api";

const API_HOST = process.env.API_URL || "http://localhost:2000";

interface ApiResponse {
    ok: boolean;
    json: () => Promise<unknown>;
}

interface Particular {
    id?: number;
    attr_key?: string;
    attr_title?: string;
    data_type?: string;
    attr_result?: string;
    result?: string;
    [key: string]: unknown;
}

interface SurveyChecklist {
    id: number;
    survey_checklist_item_particulars?: Particular[];
    [key: string]: unknown;
}

async function fetchJson(res: ApiResponse, label?: string): Promise<unknown[]> {
    try {
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error(`API Parse Error [${label}]:`, e);
        return [];
    }
}

function mapParticulars(items: SurveyChecklist[], sourceKey: string): SurveyChecklist[] {
    return items.map((item) => ({
        ...item,
        particulars: ((item[sourceKey] as Particular[]) || []).map((p) => ({
            ...p,
            result: p.attr_result || "",
            type: p.data_type,
            title: p.attr_title
        }))
    }));
}

interface LoaderParams {
    params: { id: string };
    request: Request;
}

export async function getChecklistData({ params, request }: LoaderParams) {
    const { id } = params;

    const surveyJobs = await ApiGET(request, `${API_HOST}/survey_jobs?id=eq.${id}`).then(r => fetchJson(r, "surveyJobs"));
    const surveyJob = surveyJobs[0] as Record<string, unknown> | null;

    const surveyLines = surveyJob
        ? await ApiGET(request, `${API_HOST}/survey_lines?job_id=eq.${surveyJob.id}&select=*,survey_audits(description,cert_code),survey_pool(name,code)`).then(r => fetchJson(r, "surveyLines"))
        : [];

    const checklistSelect = `*,checklist_items(*,checklist_sections(*),breakdown_template_nodes(*))`;
    const [surveyChecklistsRaw, checklistResults] = await Promise.all([
        surveyJob ? ApiGET(request, `${API_HOST}/survey_checklists?survey_job_id=eq.${surveyJob.id}&select=${checklistSelect},survey_checklist_item_particulars(*,ship_breakdown_nodes(name,code))`).then(r => fetchJson(r, "surveyChecklists")) : [],
        ApiGET(request, `${API_HOST}/checklist_results`).then(r => fetchJson(r, "checklistResults"))
    ]);

    return {
        surveyLines,
        surveyChecklists: mapParticulars(surveyChecklistsRaw as SurveyChecklist[], "survey_checklist_item_particulars"),
        checklistResults,
        surveyJobId: surveyJob?.id
    };
}

interface ActionParams {
    request: Request;
}

interface UpdateResultParams {
    id: number;
    result: string;
}

export async function updateChecklistResult({ request }: ActionParams, { id, result }: UpdateResultParams) {
    const res = await ApiPATCH(request, `${API_HOST}/survey_checklists?id=eq.${id}`, { result });
    if (!res.ok) throw new Error("Failed to update result");
    return { success: true };
}

interface UpdateParticularsParams {
    id: number;
    particularsJson: string;
}

export async function updateChecklistParticulars({ request }: ActionParams, { id: _id, particularsJson }: UpdateParticularsParams) {
    let particulars: Particular[] = [];
    try {
        particulars = JSON.parse(particularsJson);
    } catch {
        throw new Error("Invalid JSON format for particulars");
    }

    for (const p of particulars) {
        if (p.id) {
            await ApiPATCH(request, `${API_HOST}/survey_checklist_item_particulars?id=eq.${p.id}`, {
                attr_result: p.result
            });
        }
    }

    return { success: true };
}
