import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { AdminData } from '@/types/TAdminData';
import { QuoteItem } from '@/types/IQuoteItem';
import { PaymentTerms } from '../../../components/pages/quote-form/QuoteAdminInformation';
import { TermsNames } from '@/app/quotes/create/QuoteFormProvider';
import { User } from '@/types/User';
import { Customer } from '@/types/Customer';
import { INote } from '@/types/TEstimate';
import { ToProjectQuote, EstimateBidQuote, StraightSaleQuote } from '@/app/quotes/create/types';

interface Props {
  adminData: AdminData;
  items: QuoteItem[];
  customers: Customer[];
  sender: User;
  quoteDate: Date;
  quoteNumber: string;
  paymentTerms: PaymentTerms;
  includedTerms: Record<TermsNames, boolean>;
  customTaC?: string;
  county: string;
  sr: string;
  ecms: string;
  pointOfContact: { name: string; email: string };
  notes: INote[];
  quoteType: 'straight_sale' | 'to_project' | 'estimate_bid';
  quoteData: Partial<StraightSaleQuote | ToProjectQuote | EstimateBidQuote> | null;
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderColor: '#000', paddingBottom: 8 },
  logo: { width: 80, height: 40 },
  headerCenter: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  centerText: { textAlign: 'center' },
  table: { display: 'flex', width: '100%', borderWidth: 1, borderColor: '#000', marginTop: 12, flexDirection: 'column' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  tableCell: { flex: 1, padding: 4, fontSize: 9, textAlign: 'center' },
  tableHeader: { fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#000' },
  notesSection: { marginTop: 12, flexDirection: 'row' },
  noteItem: { marginBottom: 4 },
  disclaimerText: { marginVertical: 12, fontSize: 9, textAlign: 'center', fontWeight: 'bold', width: '75%', alignSelf: 'center' },
  signatureBox: { marginTop: 8, backgroundColor: '#FEF08A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 4, fontSize: 8, fontWeight: 'medium' },
  signatureField: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: 8 },
  signatureLabel: { marginRight: 4, fontSize: 9 },
  signatureLine: { flex: 1, borderBottomWidth: 1, borderColor: '#000', minWidth: 150 },
});

