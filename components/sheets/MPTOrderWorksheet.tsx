import { SignItem } from "@/components/sheets/MPTOrderWorksheetPDF";
import { MPTRentalEstimating } from "@/types/MPTEquipment";
import { SignOrderAdminInformation } from '@/app/takeoffs/sign-order/SignOrderContentSimple'
import { Checkbox } from "@/components/ui/checkbox";
import { safeNumber } from "@/lib/safe-number";
import { getEquipmentTotalsPerPhase } from "@/lib/mptRentalHelperFunctions";
import { Note } from "@/components/pages/quote-form/QuoteNotes";

interface Props {
  adminInfo: SignOrderAdminInformation;
  signList: {
    type3Signs: SignItem[];
    trailblazersSigns: SignItem[];
    looseSigns: SignItem[];
  };
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

const MPTOrderWorksheet: React.FC<Props> = ({
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
          <div>Submission Date: {new Date().toLocaleDateString()}</div>
        </div>
      </div>
      {/* Header Section */}
      <div className="border-b-2 border-t-2 border-black text-sm">
        <div className="flex">
          <div className="flex-1 border-r-2 border-black p-1">
            <span className="font-bold">Customer:</span> {adminInfo.customer?.name || '-'}
          </div>
          <div className="flex-1 border-r-2 border-black p-1">
            <span className="font-bold">Contact:</span> {adminInfo.customer?.mainPhone || '-'}
          </div>
          <div className="flex-1 border-r-2 border-black p-1">
            <span className="font-bold">E-mail:</span> {adminInfo.customer?.emails[0] || '-'}
          </div>
          <div className="flex-1 p-1">
            <span className="font-bold">Phone:</span> {adminInfo.customer?.phones[0] || '-'}
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
        <div className="flex border-t-2 border-b-2 border-black">
          <div className="flex-1 border-r-2 border-black p-1">
            <span className="font-bold">Order Date:</span> {adminInfo.orderDate ? new Date(adminInfo.orderDate).toLocaleDateString() : '-'}
          </div>
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
              <th className={headerCellClass + " w-2/10"}></th>
              <th className={headerCellClass + " w-1/10"}>Qty</th>
              <th className={headerCellClass + " w-1/10"}>Size</th>
              <th className={headerCellClass + " w-4/10"}>Legend</th>
              <th className={headerCellClass + " w-2/10"}>Structure</th>
            </tr>
          </thead>
          <tbody>
            {/* POST AND H STANDS */}
            {signList.trailblazersSigns.length > 0 ? signList.trailblazersSigns.map((item, idx) => (
              <tr key={idx} className="border-b-2 border-black">
                {idx === 0 && (
                  <td className={cellClass + " w-1/10 border-r-2 border-black"} rowSpan={signList.trailblazersSigns.length}>TRAILBLAZERS</td>
                )}
                <td className={cellClass + " w-1/10"}>{item.quantity}</td>
                <td className={cellClass + " w-1/10"}>{item.size}</td>
                <td className={cellClass + " w-4/10"}>{item.legend}</td>
                <td className={cellClass + " w-2/10"}>{item.displayStructure}</td>
              </tr>
            )) : (
              <tr className="border-b-2 border-black">
                <td className={cellClass + " border-r-2 border-black"}>TRAILBLAZERS</td>
              </tr>
            )}
            {/* TYPE III'S */}
            {signList.type3Signs.length > 0 ? signList.type3Signs.map((item, idx) => (
              <tr key={idx} className="border-b-2 border-black">
                {idx === 0 && (
                  <td className={cellClass + " w-2/10 border-r-2 border-black"} rowSpan={signList.type3Signs.length}>TYPE III&apos;S</td>
                )}
                <td className={cellClass + " w-1/10"}>{item.quantity}</td>
                <td className={cellClass + " w-1/10"}>{item.size}</td>
                <td className={cellClass + " w-4/10"}>{item.legend}</td>
                <td className={cellClass + " w-2/10"}>{item.displayStructure}</td>
              </tr>
            )) : (
              <tr className="border-b-2 border-black">
                <td className={cellClass  + " border-r-2 border-black"}>TYPE III'S</td>
              </tr>
            )}
            {/* LOOSE */}
            {signList.looseSigns.length > 0 ? signList.looseSigns.map((item, idx) => (
              <tr key={idx} className="border-b-2 border-black">
                {idx === 0 && (
                  <td className={cellClass + " w-1/10 border-r-2 border-black"} rowSpan={signList.looseSigns.length}>LOOSE</td>
                )}
                <td className={cellClass + " w-1/10"}>{item.quantity}</td>
                <td className={cellClass + " w-1/10"}>{item.size}</td>
                <td className={cellClass + " w-4/10"}>{item.legend}</td>
                <td className={cellClass + " w-2/10"}>{item.displayStructure}</td>
              </tr>
            )) : (
              <tr className="border-b-2 border-black">
                <td className={cellClass + " border-r-2 border-black"}>LOOSE</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Notes */}
      {
        notes.length > 0 && (
          <div className="border-t-4 border-b-4 border-black mt-2">
            <div className="font-bold text-center py-2 bg-white border-black">NOTES</div>
            <div className="p-4 border-t-2 border-black">
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
        )
      }
      {/* Footer */}
      <div className="flex justify-between items-center text-xs border-t-2 border-black mt-2 p-1">
        <span>ETC Form 61</span>
        <span>v1.01 Jan/2025</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
};

export default MPTOrderWorksheet;
