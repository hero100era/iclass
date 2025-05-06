import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { useState } from "react";

export default function SurveyInfo() {
  const [open, setOpen] = useState(false);

  return (
    < div className="border rounded-md mb-2" >
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
        <span className="font-medium text-blue-600">Surveys</span>
      </button>
      {open && (
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium text-gray-900">Survey</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">Category</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">Location</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">Last date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">Due from</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">Due to</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">Postponed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2">Main class renewal</td>
                  <td className="px-4 py-2">Class</td>
                  <td className="px-4 py-2">Jiangyin FIS</td>
                  <td className="px-4 py-2">2021-06-05</td>
                  <td className="px-4 py-2">2026-05-02</td>
                  <td className="px-4 py-2">2026-08-02</td>
                  <td className="px-4 py-2"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Main class intermediate</td>
                  <td className="px-4 py-2">Class</td>
                  <td className="px-4 py-2">Qingdao FIS</td>
                  <td className="px-4 py-2">2024-05-17</td>
                  <td className="px-4 py-2">2028-05-02</td>
                  <td className="px-4 py-2">2029-11-02</td>
                  <td className="px-4 py-2"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Main class annual</td>
                  <td className="px-4 py-2">Class</td>
                  <td className="px-4 py-2">Qingdao FIS</td>
                  <td className="px-4 py-2">2024-05-17</td>
                  <td className="px-4 py-2">2025-05-02</td>
                  <td className="px-4 py-2">2025-11-02</td>
                  <td className="px-4 py-2"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Hull items</td>
                  <td className="px-4 py-2">Class</td>
                  <td className="px-4 py-2">Jiangyin FIS</td>
                  <td className="px-4 py-2">2021-06-05</td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Machinery items</td>
                  <td className="px-4 py-2">Class</td>
                  <td className="px-4 py-2">Jiangyin FIS</td>
                  <td className="px-4 py-2">2021-06-05</td>
                  <td className="px-4 py-2">2026-05-02</td>
                  <td className="px-4 py-2">2026-08-02</td>
                  <td className="px-4 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div >
  );
}