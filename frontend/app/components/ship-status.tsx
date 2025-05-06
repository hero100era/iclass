import { ShipWheel } from "lucide-react";
import Identity from '~/components/ship-status/identity';
import OwnerInfo from '~/components/ship-status/owner-info';
import ClassInfo from "./ship-status/classification-info";
import CertificateStatus from './ship-status/certificate-status';
import SurveyStatus from './ship-status/survey-status';


export default function VesselInfo() {
  return (
    <div className="mx-auto font-sans text-sm">
      <div className="flex flex-col md:flex-row">
        <div className="basis-1/3 py-4 ">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12">
              <ShipWheel size={48} className="text-gray-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-blue-900 font-bold text-lg">PORT PHILLIP</h1>
              </div>
              <div className="text-gray-600">
                <span>DNV 36868</span> <span className="ml-2">IMO 9377975</span>
              </div>
            </div>
          </div>
        </div>
        <div className="basis-2/3 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-blue-900 font-bold text-2xl">Vessel Status</h1>
          </div>
        </div>
      </div>
      <Identity />
      <OwnerInfo />
      <ClassInfo />
      <CertificateStatus />
      <SurveyStatus />
    </div>
  )
}
