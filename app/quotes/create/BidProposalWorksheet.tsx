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
import { InitialsLine } from './components/InitialsLine'

interface BidProposalWorksheetProps {
  items: QuoteItem[]
  quoteDate: Date
  notes: string | undefined,
  quoteType: "straight_sale" | "to_project" | "estimate_bid";
  quoteData: Partial<StraightSaleQuote | ToProjectQuote | EstimateBidQuote> | null;
  termsAndConditions?: boolean;
  files: any;
  exclusions?: string;
  terms: string;
}

const formatDate = (date?: string) => {
  if (!date) return "";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US");
};

export const BidProposalWorksheet: React.FC<BidProposalWorksheetProps> = ({
  items,
  notes,
  quoteType,
  quoteData,
  termsAndConditions,
  files,
  exclusions,
  terms,
  quoteDate
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
          <section className="grid grid-cols-2 border border-black mt-2 text-[9px]">
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
          <section className="grid grid-cols-2 border border-black mt-2 text-[9px]">
            <div className="p-1 border-r border-b border-black">
              <p className='font-extrabold mb-2'>Customer Information</p>
              <p><span className="font-semibold">Customer:</span> {joinWithSlash(data.customer_name, data.customer_address)}</p>
              <p><span className="font-semibold">Customer Contact:</span> {joinWithSlash(data.customer_contact, data.customer_email, data.customer_phone)}</p>
              <p><span className="font-semibold">Customer Job #:</span> {data.customer_job_number || ''}</p>
              <p><span className="font-semibold">Purchase Order #:</span> {data.purchase_order || ''}</p>
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
          <section className="grid grid-cols-2 grid-rows-1 border border-black mt-2 text-[9px]">
            <div className="p-1 border-r  border-black">
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

  const totalTax = items.reduce((acc, item) => {
    if (!item.is_tax_percentage) return acc;

    const extended = Number(calculateExtendedPrice(item)) || 0;
    const taxRate = Number(item.tax) || 0;
    const itemTax = extended * (taxRate / 100);

    return acc + itemTax;
  }, 0);

  const pages: any[] = [];

  const wrappedPages = pages.map((page, index) => {
    if (index === 0) return page;

    return (
      <div key={`page-${index}`} className="relative min-h-[100vh]">
        {page}
        <div className="absolute bottom-4 right-4 flex flex-col items-end">
          <InitialsLine label="Prepared By" width="w-[120px]" />
          <InitialsLine label="Approved By" width="w-[120px]" />
        </div>
      </div>
    )
  })

  pages.push(
    <div key="main-proposal" className="bg-white min-h-[100vh] flex flex-col text-black font-sans text-[10px]">
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
              <p>Email: <span className='underline text-blue-600'>estimating@establishedtraffic.com</span></p>
            </div>
            <div className="text-center w-1/4 ">
              <h2 className="text-xl font-bold">{quoteData?.status === "Accepted" ? "Sale Ticket" : "Proposal"}</h2>
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
                <th className="w-[80px] px-1 py-1 text-center">Row</th>
                <th className="w-[80px] px-1 py-1 text-center">Item #</th>
                <th className="px-2 py-1 text-center">Description</th>
                <th className="w-[80px] px-2 py-1 text-center">UOM</th>
                <th className="w-[80px] px-2 py-1 text-center">Qty</th>
                <th className="w-[80px] px-2 py-1 text-right">Unit Price</th>
                <th className="w-[80px] px-2 py-1 text-right">Ext. Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const extended = calculateExtendedPrice(item);
                if (item?.created === false) return;
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
                      <td className="px-1 text-right py-1 align-top">
                        {formatMoney(item.unitPrice || 0)}
                      </td>
                      <td className="px-1 text-right py-1 align-top">
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

              <tr className='w-full border-b-black border-1 my-2 '></tr>
              <tr className="text-[12px]">
                <td colSpan={5}></td>
                <td colSpan={1} className="px-1 py-1 text-center font-bold">
                  SUBTOTAL
                </td>
                <td colSpan={1} className=" py-1 text-right font-bold pr-1">
                  {formatMoney(total)}
                </td>
              </tr>
              <tr className='text-[12px]'>
                <td colSpan={5}></td>
                <td colSpan={1} className="px-2 py-1 text-center font-bold">
                  TAX
                </td>
                <td colSpan={1} className="py-1 text-right font-bold  pr-1">
                  {formatMoney(totalTax)}
                </td>
              </tr>
              <tr className='text-[12px]'>
                <td colSpan={5}></td>
                <td colSpan={1} className="px-2 py-1 text-center font-bold">
                  TOTAL
                </td>
                <td colSpan={1} className=" py-1 text-right font-bold  pr-1">
                  {formatMoney(total + totalTax)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-2 text-[9px] flex flex-col gap-4">
          <p className="uppercase font-bold">Notes:</p>
          <div style={{ whiteSpace: "pre-wrap" }} className='flex flex-col flex-1'>
            {notes && <p>{notes}</p>}
            <br />
            {items.map((i, idx) =>
              i.notes ? (
                <div key={idx}>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {i.itemNumber + ' - '}<span className='font-bold'>{i.description}</span>{' - ' + i.notes}
                  </p>
                  <br />
                </div>
              ) : null
            )}
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
      <div className='flex flex-col '>
        <div key="terms" className="min-h-[100vh] bg-white text-black font-sans text-[9px]">
          {
            termsAndConditions &&
            <div className='mt-4'>
              <div>
                <h2 className="font-bold text-start mb-4 text-[12px]">EXCLUSIONS</h2>
                <p style={{ whiteSpace: "pre-wrap" }}>{exclusions}</p>
              </div>

              <div className="space-y-2 mt-[25px]">
                <h2 className="font-bold text-start mb-4 text-[12px]">STANDARD CONDITIONS</h2>
                <div className='mb-4'></div>
                <p style={{ whiteSpace: "pre-wrap" }}>{terms}</p>
              </div>
            </div>
          }
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
            Page  {currentPage + 1} of {pages.length}
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

      <div className="min-h-[100vh] w-full flex flex-col border border-gray-400 p-4 justify-between">
        <div className="flex-1">
          {pages[currentPage]}
        </div>

        {currentPage !== 0 && (
          <div className="mt-0  flex justify-end items-center text-[10px] font-medium">
            <div className='bg-yellow-200/70  p-1'>
              <span>Initials</span>
              <span className="border-b border-black min-w-[150px] pl-1 italic text-[11px] ml-2 inline-block"></span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default BidProposalWorksheet