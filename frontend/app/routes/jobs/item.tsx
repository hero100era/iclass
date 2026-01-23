import { ClipboardCheck } from "lucide-react";
import { useParams } from "react-router";

export default function JobItem() {
    const { itemId } = useParams();

    return (
        <div className="bg-white border border-slate-200 rounded shadow-sm min-h-full p-8 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <ClipboardCheck size={24} className="opacity-30 text-[#005EAA]" />
            </div>
            <div className="text-center">
                <h3 className="text-sm font-bold text-slate-600 italic">Page: {itemId}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    This is a separate route for <span className="text-[#005EAA] font-bold">{itemId}</span>.
                    It can now have its own loader and action.
                </p>
            </div>
            <div className="pt-4 grid grid-cols-1 gap-2 w-full max-w-md border-t border-slate-50 mt-4">
                <div className="p-2 bg-slate-50/50 rounded border border-dashed border-slate-200">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Architecture</p>
                    <p className="text-xs text-slate-600 font-medium">Nested Routing enabled</p>
                </div>
            </div>
        </div>
    );
}
