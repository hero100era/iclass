export interface BreakdownNode {
  id: number;
  parent_node_id: number | null;
  code: string;
  name: string;
  category?: string;
  node_type?: string;
  description?: string;
  sort_order?: number;
  template_node_id?: number | null;
  is_modified?: boolean;
  children?: BreakdownNode[];
}

export interface Particular {
  id?: number;
  ship_breakdown_node_id?: number;
  attr_key: string;
  attr_title: string;
  attr_value: string | null | undefined;
  data_type: string;
  unit: string | null;
  sort_order: number;
}

export interface NewNodeData {
  parentId: number | null;
  parentTemplateNodeId: number | null;
  code: string;
  name: string;
  category: string;
  templateNodeId: number | null;
}
