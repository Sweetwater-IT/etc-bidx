import { AdminData, SignItem } from "./SignOrderWorksheetPDF";

interface Props {
  adminData: AdminData;
  signList: SignItem[];
  showFinancials: boolean;
}

const cellClass = "border-r-2 border-black py-1 text-xs text-center";
const headerCellClass = "border-r-2 border-black py-1 text-xs font-bold bg-gray-100 text-center font-bold";

const SignOrderWorksheet: React.FC<Props> = ({
  adminData,
  signList,
  showFinancials
}) => {
  return (
    <div className="bg-white p-6 mt-4 max-w-[900px] min-h-[1000px] overflow-y-auto">
      <div className="bg-white text-black mx-auto border-4 border-black">
        {/* Title Bar */}
        <div className="flex justify-between items-center border-b-2 border-black p-2">
          <div className="text-lg font-bold">Sign Order Worksheet</div>
          <div className="text-sm text-right font-medium">
            <div>Submitter: {adminData.submitter || '-'}</div>
            <div>Submission Date: {new Date().toLocaleDateString()}</div>
          </div>
        </div>
        {/* Header Section */}
        <div className="border-b-2 border-t-2 border-black text-sm">
          <div className="flex">
            <div className="flex-1 border-r-2 border-black p-1">
              <span className="font-bold">Contract #:</span> {adminData.contractNumber || '-'}
            </div>
            <div className="flex-1 border-r-2 border-black p-1">
              <span className="font-bold">Job #:</span> {adminData.jobNumber || '-'}
            </div>
            <div className="flex-1 border-r-2 border-black p-1">
              <span className="font-bold">Branch:</span> {adminData.branch || '-'}
            </div>
            <div className="flex-1 p-1">
              <span className="font-bold">Order Type:</span> {adminData.orderType || '-'}
            </div>
          </div>
          <div className="flex border-t-2 border-b-2 border-black">
            <div className="flex-1 border-r-2 border-black p-1">
              <span className="font-bold">Customer:</span> {adminData.customer?.name || '-'}
            </div>
            <div className="flex-1 border-r-2 border-black p-1">
              <span className="font-bold">Order Date:</span> {adminData.orderDate ? new Date(adminData.orderDate).toLocaleDateString() : '-'}
            </div>
            <div className="flex-1 border-r-2 border-black p-1">
              <span className="font-bold">Need Date:</span> {adminData.needDate ? new Date(adminData.needDate).toLocaleDateString() : '-'}
            </div>
            <div className="flex-1 p-1"></div>
          </div>
        </div>
        {/* Section Title */}
        <div className="font-bold text-center border-t-2 border-black py-2 mt-2 bg-white">SIGN LIST</div>
        {/* Sign List Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-t-2 border-black table-fixed">
            <thead>
              <tr className="border-b-2 border-black">
                <th className={headerCellClass + " w-1/10"}>Designation</th>
                <th className={headerCellClass + " w-1/10"}>Description</th>
                <th className={headerCellClass + " w-1/10"}>Qty</th>
                <th className={headerCellClass + " w-1/10"}>Width</th>
                <th className={headerCellClass + " w-1/10"}>Height</th>
                <th className={headerCellClass + " w-1/10"}>Sheeting</th>
                <th className={headerCellClass + " w-1/10"}>Substrate</th>
                <th className={headerCellClass + " w-1/10"}>Stiffener</th>
                {showFinancials && <th className={headerCellClass + " w-1/10"}>Unit Price</th>}
                {showFinancials && <th className={"w-1/10 !border-r-0 " + headerCellClass}>Total Price</th>}
              </tr>
            </thead>
            <tbody>
              {signList.map((item, idx) => (
                <tr key={idx} className="border-b-2 border-black">
                  <td className={cellClass + " w-1/10"}>{item.designation}</td>
                  <td className={cellClass + " w-1/10"}>{item.description}</td>
                  <td className={cellClass + " w-1/10"}>{item.quantity}</td>
                  <td className={cellClass + " w-1/10"}>{item.width}</td>
                  <td className={cellClass + " w-1/10"}>{item.height}</td>
                  <td className={cellClass + " w-1/10"}>{item.sheeting}</td>
                  <td className={cellClass + " w-1/10"}>{item.substrate}</td>
                  <td className={cellClass + " w-1/10"}>
                    {(item as any).primarySignId !== undefined
                      ? '-'
                      : item.stiffener
                      ? 'Yes'
                      : 'No'}
                  </td>
                  {showFinancials && (
                    <td className={cellClass + " w-1/10"}>
                      {item.unitPrice !== undefined
                        ? `$${item.unitPrice.toFixed(2)}`
                        : '-'}
                    </td>
                  )}
                  {showFinancials && (
                    <td className={"w-1/10 !border-r-0 " + cellClass}>
                      {item.totalPrice !== undefined
                        ? `$${item.totalPrice.toFixed(2)}`
                        : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="flex justify-between items-center text-xs border-t-2 border-black mt-2 p-1">
          <span>ETC Form 61</span>
          <span>v1.01 Jan/2025</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};

export default SignOrderWorksheet;