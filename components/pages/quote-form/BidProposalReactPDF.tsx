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

  // Helper para formato de moneda
  const formatMoney = (value: number) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Cliente principal (previene crash si customers está vacío)
  const primaryCustomer = customers?.[0] ?? {
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    mainPhone: ""
  };

  // Calcular precio extendido por item
  const calculateExtendedPrice = (item: QuoteItem) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;

    // Suma el precio de los ítems asociados para obtener el costo de una unidad compuesta
    const compositeTotalPerUnit = item.associatedItems?.length
      ? item.associatedItems.reduce((subSum, c) =>
        subSum + ((c.quantity || 0) * (c.unitPrice || 0)), 0)
      : 0;

    // El precio total de una unidad (ítem principal + asociados)
    const totalUnitPrice = unitPrice + compositeTotalPerUnit;

    // El precio base extendido antes del descuento
    const basePrice = quantity * totalUnitPrice;

    const discount = item.discount || 0;
    const discountType = item.discountType || 'percentage';

    // Calcula el monto del descuento
    const discountAmount = discountType === 'dollar'
      ? discount // Descuento plano sobre el total de la línea
      : basePrice * (discount / 100);

    return basePrice - discountAmount;
  };

  // Calcular total general
  const calculateTotal = () => {
    if (!items?.length) return 0;
    return items.reduce((acc, item) => acc + calculateExtendedPrice(item), 0);
  };

  const total = calculateTotal();

  return (
    <Document title={`Proposal ${ecms}`}>
      <Page size="A4" style={proposalStyles.page}>
        {/* Footer con número de página */}
        <Text
          fixed
          style={{ position: 'absolute', bottom: 10, right: 30, fontSize: 10 }}
          render={({ pageNumber, totalPages }) => (
            `Initials: ________ Page ${pageNumber} of ${totalPages}`
          )}
        />

        {/* Header en páginas siguientes */}
        <View
          fixed
          style={{ position: 'absolute', top: 10, left: 30, fontSize: 13, fontWeight: 'bold' }}
          render={({ pageNumber }) =>
            pageNumber > 1 ? (
              <Text>
                Quote For: {customers.length > 1 ? 'Estimating' : primaryCustomer.name} - Quote ID: {quoteNumber} cont.
              </Text>
            ) : null
          }
        />

        {/* Company Info */}
        <View style={proposalStyles.companyInfoContainer}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
        </View>

        {/* Sold To / Bill To / Ship To */}
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {['Sold To', 'Bill To', 'Ship To'].map((label, idx) => (
            <View key={label} style={{ flex: 1, paddingHorizontal: 5 }}>
              <Text style={proposalStyles.quoteTableLabel}>{label}:</Text>
              <Text style={{ fontSize: 10 }}>{primaryCustomer.name}</Text>
              <Text style={{ fontSize: 10 }}>ATT: {pointOfContact.name}</Text>
              <Text style={{ fontSize: 10 }}>{primaryCustomer.address}</Text>
              <Text style={{ fontSize: 10 }}>
                {primaryCustomer.city}, {primaryCustomer.state} {primaryCustomer.zip} US
              </Text>
              <Text style={{ fontSize: 10 }}>{primaryCustomer.mainPhone}</Text>
              {idx === 0 && (
                <Text style={{ fontSize: 10, marginTop: 15 }}>
                  Created: {quoteDate.toLocaleDateString('en-US')}
                </Text>
              )}
              {idx === 2 && (
                <Text style={{ fontSize: 10, marginTop: 15, textAlign: 'right' }}>
                  Expires: {new Date(quoteDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US')}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Items Table */}
        <View style={proposalStyles.table}>
          <View style={proposalStyles.tableHeader}>
            <Text style={proposalStyles.tableHeaderCell}>ITEM #</Text>
            <Text style={[proposalStyles.tableHeaderCell, { flex: 3 }]}>DESCRIPTION</Text>
            <Text style={[proposalStyles.tableHeaderCell, { flex: .8 }]}>QTY</Text>
            <Text style={[proposalStyles.tableHeaderCell, { flex: .8 }]}>UOM</Text>
            <Text style={proposalStyles.tableHeaderCell}>UNIT PRICE</Text>
            <Text style={[proposalStyles.tableHeaderCell, { borderRightWidth: 0 }]}>EXTENDED PRICE</Text>
          </View>

          {items?.map((item, index) => (
            <React.Fragment key={`item-fragment-${index}`}>
              {/* Fila del Ítem Principal */}
              <View style={proposalStyles.tableRow}>
                <Text style={proposalStyles.tableCell}>{item.itemNumber}</Text>
                <Text style={[proposalStyles.tableCell, { flex: 3 }]}>
                  {[item.description, item.notes].filter(Boolean).join("\n\n")}
                </Text>
                <Text style={[proposalStyles.tableCell, { flex: .8 }]}>{item.quantity}</Text>
                <Text style={[proposalStyles.tableCell, { flex: .8 }]}>{item.uom || 'EA'}</Text>
                <Text style={[proposalStyles.tableCell, { textAlign: 'right' }]}>
                  {formatMoney(item.unitPrice ?? 0)}
                </Text>
                <Text style={[proposalStyles.tableCell, { textAlign: 'right', borderRightWidth: 0 }]}>
                  {formatMoney(calculateExtendedPrice(item))}
                </Text>
              </View>

              {/* Filas de Ítems Asociados */}
              {item.associatedItems?.map((assocItem, assocIndex) => (
                <View key={`assoc-item-${assocIndex}`} style={{ ...proposalStyles.tableRow, backgroundColor: '#f9f9f9' }}>
                  <Text style={{ ...proposalStyles.tableCell, flex: 1 }}></Text>
                  <Text style={{ ...proposalStyles.tableCell, flex: 3, paddingLeft: 15, fontSize: 9 }}>
                    - {assocItem.description}
                  </Text>
                  <Text style={{ ...proposalStyles.tableCell, flex: .8, fontSize: 9 }}>{assocItem.quantity}</Text>
                  <Text style={{ ...proposalStyles.tableCell, flex: .8, fontSize: 9 }}>{assocItem.uom || 'EA'}</Text>
                  <Text style={{ ...proposalStyles.tableCell, textAlign: 'right', fontSize: 9 }}>
                    {formatMoney(assocItem.unitPrice ?? 0)}
                  </Text>
                  <Text style={{ ...proposalStyles.tableCell, borderRightWidth: 0 }}></Text>
                </View>
              ))}
            </React.Fragment>
          ))}

          {/* Rellenar filas vacías hasta 10 */}
          {Array(Math.max(0, 10 - (items?.length || 0))).fill(null).map((_, i) => (
            <View key={`empty-${i}`} style={proposalStyles.tableRow}>
              <Text style={proposalStyles.tableCell}></Text>
              <Text style={[proposalStyles.tableCell, { flex: 3 }]}></Text>
              <Text style={proposalStyles.tableCell}></Text>
              <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}></Text> 
              <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}></Text>
              <Text style={[proposalStyles.tableCell, { borderRightWidth: 0, textAlign: 'right' }]}>-</Text>
            </View>
          ))}

          {/* Total */}
          <View style={proposalStyles.tableRow}>
            <Text style={proposalStyles.tableCell}></Text>
            <Text style={[proposalStyles.tableCell, { flex: 3 }]}></Text>
            <Text style={proposalStyles.tableCell}></Text>
            <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}></Text>
            <Text style={[proposalStyles.tableCell, { flex: 0.8, textAlign: 'right' }]}>TOTAL</Text>
            <Text style={[proposalStyles.tableCell, { borderRightWidth: 0, textAlign: 'right' }]}>
              {formatMoney(total)}
            </Text>
          </View>
        </View>

        {/* Warning */}
        <Text style={proposalStyles.warningText}>
          ABOVE PRICING IS SUBJECT TO CHANGE AT ANY TIME DUE TO THE CONTINUED ESCALATION OF RAW MATERIAL AND TRANSPORTATION COSTS. ABOVE PRICES EXCLUDE TAX.
        </Text>

        {includedTerms['equipment-sale'] && (
          <View style={[proposalStyles.table, { marginTop: 10, backgroundColor: '#FFFF00' }]}>
            <Text style={{ fontSize: 8, padding: 5, color: 'red', textAlign: 'center' }}>
              SALE ITEM PAYMENT TERMS ARE NET 14
            </Text>
          </View>
        )}

        {includedTerms['custom-terms'] && !!customTaC && (
          <View style={[proposalStyles.table, { marginTop: 10, padding: 4 }]}>
            <Text style={{ fontSize: 11 }}>{customTaC}</Text>
          </View>
        )}

        {/* Subtotal & Totals */}
        <View style={{ backgroundColor: '#e4e4e4', padding: 12, marginTop: 15}}>
          <View style={{justifyContent: 'space-between', flexDirection: 'row'}}>
            <Text style={{ fontWeight: 'bold'}}>Sub Total</Text>
            <Text>{formatMoney(total)}</Text>
          </View>
          <View style={{justifyContent: 'space-between', flexDirection: 'row', marginTop: 10}}>
            <Text style={{ fontWeight: 'bold'}}>Miscellaneous</Text>
            <Text>{formatMoney(0)}</Text>
          </View>
          <View style={{justifyContent: 'space-between', flexDirection: 'row'}}>
            <Text style={{ fontWeight: 'bold'}}>Estimated Sales Tax</Text>
            <Text>{formatMoney(0)}</Text>
          </View>
          <View style={{justifyContent: 'space-between', flexDirection: 'row'}}>
            <Text style={{ fontWeight: 'bold'}}>Total</Text>
            <Text style={{ fontWeight: 'bold'}}>{formatMoney(total)}</Text>
          </View>
        </View>

        {/* Firma */}
        <View style={{ marginTop: 20, marginHorizontal: 30 }}>
          <Text style={{ fontSize: 10, textAlign: 'center', color: '#000080' }}>
            IF THE PROPOSAL IS ACCEPTED, PLEASE SIGN AND DATE BELOW AND RETURN. THANK YOU!,
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 10 }}>ACCEPTED BY:________________________________</Text>
            <Text style={{ fontSize: 10 }}>DATE:_______________</Text>
          </View>
        </View>

        {/* Terms */}
        {includedTerms['standard-terms'] && (<><StandardConditions /><StandardExclusions /></>)}
        {includedTerms['rental-agreements'] && <StandardRentalEquipmentAgreement />}
        {includedTerms['flagging-terms'] && <StandardFlaggingTermsConditions />}
      </Page>
    </Document>
  );
};
