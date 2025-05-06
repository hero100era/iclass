import { AnchorIcon, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function ClassInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-md mb-2">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 p-3 text-left ${open ? "bg-blue-50" : "bg-white"
          }`}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-blue-600" />
        )}
        <span className="font-medium text-blue-600">Classification</span>
      </button>

      {open && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-full">
              <div className="grid grid-cols-1 gap-2">
                <div className="text-gray-600">Class Notation:</div>
                <div className="font-medium flex items-center">
                  <AnchorIcon size={16} />  1A General dry cargo ship BIS HC(A) Holds(2,4)may be empty TMON
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Register information:</div>
                <div className="font-medium"></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Type:</div>
                <div className="font-medium">301 - General cargo (single deck)</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Converted:</div>
                <div className="font-medium">2022-03-18 - Change of type</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Previous class society:</div>
                <div className="font-medium">Lloyd's Register</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Class entry:</div>
                <div className="font-medium">2016-09-01</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Dual class:</div>
                <div className="font-medium"></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Equipment number:</div>
                <div className="font-medium"></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Class request:</div>
                <div className="font-medium"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Class assignment:</div>
                <div className="font-medium">2016-09-01</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Commissioning:</div>
                <div className="font-medium"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}