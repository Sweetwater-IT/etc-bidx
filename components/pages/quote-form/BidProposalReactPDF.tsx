import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { AdminData } from '@/types/TAdminData';
import { QuoteItem } from '@/types/IQuoteItem';
import { PaymentTerms } from './QuoteAdminInformation';
import { proposalStyles } from './proposal-parts/proposalStyles';
import { StandardConditions, StandardExclusions } from './proposal-parts/StandardTermsAndConditions';
import { StandardRentalEquipmentAgreement } from './proposal-parts/RentalEquipmentAgreement';
import { StandardFlaggingTermsConditions } from './proposal-parts/FlaggingTermsAndConditions';
import { TermsNames } from '@/app/quotes/create/QuoteFormProvider';
import { User } from '@/types/User';
import { Customer } from '@/types/Customer';

// Helpers seguros (sin Intl)
const formatDate = (d: Date) =>
  d ? `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}` : '-';

const formatNumber = (n: number | undefined) =>
  typeof n === 'number' ? n.toFixed(2) : '0.00';

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

export const BidProposalReactPDF = ({
  paymentTerms,
  pointOfContact,
  quoteNumber,
  sender,
  quoteDate,
  adminData,
  items,
  customers,
  includedTerms,
  customTaC,
  county,
  sr,
  ecms,
}: Props) => {

  const calculateTotal = () => {
    if (!items?.length) return 0;
    return items.reduce((acc, item) => {
      const discount = item.discount || 0;
      const discountMultiplier = (100 - discount) / 100;
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const parentItemValue = quantity * unitPrice;

      const compositeTotal = item.associatedItems?.reduce(
        (subSum, comp) => subSum + ((comp.quantity || 0) * (comp.unitPrice || 0)), 0
      ) || 0;

      return acc + ((parentItemValue + compositeTotal) * discountMultiplier);
    }, 0);
  };

  const calculateExtendedPrice = (item: QuoteItem) => {
    const discount = item.discount || 0;
    const discountMultiplier = (100 - discount) / 100;
    const parentItemValue = (item.quantity || 0) * (item.unitPrice || 0);
    const compositeTotal = item.associatedItems?.reduce(
      (subSum, comp) => subSum + ((comp.quantity || 0) * (comp.unitPrice || 0)), 0
    ) || 0;
    return formatNumber((parentItemValue + compositeTotal) * discountMultiplier);
  };

  const total = calculateTotal();

  return (
    <Document title={`Proposal ${ecms}`}>
      <Page size="A4" style={proposalStyles.page}>

        {/* Footer fijo con paginado */}
        <Text
          fixed
          style={{ position: 'absolute', bottom: 10, right: 30, fontSize: 10 }}
          render={({ pageNumber, totalPages }) =>
            `Initials: ________ Page ${pageNumber} of ${totalPages}`
          }
        />

        {/* Header de continuación */}
        <Text
          fixed
          style={{ position: 'absolute', top: 10, left: 30, fontSize: 13, fontWeight: 'bold' }}
          render={({ pageNumber }) =>
            pageNumber > 1
              ? `Quote For: ${customers?.[0]?.name || 'Estimating'} - Quote ID: ${quoteNumber} cont.`
              : ''
          }
        />

        {/* Encabezado */}
        <View style={proposalStyles.companyInfoContainer}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Image style={proposalStyles.img} src="/logo.jpg" />
            <Text style={proposalStyles.etcHeader}>Established Traffic Control, Inc.</Text>
          </View>
          <View>
            <Text style={proposalStyles.quoteNumber}>{quoteNumber}</Text>
            <Text style={proposalStyles.infoText}>{sender.name}</Text>
            <Text style={proposalStyles.infoText}>{sender.email}</Text>
          </View>
        </View>

        {/* Datos cliente */}
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text>Sold To: {customers?.[0]?.name || '-'}</Text>
            <Text>ATT: {pointOfContact?.name}</Text>
            <Text>Created: {formatDate(quoteDate)}</Text>
          </View>
        </View>

        {/* Tabla items */}
        <View style={proposalStyles.table}>
          <View style={proposalStyles.tableHeader}>
            <Text>ITEM #</Text>
            <Text style={{ flex: 3 }}>DESCRIPTION</Text>
            <Text>QTY</Text>
            <Text>UOM</Text>
            <Text>UNIT PRICE</Text>
            <Text>EXTENDED</Text>
          </View>

          {items?.map((item, i) => (
            <View key={`item-${i}`} style={proposalStyles.tableRow}>
              <Text>{item.itemNumber}</Text>
              <Text style={{ flex: 3 }}>{item.description}</Text>
              <Text>{item.quantity}</Text>
              <Text>{item.uom || 'EA'}</Text>
              <Text>${formatNumber(item.unitPrice)}</Text>
              <Text>${calculateExtendedPrice(item)}</Text>
            </View>
          ))}

          <View style={proposalStyles.tableRow}>
            <Text>Total</Text>
            <Text style={{ flex: 3 }}></Text>
            <Text></Text><Text></Text>
            <Text></Text>
            <Text>${formatNumber(total)}</Text>
          </View>
        </View>

        {includedTerms['standard-terms'] && (
          <>
            <StandardConditions />
            <StandardExclusions />
          </>
        )}
        {includedTerms['rental-agreements'] && <StandardRentalEquipmentAgreement />}
        {includedTerms['flagging-terms'] && <StandardFlaggingTermsConditions />}
      </Page>
    </Document>
  );
};
