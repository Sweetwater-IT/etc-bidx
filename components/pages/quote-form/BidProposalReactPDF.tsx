import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { AdminData } from '@/types/TAdminData';
import { QuoteItem } from '@/types/IQuoteItem';
// import { User } from '@/types/User';
import { PaymentTerms, } from './QuoteAdminInformation';
import { proposalStyles } from './proposal-parts/proposalStyles';
import { StandardConditions, StandardExclusions } from './proposal-parts/StandardTermsAndConditions';
import { StandardRentalEquipmentAgreement } from './proposal-parts/RentalEquipmentAgreement';
import { StandardFlaggingTermsConditions } from './proposal-parts/FlaggingTermsAndConditions';
import { TermsNames } from '@/app/quotes/create/QuoteFormProvider';
import { User } from '@/types/User';
import { Customer } from '@/types/Customer';

interface Props {
  adminData: AdminData
  items?: QuoteItem[]
  customers: Customer[]
  sender: User
  quoteDate: Date
  quoteNumber: string
  paymentTerms: PaymentTerms
  includedTerms: Record<TermsNames, boolean>
  customTaC?: string
  county: string
  sr: string
  ecms: string
  pointOfContact: { name: string, email: string }
}

export const BidProposalReactPDF = ({ paymentTerms, pointOfContact, quoteNumber, sender, quoteDate, adminData, items, customers, includedTerms, customTaC,
  county, sr, ecms, }: Props) => {
  // Calculate the total for all items including composite items
  const calculateTotal = () => {
    if (!items?.length) return 0;

    return items.reduce((acc, item) => {
      const discount = item.discount || 0;
      const discountMultiplier = (100 - discount) / 100;

      // Calculate parent item value
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const parentItemValue = quantity * unitPrice;

      // Calculate composite items total if they exist
      const compositeTotal = item.associatedItems && item.associatedItems.length > 0
        ? item.associatedItems.reduce((subSum, compositeItem) =>
          subSum + ((compositeItem.quantity || 0) * (compositeItem.unitPrice || 0)), 0)
        : 0;

      // Apply discount to the combined total
      return acc + ((parentItemValue + compositeTotal) * discountMultiplier);
    }, 0);
  };

  // Calculate extended price for a single item
  const calculateExtendedPrice = (item: QuoteItem) => {
    const discount = item.discount || 0;
    const discountMultiplier = (100 - discount) / 100;

    // Calculate parent item value
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const parentItemValue = quantity * unitPrice;

    // Calculate composite items total if they exist
    const compositeTotal = item.associatedItems && item.associatedItems.length > 0
      ? item.associatedItems.reduce((subSum, compositeItem) =>
        subSum + ((compositeItem.quantity || 0) * (compositeItem.unitPrice || 0)), 0)
      : 0;

    // Apply discount to the combined total
    return ((parentItemValue + compositeTotal) * discountMultiplier).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const total = calculateTotal();

  return (
    <Document title={`Proposal ${ecms}`}>
      <Page size="A4" style={proposalStyles.page}>
        {/* Page number and initials - fixed component that appears on every page */}
        <Text
          fixed
          style={{
            position: 'absolute',
            bottom: 10,
            right: 30,
            fontSize: 10
          }}
          render={({ pageNumber, totalPages }) => (
            `Initials: ________ Page ${pageNumber} of ${totalPages}`
          )}
        />

        {/* Continuation header - only appears on pages after the first */}
        <View
          fixed
          style={{
            position: 'absolute',
            top: 10,
            left: 30,
            fontSize: 13,
            fontWeight: 'bold'
          }}
          render={({ pageNumber }) => (
            pageNumber > 1 ? (
              <Text>Quote For: {customers.length > 1 ? 'Estimating' : customers[0].name} - Quote ID: {quoteNumber} cont.</Text>
            ) : null
          )}
        />

        {/* Company Info and Header */}
        <View style={proposalStyles.companyInfoContainer}>
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
            <Image style={proposalStyles.img} src='/logo.jpg' />
            <Text style={proposalStyles.etcHeader}>Established Traffic Control, Inc.</Text>
          </View>
          <View>
            <Text style={proposalStyles.quoteNumber}>{quoteNumber}</Text>
            <Text style={proposalStyles.infoText}>{sender.name}</Text>
            <Text style={proposalStyles.infoText}>{sender.email}</Text>
            <Text style={proposalStyles.infoText}>3162 UNIONVILLE PIKE</Text>
            <Text style={proposalStyles.infoText}>HATFIELD, PA 19440</Text>
            <Text style={proposalStyles.infoText}>OFFICE: (215) 997-8801</Text>
            <Text style={proposalStyles.infoText}>FAX: (215) 997-8868</Text>
            <Text style={proposalStyles.infoText}>DBE / VBE</Text>
          </View>
          {/* <View style={proposalStyles.rightInfo}>
            <View style={proposalStyles.quoteTable}>
              <View style={proposalStyles.quoteTableRow}>
                <View style={[proposalStyles.quoteTableCell, { borderRight: '1px solid right' }]}>
                  <Text style={proposalStyles.quoteTableLabel}>Quote Date</Text>
                </View>
                <View style={proposalStyles.quoteTableCell}>
                  <Text style={proposalStyles.quoteTableLabel}>Quote ID</Text>
                </View>
              </View>
              <View style={proposalStyles.quoteTableRow}>
                <View style={[proposalStyles.quoteTableCell, { borderRight: '1px solid right' }]}>
                  <Text>{quoteDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <View style={proposalStyles.quoteTableCell}>
                  <Text>{quoteNumber}</Text>
                </View>
              </View>
              <View style={proposalStyles.quoteTableRow}>
                <View style={[proposalStyles.quoteTableCell, { borderRight: '1px solid right' }]}>
                  <Text style={proposalStyles.quoteTableLabel}>Payment Terms</Text>
                </View>
                <View style={proposalStyles.quoteTableCell}>
                  <Text>{paymentTerms}</Text>
                </View>
              </View>
            </View>
            <Text style={proposalStyles.validThrough}>
              Quote valid through {new Date(quoteDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
            </Text>
          </View> */}
        </View>
        {/* <View>
            <View>
              <Text style={proposalStyles.quoteTableLabel}>
                Attention
              </Text>
            </View>
            <View style={{ fontSize: 11 }}>
              <Text>{customers.length > 1 ? 'Estimating' : customers[0]}</Text>
            </View>
          </View> */}

        {/* Right box - Job Information */}
        {/* <View style={proposalStyles.infoGrid}>
              <View style={proposalStyles.infoGridCell}>
                <Text style={proposalStyles.quoteTableLabel}>County:</Text>
                <Text>{county}</Text>
              </View>
              <View style={proposalStyles.infoGridCell}>
                <Text style={proposalStyles.quoteTableLabel}>State Route:</Text>
                <Text>{sr}</Text>
              </View>
              <View style={proposalStyles.infoGridCell}>
                <Text style={proposalStyles.quoteTableLabel}>ECMS:</Text>
                <Text>{ecms}</Text>
              </View>
              <View style={proposalStyles.infoGridCell}>
                <Text style={proposalStyles.quoteTableLabel}>Start Date:</Text>
                <Text>{adminData.startDate && new Date(adminData.startDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</Text>
              </View>
              <View style={proposalStyles.infoGridCell}>
                <Text style={proposalStyles.quoteTableLabel}>End Date:</Text>
                <Text>{adminData.endDate && new Date(adminData.endDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</Text>
              </View>
              <View style={proposalStyles.infoGridCell}>
                <Text style={proposalStyles.quoteTableLabel}>Total days:</Text>
                <Text>
                  {(adminData.startDate && adminData.endDate)
                    ? `${Math.ceil((new Date(adminData.endDate).getTime() - new Date(adminData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                    : ''}
                </Text>
              </View>
            </View> */}
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {/* Sold To Column */}
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={proposalStyles.quoteTableLabel}>Sold To:</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].name}</Text>
            <Text style={{ fontSize: 10 }}>ATT: {pointOfContact.name}</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].address}</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].city}, {customers[0].state} {customers[0].zip} US</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].mainPhone}</Text>
            <Text style={{ fontSize: 10, marginTop: 15 }}>Created: {quoteDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</Text>
          </View>

          {/* Bill To Column */}
          <View style={{ flex: 1, paddingHorizontal: 5 }}>
            <Text style={proposalStyles.quoteTableLabel}>Bill To:</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].name}</Text>
            <Text style={{ fontSize: 10 }}>ATT: {pointOfContact.name}</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].address}</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].city}, {customers[0].state} {customers[0].zip} US</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].mainPhone}</Text>
          </View>

          {/* Ship To Column */}
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text style={proposalStyles.quoteTableLabel}>Ship To:</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].name}</Text>
            <Text style={{ fontSize: 10 }}>ATT: {pointOfContact.name}</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].address}</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].city}, {customers[0].state} {customers[0].zip} US</Text>
            <Text style={{ fontSize: 10 }}>{customers[0].mainPhone}</Text>
            <Text style={{ fontSize: 10, marginTop: 15, textAlign: 'right' }}>
              Expires: {new Date(quoteDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Table for items */}
        <View style={proposalStyles.table}>
          <View style={proposalStyles.tableHeader}>
            <Text style={proposalStyles.tableHeaderCell}>ITEM #</Text>
            <Text style={[proposalStyles.tableHeaderCell, { flex: 3 }]}>DESCRIPTION</Text>
            <Text style={[proposalStyles.tableHeaderCell, { flex: .8 }]}>QTY</Text>
            <Text style={[proposalStyles.tableHeaderCell, { flex: .8 }]}>UOM</Text>
            <Text style={proposalStyles.tableHeaderCell}>UNIT PRICE</Text>
            <Text style={[proposalStyles.tableHeaderCell, { borderRightWidth: 0 }]}>EXTENDED PRICE</Text>
          </View>

          {/* First render all actual items */}
          {items?.map((item, index) => (
            <View key={`item-${index}`} style={proposalStyles.tableRow}>
              <Text style={proposalStyles.tableCell}>{item.itemNumber}</Text>
              <Text style={[proposalStyles.tableCell, { flex: 3 }]}>{item.description + '\n\n' + item.notes}</Text>
              <Text style={[proposalStyles.tableCell, { flex: .8 }]}>{item.quantity}</Text>
              <Text style={[proposalStyles.tableCell, { flex: .8 }]}>{item.uom || 'EA'}</Text>
              <Text style={[proposalStyles.tableCell, { textAlign: 'right'}]}>
                ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={[proposalStyles.tableCell, { textAlign: 'right' }]}>
                ${calculateExtendedPrice(item)}
              </Text>
            </View>
          ))}

          {/* Then add empty rows to fill up to 10 if needed */}
          {Array(Math.max(0, 10 - (items?.length || 0))).fill(null).map((_, i) => (
            <View key={`empty-${i}`} style={proposalStyles.tableRow}>
              <Text style={proposalStyles.tableCell}></Text>
              <Text style={[proposalStyles.tableCell, { flex: 3 }]}></Text>
              <Text style={proposalStyles.tableCell}></Text>
              <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}></Text>
              <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}></Text>
              <Text style={[proposalStyles.tableCell, { borderRightWidth: 0, textAlign: 'right' }]}>$    -</Text>
            </View>
          ))}
          <View style={proposalStyles.tableRow}>
            <Text style={proposalStyles.tableCell}></Text>
            <Text style={[proposalStyles.tableCell, { flex: 3 }]}></Text>
            <Text style={proposalStyles.tableCell}></Text>
            <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}></Text>
            <Text style={[proposalStyles.tableCell, { flex: 0.8, textAlign: 'right' }]}>TOTAL</Text>
            <Text style={[proposalStyles.tableCell, { borderRightWidth: 0, textAlign: 'right' }]}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
        </View>

        <Text style={proposalStyles.warningText}>
          ABOVE PRICING IS SUBJECT TO CHANGE AT ANY TIME DUE TO THE CONTINUED ESCALATION OF RAW MATERIAL AND TRANSPORTATION COSTS. ABOVE PRICES EXCLUDE TAX.
        </Text>
        {includedTerms['equipment-sale'] && <View style={[proposalStyles.table, { marginTop: 10, backgroundColor: '#FFFF00' }]}>
          <Text style={{ fontSize: 8, padding: 5, color: 'red', textAlign: 'center' }}>SALE ITEM PAYMENT TERMS ARE NET 14</Text>
        </View>}

        {includedTerms['custom-terms'] && customTaC !== '' && <View style={[proposalStyles.table, { marginTop: 10, padding: 4 }]}>
          {customTaC && customTaC.length > 0 && <Text style={{ fontSize: 11, display: 'flex', flexDirection: 'row' }}>{customTaC}</Text>}
        </View>}

        <View style={{ backgroundColor: '#e4e4e4', padding: 12, marginTop: 15}}>
            <View style={{justifyContent: 'space-between', flexDirection: 'row'}}>
              <Text style={{ textAlign: 'left', fontWeight: 'bold'}}>Sub Total</Text>
              <Text style={{ textAlign: 'right'}}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={{justifyContent: 'space-between', flexDirection: 'row', marginTop: 10}}>
              <Text style={{ textAlign: 'left', fontWeight: 'bold'}}>Miscellaneous</Text>
              <Text style={{ textAlign: 'right'}}>0</Text>
            </View>
            <View style={{justifyContent: 'space-between', flexDirection: 'row'}}>
              <Text style={{ textAlign: 'left', fontWeight: 'bold'}}>Estimated Sales Tax</Text>
              <Text style={{ textAlign: 'right'}}>0</Text>
            </View>
            <View style={{justifyContent: 'space-between', flexDirection: 'row'}}>
              <Text style={{ textAlign: 'left', fontWeight: 'bold'}}>Total</Text>
              <Text style={{ textAlign: 'right', fontWeight: 'bold'}}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
        </View>

        <View style={{ marginTop: 20, marginHorizontal: 30 }}>
          <Text style={{ fontSize: 10, textAlign: 'center', color: '#000080' }}>
            IF THE PROPOSAL IS ACCEPTED, PLEASE SIGN AND DATE BELOW AND RETURN. THANK YOU!,
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 10 }}>ACCEPTED BY:________________________________</Text>
            <Text style={{ fontSize: 10 }}>DATE:_______________</Text>
          </View>
        </View>

        {includedTerms['standard-terms'] && <><StandardConditions />
          <StandardExclusions /></>}
        {includedTerms['rental-agreements'] && <StandardRentalEquipmentAgreement />}
        {includedTerms['flagging-terms'] && <StandardFlaggingTermsConditions />}
      </Page>
    </Document>
  );
};