import { getDb } from "../../.server/lib/api";
import type { Ship, ShipBreakdown, BreakdownTemplate, ShipBreakdownNodeParticular, BreakdownTemplateNode } from "~/definitions/database.iclass.types";

interface LoaderArgs {
  request: Request;
  params: { id: string };
}

interface ActionArgs {
  request: Request;
  params: { id: string };
}

export async function loader({ request, params }: LoaderArgs) {
  const vesselId = params.id;
  const db = await getDb(request);

  const [{ data: vessels }, { data: activeBreakdowns }, { data: templates }] =
    await Promise.all([
      db.get<Ship[]>("/ships", {
        filters: { id: `eq.${vesselId}` },
        select: "id,name,imo_number",
      }),
      db.get<ShipBreakdown[]>("/ship_breakdowns", {
        filters: { ship_id: `eq.${vesselId}`, is_active: "eq.true" },
      }),
      db.get<BreakdownTemplate[]>("/breakdown_templates", {
        filters: { is_active: "eq.true" },
        order: "name.asc",
      }),
    ]);

  const vessel = vessels?.[0];
  if (!vessel) throw new Response("Vessel not found", { status: 404 });

  const activeBreakdown = activeBreakdowns?.[0] || null;

  let tree: Record<string, unknown>[] = [];
  let allParticulars: ShipBreakdownNodeParticular[] = [];
  if (activeBreakdown) {
    const [{ data: treeData }, { data: particularsData }] = await Promise.all([
      db.get<Record<string, unknown>[]>("/v_ship_breakdown_tree", {
        filters: { ship_breakdown_id: `eq.${activeBreakdown.id}` },
        order: "sort_order.asc",
      }),
      db.get<ShipBreakdownNodeParticular[]>("/ship_breakdown_node_particulars", {
        filters: { ship_breakdown_id: `eq.${activeBreakdown.id}` },
        order: "sort_order.asc",
      }),
    ]);
    tree = treeData || [];
    allParticulars = particularsData || [];
  }

  let templateNodes: BreakdownTemplateNode[] = [];
  if (activeBreakdown?.template_id) {
    const { data: nodes } = await db.get<BreakdownTemplateNode[]>("/breakdown_template_nodes", {
      filters: {
        template_id: `eq.${activeBreakdown.template_id}`,
        is_active: "eq.true",
      },
      order: "code.asc",
    });
    templateNodes = nodes || [];
  }

  return {
    vessel,
    activeBreakdown,
    tree,
    allParticulars,
    templates: templates || [],
    templateNodes: templateNodes || [],
    vesselId: parseInt(vesselId),
  };
}

export async function action({ request, params }: ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const vesselId = parseInt(params.id);

  try {
    const db = await getDb(request);

    if (intent === "apply_template") {
      const templateId = parseInt(formData.get("template_id") as string);

      await db.rpc("fn_apply_template_to_ship", {
        body: {
          p_ship_id: vesselId,
          p_template_id: templateId,
          p_applied_by: "system",
        },
      });

      return { success: true };
    }

    if (intent === "create_manual_breakdown") {
      await db.post("/ship_breakdowns", {
        body: {
          ship_id: vesselId,
          name: "Manual Breakdown",
          description: "Manually initialized breakdown structure",
          is_active: true,
        },
      });

      return { success: true };
    }

    if (intent === "add_custom_node") {
      const parentId = formData.get("parent_id")
        ? parseInt(formData.get("parent_id") as string)
        : null;
      const breakdownId = parseInt(formData.get("breakdown_id") as string);
      const code = formData.get("code") as string;
      const name = formData.get("name") as string;
      const category = formData.get("category") as string;

      await db.rpc("fn_add_ship_specific_node", {
        body: {
          p_ship_breakdown_id: breakdownId,
          p_parent_node_id: parentId,
          p_code: code,
          p_name: name,
          p_category: category,
        },
      });

      return { success: true };
    }

    if (intent === "add_template_node") {
      const parentId = formData.get("parent_id")
        ? parseInt(formData.get("parent_id") as string)
        : null;
      const breakdownId = parseInt(formData.get("breakdown_id") as string);
      const templateNodeId = parseInt(
        formData.get("template_node_id") as string,
      );

      await db.rpc("fn_instantiate_template_node", {
        body: {
          p_ship_breakdown_id: breakdownId,
          p_parent_ship_node_id: parentId,
          p_template_node_id: templateNodeId,
        },
      });

      return { success: true };
    }

    if (intent === "delete_node") {
      const id = parseInt(formData.get("id") as string);
      await db.delete("/ship_breakdown_nodes", { filters: { id: `eq.${id}` } });
      return { success: true };
    }

    if (intent === "copy_node") {
      const id = parseInt(formData.get("id") as string);
      await db.rpc("fn_copy_ship_breakdown_node", {
        body: {
          p_source_node_id: id,
        },
      });
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

      await db.patch("/ship_breakdown_nodes", {
        filters: { id: `eq.${id}` },
        body: {
          code,
          name,
          category,
          node_type,
          description,
          sort_order,
          is_modified: true,
        },
      });
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
      await db.delete("/ship_breakdown_node_particulars", {
        filters: { ship_breakdown_node_id: `eq.${nodeId}` },
      });
      if (particulars.length > 0) {
        const dataToInsert = particulars.map((p) => {
          const { ...pData } = p as Record<string, unknown>;
          return {
            ...pData,
            ship_breakdown_node_id: parseInt(nodeId as string),
          };
        });
        await db.post("/ship_breakdown_node_particulars", {
          body: dataToInsert,
        });
      }
      return { success: true };
    }

    if (intent === "update_node") {
      const id = parseInt(formData.get("id") as string);
      const name = formData.get("name");
      const description = formData.get("description");
      const particularsJson = formData.get("particulars");

      await db.patch("/ship_breakdown_nodes", {
        filters: { id: `eq.${id}` },
        body: {
          name,
          description,
          is_modified: true,
        },
      });

      if (particularsJson) {
        const particulars = JSON.parse(particularsJson as string);
        for (const p of particulars) {
          await db.patch("/ship_breakdown_node_particulars", {
            filters: { id: `eq.${p.id}` },
            body: {
              attr_value: p.attr_value,
              is_modified: true,
            },
          });
        }
      }
      return { success: true };
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to perform action",
    };
  }

  return { error: "Unknown action" };
}
