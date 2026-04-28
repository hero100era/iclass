export interface BreakdownNode {
  id: number;
  template_id: number;
  parent_node_id: number | null;
  code: string;
  name: string;
  category?: string;
  node_type?: string;
  sort_order: number;
  level: number;
  children?: BreakdownNode[];
}

export interface Particular {
  id?: number;
  template_node_id?: number;
  attr_key: string;
  attr_title: string;
  data_type: string;
  unit?: string | null;
  sort_order: number;
}

export interface NewNodeData {
  code: string;
  name: string;
  category: string;
  node_type: string;
  parentId: number | null;
  level: number;
}
