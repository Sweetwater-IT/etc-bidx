import React, { useState } from 'react'
import Image from 'next/image'
import { QuoteItem } from '@/types/IQuoteItem'
import { AdminData } from '@/types/TAdminData'
import { Customer } from '@/types/Customer'
import { User } from '@/types/User'
import { PaymentTerms } from '../../../components/pages/quote-form/QuoteAdminInformation'
import { TermsNames } from '@/app/quotes/create/QuoteFormProvider'
import { INote } from '@/types/TEstimate'
import { EstimateBidQuote, StraightSaleQuote, ToProjectQuote } from './types'
import { PdfViewer } from './components/PdfViewer'

interface BidProposalWorksheetProps {
  adminData: AdminData
  items: QuoteItem[]
  customers: Customer[]
  quoteDate: Date
  quoteNumber: string
  pointOfContact: { name: string; email: string }
  sender: User
  paymentTerms: PaymentTerms
  includedTerms: Record<TermsNames, boolean>
  customTaC: string
  county: string
  sr: string
  ecms: string
  notes: string | undefined,
  quoteType: "straight_sale" | "to_project" | "estimate_bid";
  quoteData: Partial<StraightSaleQuote | ToProjectQuote | EstimateBidQuote> | null;
  termsAndConditions?: boolean;
  files: any
}

const formatDate = (date?: string) => {
  if (!date) return "";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US");
};

