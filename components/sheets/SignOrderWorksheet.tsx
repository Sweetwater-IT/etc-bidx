import { SignItem } from "./SignOrderWorksheetPDF";
import { MPTRentalEstimating } from "@/types/MPTEquipment";
import { SignOrderAdminInformation } from '@/app/takeoffs/sign-order/SignOrderContentSimple'
import { Checkbox } from "@/components/ui/checkbox";
import { safeNumber } from "@/lib/safe-number";
import { getEquipmentTotalsPerPhase } from "@/lib/mptRentalHelperFunctions";
import { Note } from "@/components/pages/quote-form/QuoteNotes";

interface Props {
  adminInfo: SignOrderAdminInformation;
  signList: SignItem[];
  mptRental: MPTRentalEstimating | undefined;
  notes: Note[];
}
function formatDateTime (ts: number) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
const cellClass = "py-1 text-xs text-center";
const headerCellClass = "py-1 text-xs font-bold bg-gray-100 text-center font-bold";

const SignOrderWorksheet: React.FC<Props> = ({
  adminInfo,
  signList,
  mptRental,
  notes,
}) => {
  return (
    <div className="bg-white text-black mx-auto border-4 border-black">
      {/* Title Bar */}
      <div className="flex justify-between items-center border-b-2 border-black p-2">
        <div className="text-lg font-bold">Sign Order Worksheet</div>
        <div className="text-sm text-right font-medium">
          <div>Submitter: {adminInfo.requestor?.name || '-'}</div>
          <div>Submission Date: {new Date(adminInfo.orderDate).toLocaleDateString()}</div>
        </div>
      </div>
      {/* Header Section */}
      <div className="border-b-2 border-t-2 border-black text-sm">
        <div className="flex">
          <div className="flex-1 border-r-2 border-black p-1">
            <span className="font-bold">Customer:</span> {adminInfo.customer?.name || '-'}
          </div>
          <div className="flex-1 p-1">
            <span className="font-bold">Customer Contact:</span> {adminInfo.customer?.phones[0] || '-'}
          </div>
        </div>
        <div className="flex border-t-2 border-black">
          <div className="flex-1 border-r-2 border-black p-1">
            <span className="font-bold">Job #:</span> {adminInfo.jobNumber || '-'}
          </div>
          <div className="flex-1 border-r-2 border-black p-1">
            <span className="font-bold">Contract #:</span> {adminInfo.contractNumber || '-'}
          </div>
          <div className="flex-1 border-black p-1">
            <span className="font-bold">Phase #:</span> {mptRental?.phases.length || 0}
          </div>
        </div>
        <div className="flex border-t-2 border-black">
          <div className="flex-1 border-r-2 border-black p-1 flex items-center gap-2">
            <span className="font-bold">Sale:</span> <Checkbox checked={adminInfo.orderType.includes('sale')} />
          </div>
          <div className="flex-1 border-r-2 border-black p-1 flex items-center gap-2">
            <span className="font-bold">Rental:</span> <Checkbox checked={adminInfo.orderType.includes('rental')} />
          </div>
          <div className="flex-1 border-r-2 border-black p-1 flex items-center gap-2">
            <span className="font-bold">Permanent:</span> <Checkbox checked={adminInfo.orderType.includes('permanent signs')} />
          </div>
          <div className="flex-1 border-black p-1 flex items-center gap-2">
            <span className="font-bold">Multiple:</span> <Checkbox checked={adminInfo.orderType.length > 1} />
          </div>
        </div>
        <div className="flex border-t-2 border-b-2 border-black">
          <div className="flex-1 border-r-2 border-black p-1">
            <span className="font-bold">Need Date:</span> {adminInfo.needDate ? new Date(adminInfo.needDate).toLocaleDateString() : '-'}
          </div>
          <div className="flex-1 border-r-2 border-black p-1">
            <span className="font-bold">Rental Start Date:</span> {adminInfo.startDate ? new Date(adminInfo.startDate).toLocaleDateString() : '-'}
          </div>
          <div className="flex-1 border-black p-1">
            <span className="font-bold">Rental End Date:</span> {adminInfo.endDate ? new Date(adminInfo.endDate).toLocaleDateString() : '-'}
          </div>
        </div>
      </div>
      {/* Section Title */}
      <div className="font-bold text-center border-t-4 border-black py-2 mt-2 bg-white">SIGN LIST</div>
      {/* Sign List Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-t-2 border-b-4 border-black table-fixed">
          <thead>
            <tr className="border-b-2 border-black">
              <th className={headerCellClass + " w-1/10"}>Designation</th>
              <th className={headerCellClass + " w-1/10"}>Width</th>
              <th className={headerCellClass + " w-1/10"}>Height</th>
              <th className={headerCellClass + " w-1/10"}>Quantity</th>
              <th className={headerCellClass + " w-1/10"}>Sheeting</th>
              <th className={headerCellClass + " w-1/10"}>Structure</th>
              <th className={headerCellClass + " w-1/10"}>B Lights</th>
              <th className={headerCellClass + " w-1/10"}>Covers</th>
            </tr>
          </thead>
          <tbody>
            {signList.map((item, idx) => (
              <tr key={idx} className="border-b-2 border-black">
                <td className={cellClass + " w-1/10"}>{item.designation}</td>
                <td className={cellClass + " w-1/10"}>{item.width} in.</td>
                <td className={cellClass + " w-1/10"}>{item.height} in.</td>
                <td className={cellClass + " w-1/10"}>{item.quantity}</td>
                <td className={cellClass + " w-1/10"}>{item.sheeting}</td>
                <td className={cellClass + " w-1/10"}>{item.displayStructure || '-'}</td>
                <td className={cellClass + " w-1/10"}>{item.bLights}</td>
                <td className={cellClass + " w-1/10"}>{item.cover ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Equipment Summary */}
      <div className="flex border-t-4 border-b-4 border-black mt-2">
        <div className="w-1/3">
          <div className="font-bold text-center py-2 bg-white border-black">EQUIPMENT SUMMARY</div>
          <div className="flex justify-between border-black p-1 border-t-2 text-xs">
            <div className="font-bold">4' TYPE III =</div>
            <div className="font-bold">{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).fourFootTypeIII.totalQuantity)}</div>
          </div>
          <div className="flex justify-between border-black p-1 border-t-2 text-xs">
            <div className="font-bold">H-STANDS =</div>
            <div className="font-bold">{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).hStand.totalQuantity)}</div>
          </div>
          <div className="flex justify-between border-black p-1 border-t-2 text-xs">
            <div className="font-bold">{`V/P'S`} =</div>
            <div className="font-bold">{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).HIVP.totalQuantity) + safeNumber(getEquipmentTotalsPerPhase(mptRental).sharps.totalQuantity) + safeNumber(getEquipmentTotalsPerPhase(mptRental).TypeXIVP.totalQuantity)}</div>
          </div>
          <div className="flex justify-between border-black p-1 border-t-2 text-xs">
            <div className="font-bold">B-LIGHTS =</div>
            <div className="font-bold">{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).BLights.totalQuantity)}</div>
          </div>
          <div className="flex justify-between border-black p-1 border-t-2 text-xs">
            <div className="font-bold">SANDBAGS =</div>
            <div className="font-bold">{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).sandbag.totalQuantity)}</div>
          </div>
          <div className="flex justify-between border-black p-1 border-t-2 text-xs">
            <div className="font-bold">POSTS =</div>
            <div className="font-bold">{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).post.totalQuantity)}</div>
          </div>
          <div className="flex justify-between border-black p-1 border-t-2 text-xs">
            <div className="font-bold">{`6'`} WINGS =</div>
            <div className="font-bold">{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).sixFootWings.totalQuantity)}</div>
          </div>
          <div className="flex justify-between border-black p-1 border-t-2 text-xs">
            <div className="font-bold">METAL STANDS =</div>
            <div className="font-bold">{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).metalStands.totalQuantity)}</div>
          </div>
          <div className="flex justify-between border-black p-1 border-t-2 text-xs">
            <div className="font-bold">C-LIGHTS =</div>
            <div className="font-bold">{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).covers.totalQuantity)}</div>
          </div>
        </div>
        <div className="w-2/3 border-l-2 border-black p-4">
          {
            notes.map((note, idx) => (
              <div key={idx} className="flex gap-4 items-end justify-between text-sm">
                <span>{note.text}</span>
                <span className="text-xs text-gray-500">{formatDateTime(note.timestamp)}</span>
              </div>
            ))
          }
        </div>
      </div>
      {/* Footer */}
      <div className="flex justify-between items-center text-xs border-t-2 border-black mt-2 p-1">
        <span>ETC Form 61</span>
        <span>v1.01 Jan/2025</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
};

export default SignOrderWorksheet;