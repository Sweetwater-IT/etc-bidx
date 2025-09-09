import React from 'react'
import Image from 'next/image'
import { QuoteItem } from '@/types/IQuoteItem'
import { AdminData } from '@/types/TAdminData'
import { Customer } from '@/types/Customer'
import { User } from '@/types/User'
import { PaymentTerms } from '../../../components/pages/quote-form/QuoteAdminInformation'
import { TermsNames } from '@/app/quotes/create/QuoteFormProvider'

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
}

const cell = "border p-1 text-[10px]"
const header = "border bg-gray-100 font-bold uppercase text-[10px] p-1"

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
}) => {
  const customer = customers?.[0]

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
          <Image src="/logo.jpg" alt="ETC Logo" width={120} height={120} />
          <div className='flex flex-col items-center'>
            <h1 className="font-bold text-lg">Established Traffic Control, Inc.</h1>
            <p>3162 Unionville Pike</p>
            <p>Hatfield, PA 19440</p>
            <p>O: 215.997.8801 | F: 215.997.8868</p>
            <p>Email: <span className='underline text-blue-600'>{sender.email}</span></p>
            <p className="text-[9px]">A Veteran and Minority Owned Company</p>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">PROPOSAL</h2>
            <p>{quoteDate.toLocaleDateString('en-US')}</p>
            <p className="font-semibold uppercase">Revised Flagging</p>
            <p>ETC Contact: {sender.name}</p>
          </div>
        </div>
      </header>

      {/* Customer / Job Info */}
      <section className="grid grid-cols-2 grid-rows-2 border border-black mt-2 text-[10px]">
        <div className="p-1 border-r border-b border-black">
          <p><span className="font-bold">TO:</span> {customer?.name || 'N/A'}</p>
          <p><span className="font-bold">Address:</span> {customer?.address?? '-'}</p>
        </div>

        <div className="p-1 border-b border-black">
          <p><span className="font-bold">ETC Job #:</span> {quoteNumber}</p>
          <p><span className="font-bold">Contact:</span> {pointOfContact?.name?? "-"}</p>
          <p><span className="font-bold">Phone:</span> {customer?.mainPhone?? "-"}</p>
        </div>

        <div className="p-1 border-r border-black">
          <p><span className="font-bold">Township:</span> {adminData?.location?? "-"}</p>
          <p><span className="font-bold">County:</span> {county?? "-"}</p>
          <p><span className="font-bold">S.R./Route:</span> {sr?? "-"}</p>
          <p><span className="font-bold">Project:</span> {ecms?? "-"}</p>
        </div>

        <div className="p-1">
          <p><span className="font-bold">Bid Date:</span> {quoteDate.toLocaleDateString('en-US')}</p>
          <p><span className="font-bold">MPT Start Date:</span> __________</p>
          <p><span className="font-bold">MPT Completion Date:</span> __________</p>
          <p><span className="font-bold">MPT Days:</span> __________</p>
        </div>
      </section>

      <div className='text-center my-4 w-4/5 m-auto font-semibold flex flex-col'>
        <p className='font-bold'>CONFIDENTIALITY NOTICE</p>
        <p className=''>
          This message (including any attachments) may contain confidential, proprietary, privileged and/or private information. The information is intended to be for the use of the individual or entity designated above. If you are not the intended recipient of this message, please notify the sender immediately and delete the message and any attachments. Any disclosure, reproduction, distribution or other use of this message or any attachments by an individual or entity other than the intended recipient is prohibited.
          PRICING IS SUBJECT TO CHANGE at any time due to the continued escalation of raw material and transportation costs</p>
      </div>


      {/* Items */}
      <section className="mt-3 text-[12px]">
        <table className="w-full border-[1.5px] border-black border-collapse">
          <thead>
            <tr className='border-black border-b-[1.5px]'>
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
                    <td className="px-2 py-1 align-top text-center">
                      {item.itemNumber || index + 1}
                    </td>
                    <td className="px-2 text-center  py-1 font-bold align-top">
                      {item.description}
                      {item.notes && (
                        <div className="text-[10px] font-normal text-gray-600 mt-1">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1 text-center align-top">
                      {item.quantity} {item.uom || 'EA'}
                    </td>
                    <td className="px-2 text-center py-1 align-top">
                      {formatMoney(item.unitPrice || 0)}
                    </td>
                    <td className="px-2 text-center py-1 align-top">
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

            {/* Total */}
            <tr className="border-t-[1.5] border-black">
              <td colSpan={4} className="px-2 py-1 text-right font-bold">
                TOTAL
              </td>
              <td className="px-2 py-1 text-right font-bold">
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
      {/* Notes */}
      <section className="mt-2 text-[9px] flex flex-row gap-4">
        <p className="uppercase font-bold">Notes:</p>
        <div>
          <p>Local service area - 2 flaggers, material, setup, pickup</p>
          <p>Contractor agrees on breaks throughout the day for our flaggers otherwise an extra flagger will be dispatched and charged to the contractor</p>
          <p>Based on a 4-8 hour day</p>
          <p>Up to 4 hours - $1300.00 LS</p>
          <p>Time starts 1/2 - 1 hr prior to an agreed upon time with contractor for setup</p>
          <p>Cancellations must be called in by 5 AM to the crew leader</p>
          <p>All other scenarios will be priced as needed</p>
        </div>
      </section>

      {/* Rental Rates */}
      <section className="mt-3 text-[10px]">
        <p className="font-bold uppercase">Rental Rates:</p>

        {/* Table container */}
        <div className="w-full border border-black mt-1 text-[10px]">

          {/* Table Header */}
          <div className="grid grid-cols-6 font-bold">
            <div className="px-2 py-1">Rental</div>
            <div className="px-2 py-1 text-center">Daily</div>
            <div className="px-2 py-1 text-center">Weekly</div>
            <div className="px-2 py-1 text-center">Monthly</div>
          </div>

          {/* Table Rows */}
          <div className="grid grid-cols-6">
            <div className="px-2 py-1">Arrow Board</div>
            <div className="px-2 py-1 text-center">$50.00</div>
            <div className="px-2 py-1 text-center">$150.00</div>
            <div className="px-2 py-1 text-center">$450.00</div>
          </div>

          <div className="grid grid-cols-6">
            <div className="px-2 py-1">Message Board</div>
            <div className="px-2 py-1 text-center">$100.00</div>
            <div className="px-2 py-1 text-center">$450.00</div>
            <div className="px-2 py-1 text-center">$750.00</div>
          </div>

          <div className="grid grid-cols-6">
            <div className="px-2 py-1">Channelizers</div>
            <div className="px-2 py-1 text-center">$0.75</div>
            <div className="px-2 py-1"></div>
            <div className="px-2 py-1"></div>
          </div>

          <div className="grid grid-cols-6">
            <div className="px-2 py-1">B Lights &amp; Sequential</div>
            <div className="px-2 py-1 text-center">$0.13</div>
            <div className="px-2 py-1"></div>
            <div className="px-2 py-1"></div>
          </div>

          <div className="grid grid-cols-6">
            <div className="px-2 py-1">Type A/C Lights</div>
            <div className="px-2 py-1 text-center">$0.20</div>
            <div className="px-2 py-1"></div>
            <div className="px-2 py-1"></div>
          </div>

          <div className="grid grid-cols-6">
            <div className="px-2 py-1">Add'l Mobilizations</div>
            <div className="px-2 py-1 text-center">$125.00</div>
          </div>
        </div>
      </section>

      {/* Signature */}
      <section className="mt-4 text-center">
        <p className="text-[9px] text-blue-800">
          If the proposal is accepted, please sign and date below and return. Thank you!
        </p>
        <div className="flex justify-between mt-4 mx-8">
          <p className="text-[10px]">ACCEPTED BY: __________________________</p>
          <p className="text-[10px]">DATE: _______________</p>
        </div>
      </section>
    </div>
  )
}

export default BidProposalWorksheet
