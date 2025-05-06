import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function OwnerInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-md mb-2">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 p-3 text-left ${open ? "bg-blue-50" : "bg-white"}`}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-blue-600" />
        )}
        <span className="font-medium text-blue-600">Owner</span>
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">Owner:</div>
              <div className="font-medium">
                Good Shape Ltd (10611362)
                <br />
                (IMO number: 4105965)
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">Manager:</div>
              <div className="font-medium">
                Pacific Basin Shipping (HK) Ltd. (187838)
                <br />
                (IMO number: 5105614)
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">ISM/DOC holder:</div>
              <div className="font-medium">
                Pacific Basin Shipping (HK) Ltd. (187838)
                <br />
                (IMO number: 5105614)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}