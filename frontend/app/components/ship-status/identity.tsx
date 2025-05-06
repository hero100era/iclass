import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { useState } from "react";

export default function Identity() {
    const [open, setOpen] = useState(true);
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
                <span className="font-medium text-blue-600">Identification</span>
            </button>

            {
                open && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Vessel Name:</div>
                                <div className="font-medium">PORT PHILLIP</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">DNV id:</div>
                                <div className="font-medium">36868</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">IMO number:</div>
                                <div className="font-medium">9377975</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Official number:</div>
                                <div className="font-medium">HK-2138</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Register:</div>
                                <div className="font-medium"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Other DNV services:</div>
                                <div className="font-medium">MLC,ISPS,ISM-VE</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Class relation:</div>
                                <div className="font-medium">In DNV Class</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Operational status:</div>
                                <div className="font-medium">In Operation</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Signal letters:</div>
                                <div className="font-medium">VRDY4</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Flag:</div>
                                <div className="font-medium flex items-center">
                                    Hong Kong
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Port:</div>
                                <div className="font-medium">HONG KONG</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Type:</div>
                                <div className="font-medium">301 - General cargo (single deck)</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Structural design type:</div>
                                <div className="font-medium">Monohull ship</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Regulatory regime:</div>
                                <div className="font-medium">Ships</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Main purpose:</div>
                                <div className="font-medium flex items-center">
                                    Unitized cargo carriage <Info className="h-3 w-3 text-gray-400 ml-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">Additional purpose(s):</div>
                                <div className="font-medium">
                                    <div className="flex items-center">
                                        Heavy solid bulk cargo carriage <Info className="h-3 w-3 text-gray-400 ml-1" />
                                    </div>
                                    <div className="flex items-center">
                                        Solid bulk cargo carriage <Info className="h-3 w-3 text-gray-400 ml-1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}