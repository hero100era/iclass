import { ChevronRight, ChevronDown, Plus, Copy, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";

import type { BreakdownNode } from "../breakdowns.types";

interface TreeItemProps {
  node: BreakdownNode;
  selectedNodeId?: number;
  expandedNodes: Set<number>;
  onSelect: (node: BreakdownNode) => void;
  onToggleExpand: (id: number) => void;
  onAddChild: (node: BreakdownNode) => void;
  onCopy: (id: number) => void;
  onDelete: (id: number) => void;
}

function TreeItem({
  node,
  selectedNodeId,
  expandedNodes,
  onSelect,
  onToggleExpand,
  onAddChild,
  onCopy,
  onDelete,
}: TreeItemProps) {
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodeId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all",
          isSelected ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-slate-50 text-slate-600",
        )}
        onClick={() => onSelect(node)}
      >
        <div
          className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-slate-300 group-hover:text-primary/40">
            {node.code}
          </span>
          <span className="text-xs font-semibold truncate">{node.name}</span>
          {node.is_modified && (
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Modified from template" />
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node);
            }}
            className="p-1 hover:bg-white rounded text-slate-400 hover:text-primary transition-colors"
            title="Add Child"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(node.id);
            }}
            className="p-1 hover:bg-white rounded text-slate-400 hover:text-primary transition-colors"
            title="Copy Node"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="p-1 hover:bg-white rounded text-slate-400 hover:text-red-500 transition-colors"
            title="Delete Node"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div className="ml-4 border-l border-slate-100 pl-2 mt-1 space-y-0.5">
          {node.children?.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onCopy={onCopy}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BreakdownTreeProps {
  rootNodes: BreakdownNode[];
  selectedNodeId?: number;
  expandedNodes: Set<number>;
  onSelect: (node: BreakdownNode) => void;
  onToggleExpand: (id: number) => void;
  onAddChild: (node: BreakdownNode) => void;
  onCopy: (id: number) => void;
  onDelete: (id: number) => void;
  onAddCustom: () => void;
}

export function BreakdownTree({
  rootNodes,
  selectedNodeId,
  expandedNodes,
  onSelect,
  onToggleExpand,
  onAddChild,
  onCopy,
  onDelete,
  onAddCustom,
}: BreakdownTreeProps) {
  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Equipment Tree
        </h3>
        <button
          onClick={onAddCustom}
          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
        >
          <Plus size={12} /> Add Custom
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-1">
          {rootNodes.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onCopy={onCopy}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