export const BidProposalReactPDF: React.FC<Props> = ({
  adminData,
  items,
  customers,
  quoteDate,
  quoteNumber,
  pointOfContact,
  sender,
  includedTerms,
  customTaC,
  county,
  sr,
  ecms,
  notes,
  quoteType,
  quoteData
}) => {
  const customer = customers?.[0] ?? { name: '', address: '', mainPhone: '' };

  const formatMoney = (v: number) =>
    v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const calculateExtendedPrice = (item: QuoteItem) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const compositeTotalPerUnit = item.associatedItems?.reduce(
      (sum, c) => sum + ((c.quantity || 0) * (c.unitPrice || 0)),
      0
    ) || 0;
    const base = quantity * (unitPrice + compositeTotalPerUnit);
    const discount = item.discount || 0;
    const discountAmount = item.discountType === 'dollar' ? discount : (base * discount) / 100;
    return base - discountAmount;
  };

  const total = items.reduce((acc, item) => acc + calculateExtendedPrice(item), 0);

  const renderCustomerInfo = () => {
    if (!quoteData) return null;

    switch (quoteType) {
      case "estimate_bid": {
        const data = quoteData as Partial<EstimateBidQuote>;
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: "#000", marginTop: 8, fontSize: 10 }}>
            {/* Customer Info */}
            <View style={{ width: "50%", borderRightWidth: 1, borderBottomWidth: 1, padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Customer Information</Text>
              <Text>Customer: {data.customer_name || ""}</Text>
              <Text>Contact: {data.customer_contact?.name || ""}</Text>
              <Text>Email: {data.customer_email || ""}</Text>
              <Text>Phone: {data.customer_phone || ""}</Text>
              <Text>Address: {data.customer_address || ""}</Text>
              <Text>Job #: {data.customer_job_number || ""}</Text>
            </View>

            {/* Job Info */}
            <View style={{ width: "50%", borderBottomWidth: 1, padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Job Location / Details</Text>
              <Text>Township: {data.township || ""}</Text>
              <Text>County: {data.county || ""}</Text>
              <Text>S.R./Route: {data.sr_route || ""}</Text>
              <Text>Job Address: {data.job_address || ""}</Text>
              <Text>ECMS #: {data.ecsm_contract_number || ""}</Text>
            </View>

            {/* ETC */}
            <View style={{ width: "50%", padding: 4, borderRight:1, borderColor:'black' }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>ETC Information</Text>
              <Text>ETC Point Of Contact: {data.etc_point_of_contact || ""}</Text>
              <Text>ETC Email: {data.etc_poc_email || ""}</Text>
              <Text>ETC Phone: {data.etc_poc_phone_number || ""}</Text>
              <Text>ETC Branch: {data.etc_branch || ""}</Text>
            </View>

            {/* Additional */}
            <View style={{ width: "50%", padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Additional Project Details</Text>
              <Text>Bid Date: {data.bid_date || ""}</Text>
              <Text>Start Date: {data.start_date || ""}</Text>
              <Text>End Date: {data.end_date || ""}</Text>
              <Text>Duration: {data.duration || ""}</Text>
            </View>
          </View>
        );
      }

      case "to_project": {
        const data = quoteData as Partial<ToProjectQuote>;

        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: "#000", marginTop: 8, fontSize: 10 }}>
            {/* Customer Info */}
            <View style={{ width: "50%", borderRightWidth: 1, borderBottomWidth: 1, padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Customer Information</Text>
              <Text>Customer: {data.customer_name || ""}</Text>
              <Text>Contact: {data.customer_contact?.name || ""}</Text>
              <Text>Email: {data.customer_email || ""}</Text>
              <Text>Phone: {data.customer_phone || ""}</Text>
              <Text>Address: {data.customer_address || ""}</Text>
              <Text>Job #: {data.customer_job_number || ""}</Text>
            </View>

            {/* Job Info */}
            <View style={{ width: "50%", borderBottomWidth: 1, padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Job Location / Details</Text>
              <Text>Township: {data.township || ""}</Text>
              <Text>County: {data.county || ""}</Text>
              <Text>S.R./Route: {data.sr_route || ""}</Text>
              <Text>Job Address: {data.job_address || ""}</Text>
              <Text>ECMS #: {data.ecsm_contract_number || ""}</Text>
            </View>

            {/* ETC */}
            <View style={{ width: "50%", padding: 4, borderRight:1, borderColor:'black' }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>ETC Information</Text>
              <Text>ETC Point Of Contact: {data.etc_point_of_contact || ""}</Text>
              <Text>ETC Email: {data.etc_poc_email || ""}</Text>
              <Text>ETC Phone: {data.etc_poc_phone_number || ""}</Text>
              <Text>ETC Branch: {data.etc_branch || ""}</Text>
            </View>

            {/* Additional */}
            <View style={{ width: "50%", padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Additional Project Details</Text>
              <Text>Bid Date: {data.bid_date || ""}</Text>
              <Text>Start Date: {data.start_date || ""}</Text>
              <Text>End Date: {data.end_date || ""}</Text>
              <Text>Duration: {data.duration || ""}</Text>
            </View>
          </View>
        )
      }

      case "straight_sale":
      default: {
        const data = quoteData as Partial<StraightSaleQuote>;
        return (
          <View style={{ flexDirection: "row", borderWidth: 1, borderColor: "#000", marginTop: 8, fontSize: 10 }}>
            <View style={{ width: "50%", borderRightWidth: 1, padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Customer Information</Text>
              <Text>Customer: {data.customer_name || ""}</Text>
              <Text>Contact: {data.customer_contact?.name || ""}</Text>
              <Text>Email: {data.customer_email || ""}</Text>
              <Text>Phone: {data.customer_phone || ""}</Text>
              <Text>Address: {data.customer_address || ""}</Text>
              <Text>Job #: {data.customer_job_number || ""}</Text>
              <Text>Purchase Order #: {data.purchase_order || ""}</Text>
            </View>
            <View style={{ width: "50%", padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>ETC Information</Text>
              <Text>ETC Point Of Contact: {data.etc_point_of_contact || ""}</Text>
              <Text>ETC Email: {data.etc_poc_email || ""}</Text>
              <Text>ETC Phone: {data.etc_poc_phone_number || ""}</Text>
              <Text>ETC Branch: {data.etc_branch || ""}</Text>
            </View>
          </View>
        );
      }
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src="/logo.jpg" style={styles.logo} />
          <View style={styles.headerCenter}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Established Traffic Control, Inc.</Text>
            <Text style={styles.centerText}>3162 Unionville Pike</Text>
            <Text style={styles.centerText}>Hatfield, PA 19440</Text>
            <Text style={styles.centerText}>O: 215.997.8801 | F: 215.997.8868</Text>
            <Text style={styles.centerText}>Email: {sender.email}</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>PROPOSAL</Text>
            <Text style={styles.centerText}>Quote Date: {quoteDate.toLocaleDateString('en-US')}</Text>
            <Text style={{ fontSize: 12 }}>THIS IS NOT A BILL/INVOICE DO NOT PAY</Text>
          </View>
        </View>

        {/* Customer Info */}
        {renderCustomerInfo()}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {['Row', 'Item #', 'Description', 'Qty/Units', 'Unit Price', 'Extended'].map((h, i) => (
              <Text key={i} style={[styles.tableCell, styles.tableHeader]}>{h}</Text>
            ))}
          </View>

          {items.map((item, idx) => {
            const ext = calculateExtendedPrice(item);
            return (
              <View key={idx}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>{idx + 1}</Text>
                  <Text style={styles.tableCell}>{item.itemNumber || idx + 1}</Text>
                  <Text style={styles.tableCell}>
                    {item.description}
                    {item.notes && `\n${item.notes}`}
                  </Text>
                  <Text style={styles.tableCell}>{item.quantity} {item.uom || 'EA'}</Text>
                  <Text style={styles.tableCell}>{formatMoney(item.unitPrice || 0)}</Text>
                  <Text style={styles.tableCell}>{formatMoney(ext)}</Text>
                </View>
                {item.associatedItems?.map((assoc, aIdx) => (
                  <View key={`assoc-${idx}-${aIdx}`} style={[styles.tableRow, { backgroundColor: '#F3F3F3' }]}>
                    <Text style={styles.tableCell}></Text>
                    <Text style={styles.tableCell}>- {assoc.description}</Text>
                    <Text style={styles.tableCell}>{assoc.quantity}</Text>
                    <Text style={styles.tableCell}>{formatMoney(assoc.unitPrice || 0)}</Text>
                    <Text style={styles.tableCell}></Text>
                    <Text style={styles.tableCell}></Text>
                  </View>
                ))}
              </View>
            );
          })}

          {/* Totals */}
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}></Text>
            <Text style={styles.tableCell}></Text>
            <Text style={styles.tableCell}></Text>
            <Text style={styles.tableCell}></Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>SUBTOTAL</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{formatMoney(total)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}></Text>
            <Text style={styles.tableCell}></Text>
            <Text style={styles.tableCell}></Text>
            <Text style={styles.tableCell}></Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>TOTAL</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{formatMoney(total)}</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimerText}>
          Sales tax not included in price. Please add 3% to total if paying by MC or VISA, 4% for AMEX.{"\n"}
          Due to extreme market volatility, all pricing and availability are subject to change without notice.{"\n"}
          All quotes to be confirmed at time of order placement.
        </Text>

        {/* Signature */}
        <View style={styles.signatureBox}>
          <View style={styles.signatureField}>
            <Text style={styles.signatureLabel}>X</Text>
            <View style={styles.signatureLine}></View>
          </View>
          <View style={styles.signatureField}>
            <Text style={styles.signatureLabel}>Date</Text>
            <View style={styles.signatureLine}></View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={{ fontWeight: 'bold' }}>Notes:</Text>
          <View style={{ flex: 1, marginLeft: 8 }}>
            {notes.length > 0 ? notes.map((nt, i) => (
              <View key={i} style={styles.noteItem}>
                <Text>{nt.text}</Text>
                <Text style={{ fontSize: 8, color: 'gray' }}>
                  {new Date(nt.timestamp).toLocaleString()} by {nt.user_email ?? ''}
                </Text>
              </View>
            )) : <Text>No notes available</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
};
