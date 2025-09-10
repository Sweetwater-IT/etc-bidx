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
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },

  // Header
  header: {
    width:'100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderColor: '#000',
    paddingBottom: 8,
  },
  logo: { width: 80, height: 40 },
  headerCenter: { textAlign: 'center', display:'flex', flexDirection:'column', alignItems:'center' },
  centerText: {textAlign: 'center'},
  // Grid section
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 8,
  },
  gridCell: {
    width: '50%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    padding: 4,
  },

  // Table
  table: {
    display: 'flex',
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 12,
    flexDirection: 'column',
  },
  tableRow: {
    flexDirection: 'row',
    borderColor: '#000',
  },
  tableCell: {
    flex: 1,
    padding: 4,
    fontSize: 9,
    textAlign: 'center',
  },
  lastCell: { borderRightWidth: 0 },
  tableHeader: { fontWeight: 'bold', borderBottom: 1, borderBottomColor: 'black' },

  // Notes
  notesSection: { marginTop: 12, flexDirection: 'row' },
  noteItem: { marginBottom: 4 },

  // Rental Rates
  rentalSection: {
    marginTop: 12,
    fontSize: 9,
  },
  rentalTitle: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  rentalTable: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#000',
  },
  rentalRow: {
    flexDirection: 'row',
  },
  rentalCell: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
  },
  rentalCellLastCol: {
    borderRightWidth: 0,
  },
  rentalHeader: {
    fontWeight: 'bold',
  },
  rentalCellTextCenter: {
    textAlign: 'center',
  },
  rentalCellTextLeft: {
    textAlign: 'left',
  },

  // Signature
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginHorizontal: 32,
  },

  footerText: {
    marginTop: 12,
    fontSize: 8,
    textAlign: 'center',
  },
  disclaimerText: {
    marginVertical: 12,
    fontSize: 9,
    textAlign: 'center',
    fontWeight: 'bold',
    width: '75%',
    alignSelf: 'center',
  },
  signatureBox: {
    marginTop: 8,
    backgroundColor: '#FEF08A', // amarillo suave
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 4,
    fontSize: 8,
    fontWeight: 'medium',
  },
  signatureField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 8,
  },
  signatureLabel: {
    marginRight: 4,
    fontSize: 9,
  },
  signatureLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    minWidth: 150,
  },
  signatureLineText: {
    fontSize: 8,
    fontStyle: 'italic',
    marginLeft: 2,
  },
});

export const BidProposalReactPDF = ({
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
}: Props) => {
  const customer = customers?.[0] ?? { name: '', address: '', mainPhone: '' };

  const formatMoney = (v: number) =>
    v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const calculateExtendedPrice = (item: QuoteItem) => {
    const q = item.quantity || 0;
    const up = item.unitPrice || 0;
    const composite = item.associatedItems?.reduce(
      (sum, c) => sum + (c.quantity || 0) * (c.unitPrice || 0),
      0
    ) || 0;
    const base = q * (up + composite);
    const discount = item.discount || 0;
    const discAmt =
      item.discountType === 'dollar' ? discount : (base * discount) / 100;
    return base - discAmt;
  };

  const total = items.reduce((acc, it) => acc + calculateExtendedPrice(it), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src="/logo.jpg" style={styles.logo} />
          <View style={styles.headerCenter}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
              Established Traffic Control, Inc.
            </Text>
            <Text style={styles.centerText}>3162 Unionville Pike</Text>
            <Text style={styles.centerText}>Hatfield, PA 19440</Text>
            <Text style={styles.centerText}>O: 215.997.8801 | F: 215.997.8868</Text>
            <Text style={styles.centerText}>Email: {sender.email}</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign:'center' }}>PROPOSAL</Text>
            <Text style={styles.centerText}>{quoteDate.toLocaleDateString('en-US')}</Text>
            <Text style={styles.centerText}>ETC Contact: {sender.name}</Text>
          </View>
        </View>

        {/* GRID INFO */}
        <View style={styles.sectionGrid}>
          <View style={styles.gridCell}>
            <Text>TO: {customer.name}</Text>
            <Text>Address: {customer.address}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text>ETC Job #: {quoteNumber}</Text>
            <Text>Contact: {pointOfContact.name}</Text>
            <Text>Phone: {customer.mainPhone}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text>Township: {adminData.location}</Text>
            <Text>County: {county}</Text>
            <Text>S.R./Route: {sr}</Text>
            <Text>Project: {ecms}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text>Bid Date: {quoteDate.toLocaleDateString('en-US')}</Text>
            <Text>MPT Start Date: __________</Text>
            <Text>MPT Completion Date: __________</Text>
            <Text>MPT Days: __________</Text>
          </View>
        </View>

        {/* ITEMS TABLE */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {['Item #', 'Description', 'Qty/Units', 'Unit Price', 'Extended'].map(
              (h, i) => (
                <Text
                  key={i}
                  style={[styles.tableCell, styles.tableHeader]}
                >
                  {h}
                </Text>
              )
            )}
          </View>
          {items.map((item, idx) => {
            const ext = calculateExtendedPrice(item);
            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>
                  {item.itemNumber || idx + 1}
                </Text>
                <Text style={styles.tableCell}>
                  {item.description}
                  {item.notes && <Text>{'\n'}{item.notes}</Text>}
                </Text>
                <Text style={styles.tableCell}>
                  {item.quantity} {item.uom || 'EA'}
                </Text>
                <Text style={styles.tableCell}>
                  {formatMoney(item.unitPrice || 0)}
                </Text>
                <Text style={[styles.tableCell, styles.lastCell]}>
                  {formatMoney(ext)}
                </Text>
              </View>
            );
          })}
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}></Text>
            <Text style={styles.tableCell}></Text>
            <Text style={styles.tableCell}></Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
              TOTAL
            </Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
              {formatMoney(total)}
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimerText}>
          Sales tax not included in price. Please add 3% to total if paying by MC or VISA, 4% for AMEX.{"\n"}
          Due to extreme market volatility, all pricing and availability are subject to change without notice.{"\n"}
          All quotes to be confirmed at time of order placement.
        </Text>

        {/* SIGNATURE BOX */}
        <View style={styles.signatureBox}>
          <View style={styles.signatureField}>
            <Text style={styles.signatureLabel}>X</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLineText}></Text>
            </View>
          </View>
          <View style={styles.signatureField}>
            <Text style={styles.signatureLabel}>Date</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLineText}></Text>
            </View>
          </View>
        </View>

        {/* NOTES */}
        <View style={styles.notesSection}>
          <Text style={{ fontWeight: 'bold' }}>Notes:</Text>
          <View style={{ flex: 1, marginLeft: 8 }}>
            {notes.length > 0 ? (
              notes.map((nt, i) => (
                <View key={i} style={styles.noteItem}>
                  <Text>{nt.text}</Text>
                  <Text style={{ fontSize: 8, color: 'gray' }}>
                    {new Date(nt.timestamp).toLocaleString()} by {nt.user_email ?? ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text>No notes available</Text>
            )}
          </View>
        </View>
        {/* SIGNATURE */}
        <Text
          style={{
            marginTop: 12,
            fontSize: 9,
            textAlign: 'center',
            color: 'blue',
          }}
        >
          If the proposal is accepted, please sign and date below and return.
          Thank you!
        </Text>
        <View style={styles.signatureRow}>
          <Text>ACCEPTED BY: ____________________</Text>
          <Text>DATE: _______________</Text>
        </View>
      </Page>
    </Document>
  );
};
