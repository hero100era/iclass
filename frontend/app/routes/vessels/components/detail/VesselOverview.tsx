import { Info, FileBadge, Ship as ShipIcon, Activity, FileText, MapPin, Calendar, Ruler, Weight, Flag } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/Accordion";
import { GridItem, StatusBadge } from "~/components/ui/DetailHelpers";

interface VesselOverviewProps {
    vessel: any;
}

export function VesselOverview({ vessel }: VesselOverviewProps) {
    return (
        <Accordion type="multiple" defaultValue={["identity", "class", "dimensions"]} className="space-y-4">
            {/* Identification */}
            <AccordionItem value="identity">
                <AccordionTrigger>
                    <span className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-slate-400" /> Identification
                    </span>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <GridItem label="Vessel Name" value={vessel.name} icon={ShipIcon} />
                        <GridItem label="IMO Number" value={vessel.imo_number} icon={FileBadge} />
                        <GridItem label="Call Sign" value={vessel.call_sign} icon={Activity} />
                        <GridItem label="Official Number" value={vessel.official_number} icon={FileText} />
                        <GridItem label="Port of Registry" value={vessel.port_of_registry} icon={MapPin} />
                        <GridItem label="Flag" value={vessel.flag_code} icon={Flag} />
                        <GridItem label="Keel Laid" value={vessel.keel_laid_date} icon={Calendar} />
                        <GridItem label="Delivery Date" value={vessel.delivery_date} icon={Calendar} />
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Classification */}
            <AccordionItem value="class">
                <AccordionTrigger>
                    <span className="flex items-center gap-2">
                        <FileBadge className="w-5 h-5 text-slate-400" /> Classification
                    </span>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <GridItem label="Class Notation" value={vessel.class_notation || "1A1 General Cargo"} icon={FileBadge} />
                        <GridItem label="Class ID" value={vessel.class_id || "12345"} icon={FileText} />
                        <GridItem label="Status" value={<StatusBadge status={vessel.vessel_status || "active"} />} icon={Activity} />
                        <GridItem label="Registered Owner" value={vessel.owner_name} icon={ShipIcon} />
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Dimensions */}
            <AccordionItem value="dimensions">
                <AccordionTrigger>
                    <span className="flex items-center gap-2">
                        <Ruler className="w-5 h-5 text-slate-400" /> Dimensions & Tonnage
                    </span>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <GridItem label="Gross Tonnage" value={vessel.gross_tonnage} icon={Weight} />
                        <GridItem label="Net Tonnage" value={vessel.net_tonnage} icon={Weight} />
                        <GridItem label="Deadweight" value={vessel.deadweight} icon={Weight} />
                        <GridItem label="Length Overall" value={`${vessel.length_overall || "-"} m`} icon={Ruler} />
                        <GridItem label="Length BP" value={`${vessel.length_bp || "-"} m`} icon={Ruler} />
                        <GridItem label="Breadth" value={`${vessel.breadth_moulded || "-"} m`} icon={Ruler} />
                        <GridItem label="Depth" value={`${vessel.depth_moulded || "-"} m`} icon={Ruler} />
                        <GridItem label="Draught" value={`${vessel.draught || "-"} m`} icon={Ruler} />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