export const BidProposalWorksheet: React.FC<BidProposalWorksheetProps> = ({
  adminData,
  items,
  customers,
  quoteDate,
  quoteNumber,
  pointOfContact,
  sender,
  paymentTerms,
  includedTerms,
  customTaC,
  county,
  sr,
  ecms,
  notes,
  quoteType,
  quoteData,
  termsAndConditions,
  files
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const formatMoney = (v: number) =>
    v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  const total = items.reduce((acc, item) => {
    const q = item.quantity || 0
    const p = item.unitPrice || 0
    return acc + q * p
  }, 0)

  const calculateExtendedPrice = (item: QuoteItem) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const compositeTotalPerUnit = item.associatedItems?.length
      ? item.associatedItems.reduce((subSum, c) => subSum + ((c.quantity || 0) * (c.unitPrice || 0)), 0)
      : 0;
    const totalUnitPrice = unitPrice + compositeTotalPerUnit;
    const basePrice = quantity * totalUnitPrice;
    const discount = item.discount || 0;
    const discountType = item.discountType || 'percentage';
    const discountAmount = discountType === 'dollar' ? discount : basePrice * (discount / 100);
    return basePrice - discountAmount;
  };

  const joinWithSlash = (...values: (string | undefined | null)[]) => {
    return values.filter(Boolean).join(" / ");
  };

  const renderCustomerInfo = () => {
    if (!quoteData) return null;

    let data: Partial<EstimateBidQuote | ToProjectQuote | StraightSaleQuote>;

    switch (quoteType) {
      case "estimate_bid":
        data = quoteData as Partial<EstimateBidQuote>;
        return (
          <section className="grid grid-cols-2 border border-black mt-2 text-[10px]">
            <div className="p-1 border-r border-b border-black">
              <p className='font-extrabold mb-2'>Customer Information</p>
              <p><span className="font-semibold">Customer:</span> {joinWithSlash(data.customer_name, data.customer_address)}</p>
              <p><span className="font-semibold">Customer Contact:</span> {joinWithSlash(data.customer_contact, data.customer_email, data.customer_phone)}</p>
            </div>

            <div className="p-1 border-b border-black">
              <p className='font-extrabold mb-2'>ETC Information</p>
              <p><span className="font-semibold">Point of Contact:</span> {joinWithSlash(data.etc_point_of_contact, data.etc_poc_email, data.etc_poc_phone_number)}</p>
              <p><span className="font-semibold">Branch:</span> {data.etc_branch || ''}</p>
            </div>

            <div className="p-1 border-r border-black">
              <p className='font-extrabold mb-2'>Job Location / Details</p>
              <p><span className="font-semibold">Township/County:</span> {joinWithSlash(data.township, data.county)}</p>
              <p><span className="font-semibold">State Route:</span> {data.sr_route || ''}</p>
              <p><span className="font-semibold">Job Address:</span> {data.job_address || ''}</p>
              <p><span className="font-semibold">ECMS / Contract Number:</span> {data.ecsm_contract_number || ''}</p>
            </div>

            <div className="p-1">
              <p className='font-extrabold mb-2'>Additional Project Details</p>
              <p><span className="font-semibold">Bid Date:</span> {formatDate(data.bid_date)}</p>
              <p><span className="font-semibold">Start Date:</span> {formatDate(data.start_date)}</p>
              <p><span className="font-semibold">End Date:</span> {formatDate(data.end_date)}</p>
              <p><span className="font-semibold">Duration (Days):</span> {data.duration || ''}</p>
            </div>
          </section>
        );

      case "to_project":
        data = quoteData as Partial<ToProjectQuote>;
        return (
          <section className="grid grid-cols-2 border border-black mt-2 text-[10px]">
            <div className="p-1 border-r border-b border-black">
              <p className='font-extrabold mb-2'>Customer Information</p>
              <p><span className="font-semibold">Customer:</span> {joinWithSlash(data.customer_name, data.customer_address)}</p>
              <p><span className="font-semibold">Customer Contact:</span> {joinWithSlash(data.customer_contact, data.customer_email, data.customer_phone)}</p>
              <p><span className="font-semibold">Customer Job #:</span> {data.customer_job_number || ''}</p>
            </div>

            <div className="p-1 border-b border-black">
              <p className='font-extrabold mb-2'>ETC Information</p>
              <p><span className="font-semibold">Point of Contact:</span> {joinWithSlash(data.etc_point_of_contact, data.etc_poc_email, data.etc_poc_phone_number)}</p>
              <p><span className="font-semibold">Branch:</span> {data.etc_branch || ''}</p>
              <p><span className="font-semibold">ETC Job Number:</span> {data.etc_job_number || ''}</p>
            </div>

            <div className="p-1 border-r border-black">
              <p className='font-extrabold mb-2'>Job Location / Details</p>
              <p><span className="font-semibold">Township/County:</span> {joinWithSlash(data.township, data.county)}</p>
              <p><span className="font-semibold">State Route:</span> {data.sr_route || ''}</p>
              <p><span className="font-semibold">Job Address:</span> {data.job_address || ''}</p>
              <p><span className="font-semibold">ECMS / Contract Number:</span> {data.ecsm_contract_number || ''}</p>
            </div>

            <div className="p-1">
              <p className='font-extrabold mb-2'>Additional Project Details</p>
              <p><span className="font-semibold">Bid Date:</span> {formatDate(data.bid_date)}</p>
              <p><span className="font-semibold">Start Date:</span> {formatDate(data.start_date)}</p>
              <p><span className="font-semibold">End Date:</span> {formatDate(data.end_date)}</p>
              <p><span className="font-semibold">Duration (Days):</span> {data.duration || ''}</p>
            </div>
          </section>
        );

      case "straight_sale":
      default:
        data = quoteData as Partial<StraightSaleQuote>;
        return (
          <section className="grid grid-cols-2 grid-rows-1 border border-black mt-2 text-[10px]">
            <div className="p-1 border-r border-b border-black">
              <p className='font-extrabold mb-2'>Customer Information</p>
              <p><span className="font-semibold">Customer:</span> {joinWithSlash(data.customer_name, data.customer_address)}</p>
              <p><span className="font-semibold">Customer Contact:</span> {joinWithSlash(data.customer_contact, data.customer_email, data.customer_phone)}</p>
              <p><span className="font-semibold">Purchase Order #:</span> {data.purchase_order || ''}</p>
            </div>
            <div className="p-1">
              <p className='font-extrabold mb-2'>ETC Information</p>
              <p><span className="font-semibold">Point of Contact:</span> {joinWithSlash(data.etc_point_of_contact, data.etc_poc_email, data.etc_poc_phone_number)}</p>
              <p><span className="font-semibold">Branch:</span> {data.etc_branch || ''}</p>
            </div>
          </section>
        );
    }
  };


  const pages: any[] = [];

  pages.push(
    <div key="main-proposal" className="bg-white min-h-[100vh] flex flex-col text-black p-4 font-sans text-[10px] border border-gray-400">
      <div className='flex-1'>
        <header className="flex justify-between items-start pb-2">
          <div className="flex items-start justify-between w-full">
            <div className='flex flex-col items-start w-1/4'>
              <Image src="/logo.jpg" alt="ETC Logo" width={120} height={120} />
              <a className='mt-1 text-blue-500' href="http://www.establishedtraffic.com/">www.establishedtraffic.com</a>
            </div>
            <div className='flex flex-col items-center w-2/4'>
              <h1 className="font-bold text-lg">Established Traffic Control, Inc.</h1>
              <p>3162 Unionville Pike</p>
              <p>Hatfield, PA 19440</p>
              <p>O: 215.997.8801</p>
              <p>Email: <span className='underline text-blue-600'>{sender.email}</span></p>
            </div>
            <div className="text-center w-1/4 ">
              <h2 className="text-xl font-bold">PROPOSAL</h2>
              <p>Quote Date: {quoteDate.toLocaleDateString('en-US')}</p>
              <p>
                Quote Expiration: {new Date(quoteDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US')}
              </p>
              <p>THIS IS NOT A BILL/INVOICE DO NOT PAY</p>
            </div>
          </div>
        </header>

        {renderCustomerInfo()}
        <section className="mt-3 text-[12px]">
          <table className="w-full border-[1.5px] border-black border-collapse">
            <thead>
              <tr className='border-black border-b-[1.5px]'>
                <th className="w-[40px] px-1 py-1 text-center">Row</th>
                <th className="w-[80px] px-1 py-1 text-center">Item #</th>
                <th className="px-2 py-1 text-center">Description</th>
                <th className="px-2 py-1 text-center">UON</th>
                <th className="px-2 py-1 text-center">Quantity</th>
                <th className="px-2 py-1 text-center">Unit Price</th>
                <th className="px-2 py-1 text-center">Extended</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const extended = calculateExtendedPrice(item);
                return (
                  <React.Fragment key={item.id || index}>
                    <tr>
                      <td className="w-[40px] px-1 py-1 align-top text-center">
                        {index + 1}
                      </td>
                      <td className="w-[40px] px-1 py-1 align-top text-center">
                        {item.itemNumber || index + 1}
                      </td>
                      <td className="px-1 text-center  py-1 font-bold align-top">
                        {item.description ?? "-"}
                      </td>
                      <td className="px-1 py-1 text-center align-top">
                        {item.uom || 'EA'}
                      </td>
                      <td className="px-1 py-1 text-center align-top">
                        {item.quantity}
                      </td>
                      <td className="px-1 text-center py-1 align-top">
                        {formatMoney(item.unitPrice || 0)}
                      </td>
                      <td className="px-1 text-center py-1 align-top">
                        {formatMoney(extended)}
                      </td>
                    </tr>

                    {item.associatedItems?.map((assoc, assocIndex) => (
                      <tr
                        key={`assoc-${item.id}-${assocIndex}`}
                        className="bg-gray-50"
                      >
                        <td className="border border-black px-2 py-1"></td>
                        <td className="border border-black px-2 py-1 pl-4 text-[10px]">
                          - {assoc.description}
                        </td>
                        <td className="border border-black px-2 py-1 text-center text-[10px]">
                          {assoc.quantity}
                        </td>
                        <td className="border border-black px-2 py-1 text-right text-[10px]">
                          {formatMoney(assoc.unitPrice || 0)}
                        </td>
                        <td className="border border-black px-2 py-1"></td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}

              <tr className='w-full border-b-black border-1 my-2'></tr>
              <tr className="text-[12px]">
                <td colSpan={5}></td>
                <td colSpan={1} className="px-1 py-1 text-center font-bold">
                  SUBTOTAL
                </td>
                <td colSpan={1} className=" py-1 text-center font-bold">
                  {formatMoney(total)}
                </td>
              </tr>
              <tr className='text-[12px]'>
                <td colSpan={5}></td>
                <td colSpan={1} className="px-2 py-1 text-center font-bold">
                  TOTAL
                </td>
                <td colSpan={1} className="px-2 py-1 text-center font-bold">
                  {formatMoney(total)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-2 text-[9px] flex flex-row gap-4">
          <p className="uppercase font-bold">Notes:</p>
          <div className='flex flex-col flex-1'>
            {notes ? <p>{notes}</p>
              : <p>No notes available</p>
            }
          </div>
        </section>

      </div>
      <div className='flex flex-col items-center'>

        <div className="mt-2 bg-yellow-200/70 gap-8 p-1 w-full flex justify-between items-center text-[10px] font-medium">
          <div className="flex items-end gap-2 flex-1">
            <span>X</span>
            <span className="border-b flex-1 border-black min-w-[150px] inline-block">
              <span className="pl-1 italic text-[11px]"></span>
            </span>
          </div>
          <div className="flex items-end gap-8 flex-1">
            <span>Date</span>
            <span className="border-b flex-1 border-black min-w-[150px] inline-block">
              <span className="pl-1 italic text-[11px]"></span>
            </span>
          </div>
        </div>
        <p className='text-center my-4 w-3/4 m-auto font-semibold text-gray-400 text-[10px]'>Please add 3% to total if paying by MC or VISA, 4% for AMEX.
          Due to extreme market volatility, all pricing and availability are subject to change without notice.
          All quotes to be confirmed at time of order placement
        </p>

      </div>

    </div>
  );

  if (termsAndConditions) {
    pages.push(
      <div key="terms" className="min-h-[100vh]  bg-white text-black p-4 font-sans text-[9px] border border-gray-400">
        <h2 className="font-bold text-start mb-4 text-[12px]">STANDARD CONDITIONS</h2>
        <div className="space-y-2">
          <p>--- This quote including all terms and conditions will be included In any contract between contractor and Established Traffic Control Established Traffic Control must be notified within 14 days of bid date if Contractor is utilizing our proposal.</p>
          <p>--- Payment for lump sum items shall be 50% paid on the 1st estimate for mobilization. The remaining balance will be prorated over the remaining pay estimates. A pro-rated charge or use of PennDOT Publication 408, Section 110.03(d) 3a will be assessed if contract exceeds the MPT completion date and/or goes over the MPT Days.</p>
          <p>--- This quote including all terms and conditions will be included In any contract between contractor and Established Traffic Control Established Traffic Control must be notified within 14 days of bid date if Contractor is utilizing our proposal.</p>
          <p>--- In the event that payment by owner to contractor is delayed due to a dispute between owner, and contractor not involving the work performed by Established Traffic Control, Inc (ETC), then payment by contractor to ETC shall not likewise be delayed.</p>
          <p>--- No extra work will be performed without proper written authorization. Extra work orders signed by an agent of the contractor shall provide for full payment of work within 30 days of invoice date, regardless regardless if owner has paid contractor.</p>
          <p>--- All sale and rental invoices are NET 30 days. Sales tax is not included. Equipment Delivery/Pickup fee is not included.</p>
          <p>--- All material supplied by ETC is project specific (shall be kept on this project) and will remain our property at the project completion. The contractor is responsible for all lost/stolen or damaged materials and will be invoiced to contractor at replacement price. Payment for lost/stolen or damaged materials invoices are net 30 days regardless of payment from the owner or responsible party. Materials moved to other projects will be subject to additional invoicing.</p>
          <p>--- ETC will require a minimum notice of 2 weeks (4–5 weeks for permanent signing) for all project start and/or changes with approved stamped drawings or additional fees may apply. Permanent signing proposal includes an original set of shop drawings, prepared per original contract plans. Additional permanent signing shop drawing requests are $150.00/drawing.</p>
          <p>--- In the event that any terms in our exclusions/conditions conflict with other terms of the contract documents, the terms of our exclusions shall govern.</p>
        </div>
      </div>
    );
  }

  if (files && files.length > 0) {
    files.forEach((file: any, index: number) => {
      pages.push(
        <div key={`pdf-${index}`} className="flex-1 min-h-[600px]">
          <PdfViewer fileUrl={file.file_url} />
        </div>
      );
    });
  }

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="relative">
      {/* Controles de navegación */}
      {
        pages.length > 1 &&
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className={`px-4 py-2 rounded ${currentPage === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-black text-white'
              }`}
          >
            ← Prev
          </button>

          <span className="text-sm font-medium">
            Page  {currentPage + 1} de {pages.length}
          </span>

          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className={`px-4 py-2 rounded ${currentPage === pages.length - 1
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-black text-white'
              }`}
          >
            Next →
          </button>
        </div>
      }

      <div className="min-h-[100vh]">
        {pages[currentPage]}
      </div>

    </div>
  );
}

export default BidProposalWorksheet