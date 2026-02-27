// Auto-generated types for the iClass Database Schema
// These types reflect the core entities to provide type safety across the frontend.

export type AdministrationTypeCode = 'C' | 'N' | 'O' | 'X' | 'U';
export type ClassStatusCode = 'V' | 'S' | 'W';
export type ShipStatusCode = 'E' | 'L' | 'P';
export type CertificateStatusCode = 'V' | 'S' | 'W';
export type TaskStatusEnum = 'draft' | 'submitted' | 'accepted' | 'partial' | 'assigned' | 'scheduled' | 'planning' | 'executing' | 'pending_review' | 'approved' | 'completed' | 'cancelled' | 'rejected';
export type DataTypeEnum = 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'selection' | 'multi_select';
export type ChecklistResultCode = 'N' | 'PI' | 'X' | 'D' | 'R' | 'NA' | 'NS' | 'OS';

export interface Organization {
    id: number;
    tenant_id?: string;
    name: string;
    display_name?: string;
    domain?: string;
    logo_url?: string;
    imo_number?: string;
    mlc_responsibility?: boolean;
    doc_ships_types?: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface Employee {
    id: number;
    user_id?: number;
    organization_id: number;
    first_name: string;
    last_name: string;
    display_name: string;
    email: string;
    is_active: boolean;
}

export interface Ship {
    id: number;
    class_number: number;
    name: string;
    previous_names?: string;
    build_date?: string;
    imo_number?: string;
    administration_types: AdministrationTypeCode;
    flag_code?: string;
    type_iacs: string;
    ship_status?: ShipStatusCode;
    class_status?: ClassStatusCode;
    gross_tons?: number;
    deadweight?: number;
    registered_owner_id?: number;
    ism_owner_id?: number;
    is_active: boolean;
}

export interface SurveyPool {
    id: number;
    code: string;
    name: string;
    description?: string;
    fee?: number;
    cert_code?: string;
    type?: string;
    is_statutory: boolean;
    is_audit: boolean;
    is_doc: boolean;
    is_mandatory: boolean;
    is_active: boolean;
    checklist_sections?: ChecklistSection[]; // Joined data
}

export interface ChecklistSection {
    id: number;
    survey_id?: number;
    code: string;
    section_number: string;
    title: string;
    description?: string;
    is_active: boolean;
    checklist_items?: ChecklistItem[]; // Joined data
}

export interface ChecklistItem {
    id: number;
    code?: string;
    item_number: number;
    section_id?: number;
    content?: string;
    description?: string;
    breakdown_template_node_id?: number;
    reg_reference?: string;
    is_mandatory: boolean;
    sort_order: number;
    is_active: boolean;
    checklist_item_particulars?: ChecklistItemParticular[]; // Joined data
}

export interface ChecklistItemParticular {
    id: number;
    checklist_item_id: number;
    attr_key: string;
    attr_title: string;
    data_type: DataTypeEnum;
    unit?: string;
    default_value?: string;
    selection_options?: string[];
    is_required: boolean;
    sort_order: number;
    description?: string;
}

export interface BreakdownTemplateNode {
    id: number;
    template_id: number;
    parent_node_id?: number;
    code: string;
    name: string;
    description?: string;
    category?: string;
    node_type?: string;
    level: number;
    sort_order: number;
    is_instantiable: boolean;
    default_quantity: number;
    is_active: boolean;
    metadata?: any;
}
