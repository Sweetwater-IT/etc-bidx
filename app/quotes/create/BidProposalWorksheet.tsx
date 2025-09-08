import React from 'react'
import { Customer } from '@/types/Customer'
import Image from 'next/image'
import { QuoteItem } from '@/types/IQuoteItem'
import { AdminData } from '@/types/TAdminData'
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

const cellClass = "p-1 border-b border-gray-200 text-[10px]"
const headerCellClass = "p-1 border-b-2 border-gray-300 bg-gray-100 text-left text-[10px] font-bold text-gray-600 uppercase"

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

  const formatMoney = (value: number) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

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

  const total = items.reduce((acc, item) => acc + calculateExtendedPrice(item), 0);

  return (
    <div className="bg-white text-black p-4 font-sans text-[10px] border-2 border-gray-400">
      {/* Header */}
      <header className="flex justify-between items-start pb-2">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="ETC Logo" width={50} height={50} />
          <h1 className="text-lg font-bold text-gray-800">Established Traffic Control, Inc.</h1>
        </div>
        <div className="text-right text-[10px]">
          <p className="font-bold text-lg">495</p>
          <p className="font-semibold">{sender.name}</p>
          <p>{sender.email}</p>
          <p>3162 UNIONVILLE PIKE</p>
          <p>HATFIELD, PA 19440</p>
          <p>OFFICE: (215) 997-8801</p>
          <p>FAX: (215) 997-8868</p>
          <p>DBE / VBE</p>
        </div>
      </header>

      {/* Sold To / Bill To / Ship To */}
      <section className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
        {['Sold To', 'Bill To', 'Ship To'].map((label, idx) => (
          <div key={label}>
            <p className="font-bold">{label}:</p>
            <p>{customer?.name || 'N/A'}</p>
            <p>ATT: {pointOfContact?.name || 'N/A'}</p>
            <p>{customer?.address || ''}</p>
            <p>{customer?.city}, {customer?.state} {customer?.zip} US</p>
            <p>{customer?.mainPhone || ''}</p>
            {idx === 0 && (
              <p className="mt-4">
                Created: {quoteDate.toLocaleDateString('en-US')}
              </p>
            )}
            {idx === 2 && (
              <p className="mt-4 text-right">
                Expires: {new Date(quoteDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US')}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* Items Table */}
      <section className="mt-4">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-200">
              <th className={headerCellClass}>Item #</th>
              <th className={`${headerCellClass} w-2/5`}>Description</th>
              <th className={headerCellClass}>Qty</th>
              <th className={headerCellClass}>UOM</th>
              <th className={headerCellClass}>Unit Price</th>
              <th className={headerCellClass}>Extended Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              return (
                <React.Fragment key={item.id || index}>
                  <tr className="border-b border-gray-300">
                    <td className={cellClass}>{item.itemNumber}</td>
                    <td className={`${cellClass} w-2/5`}>
                      {item.description}
                      {item.notes && <div className="text-gray-500 text-[9px] whitespace-pre-wrap mt-1">{item.notes}</div>}
                    </td>
                    <td className={`${cellClass} text-center`}>{item.quantity}</td>
                    <td className={cellClass}>{item.uom || 'EA'}</td>
                    <td className={`${cellClass} text-right`}>{formatMoney(item.unitPrice || 0)}</td>
                    <td className={`${cellClass} text-right`}>{formatMoney(calculateExtendedPrice(item))}</td>
                  </tr>
                  {item.associatedItems?.map((assocItem, assocIndex) => (
                    <tr key={`assoc-${assocIndex}`} className="bg-gray-50 border-b border-gray-200">
                      <td className={cellClass}></td>
                      <td className={`${cellClass} pl-4 text-[9px]`}>- {assocItem.description}</td>
                      <td className={`${cellClass} text-center text-[9px]`}>{assocItem.quantity}</td>
                      <td className={`${cellClass} text-[9px]`}>{assocItem.uom || 'EA'}</td>
                      <td className={`${cellClass} text-right text-[9px]`}>{formatMoney(assocItem.unitPrice || 0)}</td>
                      <td className={cellClass}></td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
            {/* Total Row */}
            <tr className="border-t-2 border-black">
              <td colSpan={4} className={cellClass}></td>
              <td className={`${cellClass} text-right font-bold`}>TOTAL</td>
              <td className={`${cellClass} text-right font-bold`}>{formatMoney(total)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Warning */}
      <p className="text-center text-[8px] font-bold my-2">
        ABOVE PRICING IS SUBJECT TO CHANGE AT ANY TIME DUE TO THE CONTINUED ESCALATION OF RAW MATERIAL AND TRANSPORTATION COSTS. ABOVE PRICES EXCLUDE TAX.
      </p>

      {includedTerms['equipment-sale'] && (
        <div className="bg-yellow-300 text-red-600 text-center text-[8px] p-1 my-2">
          SALE ITEM PAYMENT TERMS ARE NET 14
        </div>
      )}

      {includedTerms['custom-terms'] && customTaC && (
        <div className="border p-2 my-2 text-[10px]">
          <p className="whitespace-pre-wrap">{customTaC}</p>
        </div>
      )}

      {/* Final Totals Box */}
      <section className="bg-gray-200 p-3 mt-2">
        <div className="flex justify-between">
          <span className="font-bold">Sub Total</span>
          <span>{formatMoney(total)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-bold">Miscellaneous</span>
          <span>{formatMoney(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Estimated Sales Tax</span>
          <span>{formatMoney(0)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </div>
      </section>

      {/* Signature Section */}
      <section className="mt-4 text-center">
        <p className="text-[10px] text-blue-800">
          IF THE PROPOSAL IS ACCEPTED, PLEASE SIGN AND DATE BELOW AND RETURN. THANK YOU!,
        </p>
        <div className="flex justify-between mt-4 mx-8">
          <p className="text-[10px]">ACCEPTED BY:________________________________</p>
          <p className="text-[10px]">DATE:_______________</p>
        </div>
      </section>
    </div>
  )
}

export default BidProposalWorksheet;
