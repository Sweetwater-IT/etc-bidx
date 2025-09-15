import React from 'react'
import Image from 'next/image'
import { QuoteItem } from '@/types/IQuoteItem'
import { AdminData } from '@/types/TAdminData'
import { Customer } from '@/types/Customer'
import { User } from '@/types/User'
import { PaymentTerms } from '../../../components/pages/quote-form/QuoteAdminInformation'
import { TermsNames } from '@/app/quotes/create/QuoteFormProvider'
import { INote } from '@/types/TEstimate'

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
  notes: INote[]
}

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
  notes
}) => {
  const customer = customers?.[0]

  console.log(notes);


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

  return (
    <div className="bg-white text-black p-4 font-sans text-[10px] border border-black">
      {/* Header */}
      <header className="flex justify-between items-start border-b-2 border-black pb-2">
        <div className="flex items-start justify-between w-full">
          <div className='flex flex-col items-start'>
            <Image src="/logo.jpg" alt="ETC Logo" width={120} height={120} />
            <a className='mt-1 text-blue-500' href="http://www.establishedtraffic.com/">www.establishedtraffic.com</a>
          </div>
          <div className='flex flex-col items-center'>
            <h1 className="font-bold text-lg">Established Traffic Control, Inc.</h1>
            <p>3162 Unionville Pike</p>
            <p>Hatfield, PA 19440</p>
            <p>O: 215.997.8801 | F: 215.997.8868</p>
            <p>Email: <span className='underline text-blue-600'>{sender.email}</span></p>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">PROPOSAL</h2>
            <p>Quote Date: {quoteDate.toLocaleDateString('en-US')}</p>
            <p>THIS IS NOT A BILL/INVOICE DO NOT PAY</p>
          </div>
        </div>
      </header>

      {/* Customer / Job Info */}
      <section className="grid grid-cols-2 grid-rows-2 border border-black mt-2 text-[10px]">
        <div className="p-1 border-r border-b border-black">
          <p><span className="font-bold">TO:</span> {customer?.name || 'N/A'}</p>
          <p><span className="font-bold">Address:</span> {customer?.address ?? '-'}</p>
        </div>

        <div className="p-1 border-b border-black">
          <p><span className="font-bold">ETC Job #:</span> {quoteNumber}</p>
          <p><span className="font-bold">Contact:</span> {pointOfContact?.name ?? "-"}</p>
          <p><span className="font-bold">Phone:</span> {customer?.mainPhone ?? "-"}</p>
        </div>

        <div className="p-1 border-r border-black">
          <p><span className="font-bold">Township:</span> {adminData?.location ?? "-"}</p>
          <p><span className="font-bold">County:</span> {county ?? "-"}</p>
          <p><span className="font-bold">S.R./Route:</span> {sr ?? "-"}</p>
          <p><span className="font-bold">Project:</span> {ecms ?? "-"}</p>
        </div>

        <div className="p-1">
          <p><span className="font-bold">Bid Date:</span> {quoteDate.toLocaleDateString('en-US')}</p>
          <p><span className="font-bold">MPT Start Date:</span> __________</p>
          <p><span className="font-bold">MPT Completion Date:</span> __________</p>
          <p><span className="font-bold">MPT Days:</span> __________</p>
        </div>
      </section>
      {/* Items */}
      <section className="mt-3 text-[12px]">
        <table className="w-full border-[1.5px] border-black border-collapse">
          <thead>

            <tr className='border-black border-b-[1.5px]'>
              <th className="px-2 py-1 text-center">Row </th>
              <th className="px-2 py-1 text-center">Item #</th>
              <th className="px-2 py-1 text-center">Description</th>
              <th className="px-2 py-1 text-center">Qty/Units</th>
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
                    <td className="px-1 py-1 align-top text-center">
                      {index + 1}
                    </td>
                    <td className="px-1 py-1 align-top text-center">
                      {item.itemNumber || index + 1}
                    </td>
                    <td className="px-1 text-center  py-1 font-bold align-top">
                      {item.description}
                      {item.notes && (
                        <div className="text-[10px] font-normal text-gray-600 mt-1">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-1 py-1 text-center align-top">
                      {item.quantity} {item.uom || 'EA'}
                    </td>
                    <td className="px-1 text-center py-1 align-top">
                      {formatMoney(item.unitPrice || 0)}
                    </td>
                    <td className="px-1 text-center py-1 align-top">
                      {formatMoney(extended)}
                    </td>
                  </tr>

                  {/* Associated items */}
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


            {/* Totals */}
            <tr className='w-full border-b-black border-1 my-2'></tr>
            <tr className="">
              <td colSpan={4}></td>
              <td colSpan={1} className="px-1 py-1 text-center font-bold">
                SUBTOTAL
              </td>
              <td colSpan={1} className=" py-1 text-center font-bold">
                {formatMoney(total)}
              </td>
            </tr>
            <tr>
              <td colSpan={4}></td>
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

      <p className='text-center my-4 w-3/4 m-auto font-semibold'>Sales tax not included in price. Please add 3% to total if paying by MC or VISA, 4% for AMEX.
        Due to extreme market volatility, all pricing and availability are subject to change without notice.
        All quotes to be confirmed at time of order placement</p>

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

      <section className="mt-2 text-[9px] flex flex-row gap-4">
        <p className="uppercase font-bold">Notes:</p>
        <div className='flex flex-col flex-1'>
          {
            notes.length > 0 ?
              notes.map((nt, index) => {
                return <div key={index} className='flex flex-col'>
                  <p className='text-md'>{nt.text}</p>
                  <p className='text-[8px] text-gray-400'>{new Date(nt.timestamp).toLocaleString()} by {nt.user_email ?? ''}</p>
                </div>
              })
              :
              <p>No notes available</p>
          }

        </div>
      </section>

      {/* Signature */}
      {/* <section className="mt-4 text-center">
        <p className="text-[9px] text-blue-800">
          If the proposal is accepted, please sign and date below and return. Thank you!
        </p>
        <div className="flex justify-between mt-4 mx-8">
          <p className="text-[10px]">ACCEPTED BY: __________________________</p>
          <p className="text-[10px]">DATE: _______________</p>
        </div>
      </section> */}
    </div>
  )
}

export default BidProposalWorksheet
