import { getDb } from "~/.server/lib/api";


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
    const db = await getDb(request);

    const { data: surveyJobs } = await db.get<any[]>("/survey_jobs", {
        filters: { id: `eq.${id}` },
    });
    const surveyJob = surveyJobs?.[0] || null;

    const { data: surveyLines } = surveyJob
        ? await db.get<any[]>("/survey_lines", {
            filters: { job_id: `eq.${surveyJob.id}` },
            select: "*,survey_audits(description,cert_code),survey_pool(name,code)",
        })
        : { data: [] };

    const checklistSelect = `*,checklist_items(*,checklist_sections(*),breakdown_template_nodes(*))`;
    const [{ data: surveyChecklists }, { data: checklistResults }] =
        await Promise.all([
            surveyJob
                ? db.get<any[]>("/survey_checklists", {
                    filters: { survey_job_id: `eq.${surveyJob.id}` },
                    select: `${checklistSelect},survey_checklist_item_particulars(*,ship_breakdown_nodes(name,code))`,
                })
                : Promise.resolve({ data: [] }),
            db.get<any[]>("/checklist_results"),
        ]);

    return {
        surveyLines: surveyLines || [],
        surveyChecklists: mapParticulars(
            surveyChecklists as SurveyChecklist[],
            "survey_checklist_item_particulars",
        ),
        checklistResults: checklistResults || [],
        surveyJobId: surveyJob?.id,
    };
}


interface ActionParams {
    request: Request;
}

interface UpdateResultParams {
    id: number;
    result: string;
}

export async function updateChecklistResult(
    { request }: ActionParams,
    { id, result }: UpdateResultParams,
) {
    const db = await getDb(request);
    await db.patch("/survey_checklists", {
        filters: { id: `eq.${id}` },
        body: { result },
    });
    return { success: true };
}


interface UpdateParticularsParams {
    id: number;
    particularsJson: string;
}

export async function updateChecklistParticulars(
    { request }: ActionParams,
    { id: _id, particularsJson }: UpdateParticularsParams,
) {
    const db = await getDb(request);
    let particulars: Particular[] = [];
    try {
        particulars = JSON.parse(particularsJson);
    } catch {
        throw new Error("Invalid JSON format for particulars");
    }

    for (const p of particulars) {
        if (p.id) {
            await db.patch("/survey_checklist_item_particulars", {
                filters: { id: `eq.${p.id}` },
                body: {
                    attr_result: p.result,
                },
            });
        }
    }

    return { success: true };
}

