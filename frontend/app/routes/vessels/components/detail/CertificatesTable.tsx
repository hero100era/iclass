import { FileText } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/Accordion";
import { StatusBadge } from "~/components/ui/DetailHelpers";

interface Certificate {
  id: number;
  description?: string;
  certificate_id?: string;
  issue_date?: string;
  expiry_date?: string;
  status?: string;
}

interface CertificatesTableProps {
  certificates: Certificate[];
}

export function CertificatesTable({ certificates }: CertificatesTableProps) {
  return (
    <AccordionItem value="certificates">
      <AccordionTrigger>
        <span className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" /> Certificates ({certificates.length})
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
              <tr>
                <th className="px-4 py-3 font-medium">Certificate</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {cert.description || cert.certificate_id}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{cert.issue_date}</td>
                  <td className="px-4 py-3 text-slate-600">{cert.expiry_date}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={cert.status || "Valid"} />
                  </td>
                </tr>
              ))}
              {certificates.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                    No certificates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
