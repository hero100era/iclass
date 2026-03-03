import { ApiGET, ApiPOST, ApiPATCH, ApiDELETE } from "~/.server/lib/api";

interface LoaderArgs {
  request: Request;
  params: { id: string };
}

interface ActionArgs {
  request: Request;
  params: { id: string };
}

export async function loader({ request, params }: LoaderArgs) {
  const host = process.env.API_URL || "http://localhost:2000";
  const vesselId = params.id;

  const [vesselRes, activeBreakdownRes, templatesRes] = await Promise.all([
    ApiGET(request, `${host}/ships?id=eq.${vesselId}&select=id,name,imo_number`),
    ApiGET(request, `${host}/ship_breakdowns?ship_id=eq.${vesselId}&is_active=eq.true`),
    ApiGET(request, `${host}/breakdown_templates?is_active=eq.true&order=name.asc`)
  ]);

  if (!vesselRes.ok) throw new Response("Vessel not found", { status: 404 });
  const vessels = await vesselRes.json();
  const vessel = vessels[0];
  if (!vessel) throw new Response("Vessel not found", { status: 404 });

  const activeBreakdowns = activeBreakdownRes.ok ? await activeBreakdownRes.json() : [];
  const activeBreakdown = activeBreakdowns[0] || null;

  let tree: unknown[] = [];
  let allParticulars: unknown[] = [];
  if (activeBreakdown) {
    const [treeRes, particularsRes] = await Promise.all([
      ApiGET(request, `${host}/v_ship_breakdown_tree?ship_breakdown_id=eq.${activeBreakdown.id}&order=sort_order.asc`),
      ApiGET(request, `${host}/ship_breakdown_node_particulars?ship_breakdown_id=eq.${activeBreakdown.id}&order=sort_order.asc`)
    ]);
    if (treeRes.ok) tree = await treeRes.json();
    if (particularsRes.ok) allParticulars = await particularsRes.json();
  }

  const templates = templatesRes.ok ? await templatesRes.json() : [];

  let templateNodes: unknown[] = [];
  if (activeBreakdown?.template_id) {
    const nodesRes = await ApiGET(request, `${host}/breakdown_template_nodes?template_id=eq.${activeBreakdown.template_id}&is_active=eq.true&order=code.asc`);
    if (nodesRes.ok) templateNodes = await nodesRes.json();
  }

  return {
    vessel,
    activeBreakdown,
    tree,
    allParticulars,
    templates,
    templateNodes,
    vesselId: parseInt(vesselId)
  };
}

export async function action({ request, params }: ActionArgs) {
  const host = process.env.API_URL || "http://localhost:2000";
  const formData = await request.formData();
  const intent = formData.get("intent");
  const vesselId = parseInt(params.id);

  if (intent === "apply_template") {
    const templateId = parseInt(formData.get("template_id") as string);

    const res = await ApiPOST(request, `${host}/rpc/fn_apply_template_to_ship`, {
      p_ship_id: vesselId,
      p_template_id: templateId,
      p_applied_by: "system"
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || "Failed to apply template" };
    }

    return { success: true };
  }

  if (intent === "create_manual_breakdown") {
    const res = await ApiPOST(request, `${host}/ship_breakdowns`, {
      ship_id: vesselId,
      name: "Manual Breakdown",
      description: "Manually initialized breakdown structure",
      is_active: true
    });

    if (!res.ok) return { success: false, error: "Failed to create manual breakdown" };
    return { success: true };
  }

  if (intent === "add_custom_node") {
    const parentId = formData.get("parent_id") ? parseInt(formData.get("parent_id") as string) : null;
    const breakdownId = parseInt(formData.get("breakdown_id") as string);
    const code = formData.get("code") as string;
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;

    const res = await ApiPOST(request, `${host}/rpc/fn_add_ship_specific_node`, {
      p_ship_breakdown_id: breakdownId,
      p_parent_node_id: parentId,
      p_code: code,
      p_name: name,
      p_category: category
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || "Failed to add custom node" };
    }

    return { success: true };
  }

  if (intent === "add_template_node") {
    const parentId = formData.get("parent_id") ? parseInt(formData.get("parent_id") as string) : null;
    const breakdownId = parseInt(formData.get("breakdown_id") as string);
    const templateNodeId = parseInt(formData.get("template_node_id") as string);

    const res = await ApiPOST(request, `${host}/rpc/fn_instantiate_template_node`, {
      p_ship_breakdown_id: breakdownId,
      p_parent_ship_node_id: parentId,
      p_template_node_id: templateNodeId
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || "Failed to add template node" };
    }

    return { success: true };
  }

  if (intent === "delete_node") {
    const id = parseInt(formData.get("id") as string);
    const res = await ApiDELETE(request, `${host}/ship_breakdown_nodes?id=eq.${id}`);

    if (!res.ok) return { success: false, error: "Failed to delete node" };
    return { success: true };
  }

  if (intent === "copy_node") {
    const id = parseInt(formData.get("id") as string);
    const res = await ApiPOST(request, `${host}/rpc/fn_copy_ship_breakdown_node`, {
      p_source_node_id: id
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || "Failed to copy node" };
    }
    return { success: true };
  }

  if (intent === "update_node_info") {
    const id = parseInt(formData.get("id") as string);
    const code = formData.get("code");
    const name = formData.get("name");
    const category = formData.get("category");
    const node_type = formData.get("node_type");
    const description = formData.get("description");
    const sort_order = parseInt(formData.get("sort_order") as string) || 0;

    const res = await ApiPATCH(request, `${host}/ship_breakdown_nodes?id=eq.${id}`, {
      code,
      name,
      category,
      node_type,
      description,
      sort_order,
      is_modified: true
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || "Failed to update node info" };
    }
    return { success: true };
  }

  if (intent === "save_particulars") {
    const nodeId = formData.get("node_id");
    const particularsJson = formData.get("particulars");
    let particulars: unknown[] = [];
    try {
      particulars = JSON.parse(particularsJson as string);
    } catch {
      return { success: false, error: "Invalid particulars format" };
    }

    // Sync particulars: delete existing and insert new
    await ApiDELETE(request, `${host}/ship_breakdown_node_particulars?ship_breakdown_node_id=eq.${nodeId}`);
    if (particulars.length > 0) {
      const dataToInsert = particulars.map((p) => {
        const { ...pData } = p as Record<string, unknown>;
        return {
          ...pData,
          ship_breakdown_node_id: parseInt(nodeId as string)
        };
      });
      const res = await ApiPOST(request, `${host}/ship_breakdown_node_particulars`, dataToInsert);
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: `Failed to save particulars: ${err.message}` };
      }
    }
    return { success: true };
  }

  // Legacy update_node for backward compatibility if needed, but we'll use new ones
  if (intent === "update_node") {
    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name");
    const description = formData.get("description");
    const particularsJson = formData.get("particulars");

    const nodeRes = await ApiPATCH(request, `${host}/ship_breakdown_nodes?id=eq.${id}`, {
      name,
      description,
      is_modified: true
    });

    if (!nodeRes.ok) return { success: false, error: "Failed to update node" };

    if (particularsJson) {
      const particulars = JSON.parse(particularsJson as string);
      for (const p of particulars) {
        await ApiPATCH(request, `${host}/ship_breakdown_node_particulars?id=eq.${p.id}`, {
          attr_value: p.attr_value,
          is_modified: true
        });
      }
    }
    return { success: true };
  }

  return { error: "Unknown action" };
}
