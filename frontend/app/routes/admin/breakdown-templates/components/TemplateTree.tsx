import { ChevronRight, ChevronDown, Plus, Copy, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";

import type { BreakdownNode } from "../breakdown-templates.types";

interface TemplateTreeProps {
    nodes: BreakdownNode[];
    selectedNodeId?: number;
    expandedNodes: Set<number>;
    onSelect: (node: BreakdownNode) => void;
    onToggleExpand: (id: number) => void;
    onAddChild: (node: BreakdownNode) => void;
    onCopy: (id: number) => void;
    onDelete: (id: number) => void;
}

export function TemplateTree({
    nodes,
    selectedNodeId,
    expandedNodes,
    onSelect,
    onToggleExpand,
    onAddChild,
    onCopy,
    onDelete,
}: TemplateTreeProps) {
    const renderNode = (node: BreakdownNode) => {
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = selectedNodeId === node.id;
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.id} className="select-none">
                <div
                    className={cn(
                        "group flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all",
                        isSelected ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50 text-slate-600"
                    )}
                    onClick={() => onSelect(node)}
                >
                    <div
                        className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-emerald-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(node.id);
                        }}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        ) : (
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-300 group-hover:text-emerald-300">{node.code}</span>
                        <span className="text-xs font-semibold truncate">{node.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddChild(node); }}
                            className="p-1 hover:bg-emerald-100 rounded text-emerald-600"
                            title="Add Child"
                        >
                            <Plus size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopy(node.id); }}
                            className="p-1 hover:bg-amber-100 rounded text-amber-600"
                            title="Copy Node"
                        >
                            <Copy size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                            className="p-1 hover:bg-destructive/10 rounded text-destructive"
                            title="Delete Node"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
                {isExpanded && hasChildren && (
                    <div className="ml-4 border-l border-slate-100 pl-2 mt-1 space-y-0.5">
                        {node.children?.map(child => renderNode(child))}
                    </div>
                )}
            </div>
        );
    };

    return <div className="space-y-1">{nodes.map(node => renderNode(node))}</div>;
}
