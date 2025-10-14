import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { QuoteItem } from '@/types/IQuoteItem';
import { Customer } from '@/types/Customer';
import { ToProjectQuote, EstimateBidQuote, StraightSaleQuote } from '@/app/quotes/create/types';

interface Props {
  items: QuoteItem[];
  quoteDate: Date;
  notes: string | undefined;
  quoteType: 'straight_sale' | 'to_project' | 'estimate_bid';
  quoteData: Partial<StraightSaleQuote | ToProjectQuote | EstimateBidQuote> | null;
  termsAndConditions?: boolean;
  exclusions?: string;
  terms: string;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 24,
    fontSize: 9,
    fontFamily: 'Helvetica',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  endPage: {
    flex: 0.06,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentPage: {
    flex: 0.94
  },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderColor: '#000', paddingBottom: 8 },
  header1: { width: '25%', flexDirection: 'column', alignItems: 'center' },
  header2: { width: '50%', flexDirection: 'column', alignItems: 'center' },
  header3: { width: '25%', flexDirection: 'column', alignItems: 'center' },
  logo: { width: '98px', height: '58px', marginBottom: '4px' },
  headerCenter: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  centerText: { textAlign: 'center', fontSize: '10px', marginBottom: 2 },
  table: { display: 'flex', width: '100%', borderWidth: 1, borderColor: '#000', marginTop: 12, flexDirection: 'column' },
  tableRow: { flexDirection: 'row', width: '100%' },
  tableRowWithBorder: { flexDirection: 'row', width: '100%', borderBottomWidth: 1, borderColor: '#000', paddingTop: 2, paddingBottom: 2 },
  lineSeparator: { borderBottomWidth: 1, borderColor: '#000' },
  tableCell: { padding: 4, fontSize: 9, textAlign: 'center' },
  tableHeader: { fontWeight: 'bold', },
  notesSection: { marginTop: 12, flexDirection: 'column', flex: 1, width: '100%' },
  noteItem: { marginBottom: 4 },
  disclaimerText: {
    flex: 1,
    fontSize: 7,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 12,
    lineHeight: 1.2,
    color: '#555',
  },
  signatureBox: { width: '100%', marginTop: 8, backgroundColor: '#FEF08A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 4, fontSize: 8, fontWeight: 'medium' },
  signatureField: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: 8 },
  signatureLabel: { marginRight: 4, fontSize: 9 },
  signatureLine: { flex: 1, borderBottomWidth: 1, borderColor: '#000', minWidth: 150 },
  cellRow: { width: '6%', textAlign: 'center' },
  cellItem: { width: '18%', textAlign: 'center' },
  cellDescription: { width: '36%', textAlign: 'center', paddingRight: 4 },
  cellUOM: { width: '10%', textAlign: 'center' },
  cellQuantity: { width: '10%', textAlign: 'center' },
  cellUnitPrice: { width: '10%', textAlign: 'right' },
  cellExtended: { width: '10%', textAlign: 'right' },
});

const SignatureLine: React.FC = () => (
  <View style={{ marginTop: 8, width: '100%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', fontSize: 10 }}>
    <View style={{ backgroundColor: 'rgba(253, 224, 71, 0.7)', padding: 4, flexDirection: 'row', alignItems: 'center' }}>
      <Text>Initials</Text>
      <View style={{ borderBottomWidth: 1, borderColor: '#000', minWidth: 150, marginLeft: 8 }}>
        <Text style={{ fontStyle: 'italic', fontSize: 11 }}></Text>
      </View>
    </View>
  </View>
);

const formatDate = (date?: string) => {
  if (!date) return "";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US");
};

export const BidProposalReactPDF: React.FC<Props> = ({
  items,
  quoteDate,
  notes,
  quoteType,
  quoteData,
  termsAndConditions,
  exclusions,
  terms

}) => {

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

  const joinWithSlash = (...values: (string | undefined | null)[]) => {
    return values.filter(Boolean).join(" / ");
  };

  const safeFormatDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
  };


  const totalTax = items.reduce((acc, item) => {
    if (!item.is_tax_percentage) return acc;

    const extended = Number(calculateExtendedPrice(item)) || 0;
    const taxRate = Number(item.tax) || 0;
    const itemTax = extended * (taxRate / 100);

    return acc + itemTax;
  }, 0);

  const renderCustomerInfo = () => {
    if (!quoteData) return null;

    switch (quoteType) {
      case "estimate_bid": {
        const data = quoteData as Partial<EstimateBidQuote>;
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: "#000", marginTop: 8, fontSize: 9 }}>
            {/* Customer Info */}
            <View style={{ width: "50%", borderRightWidth: 1, borderBottomWidth: 1, padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Customer Information</Text>
              <Text>Customer: {joinWithSlash(data.customer_name, data.customer_address)}</Text>
              <Text>Customer Contact: {joinWithSlash(data.customer_contact, data.customer_email, data.customer_phone)}</Text>
            </View>

            {/* Point of Contact */}
            <View style={{ width: "50%", padding: 4, borderBottomWidth: 1 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>ETC Information</Text>
              <Text>Point of Contact: {joinWithSlash(data.etc_point_of_contact, data.etc_poc_email, data.etc_poc_phone_number)}</Text>
              <Text>Branch: {data.etc_branch || ""}</Text>
            </View>

            {/* Job Info */}
            <View style={{ width: "50%", padding: 4, borderRightWidth: 1, borderColor: 'black' }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Job Location / Details</Text>
              <Text>Township / County: {joinWithSlash(data.township, data.county)}</Text>
              <Text>State Route: {data.sr_route || ""}</Text>
              <Text>Job Address: {data.job_address || ""}</Text>
              <Text>ECMS / Contract Number: {data.ecsm_contract_number || ""}</Text>
            </View>

            {/* Additional */}
            <View style={{ width: "50%", padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Additional Project Details</Text>
              <Text>Bid Date: {safeFormatDate(data.bid_date)}</Text>
              <Text>Start Date: {safeFormatDate(data.start_date)}</Text>
              <Text>End Date: {safeFormatDate(data.end_date)}</Text>
              <Text>Duration (Days): {data.duration || ""}</Text>
            </View>
          </View>
        );
      }

      case "to_project": {
        const data = quoteData as Partial<ToProjectQuote>;
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: "#000", marginTop: 8, fontSize: 9 }}>
            {/* Customer Info */}
            <View style={{ width: "50%", borderRightWidth: 1, borderBottomWidth: 1, padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Customer Information</Text>
              <Text>Customer: {joinWithSlash(data.customer_name, data.customer_address)}</Text>
              <Text>Customer Contact: {joinWithSlash(data.customer_contact, data.customer_email, data.customer_phone)}</Text>
              <Text>Customer Job #: {data.customer_job_number || ""}</Text>
              <Text>Purchase Order #: {data.purchase_order || ""}</Text>
            </View>

            {/* Point of Contact */}
            <View style={{ width: "50%", padding: 4, borderBottomWidth: 1 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>ETC Information</Text>
              <Text>Point of Contact: {joinWithSlash(data.etc_point_of_contact, data.etc_poc_email, data.etc_poc_phone_number)}</Text>
              <Text>Branch: {data.etc_branch || ""}</Text>
              <Text>ETC Job Number: {data.etc_job_number || ""}</Text>
            </View>

            {/* Job Info */}
            <View style={{ width: "50%", padding: 4, borderRightWidth: 1, borderColor: 'black' }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Job Location / Details</Text>
              <Text>Township/County: {joinWithSlash(data.township, data.county)}</Text>
              <Text>State Route: {data.sr_route || ""}</Text>
              <Text>Job Address: {data.job_address || ""}</Text>
              <Text>ECMS / Contract Number: {data.ecsm_contract_number || ""}</Text>
            </View>

            {/* Additional */}
            <View style={{ width: "50%", padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Additional Project Details</Text>
              <Text>Bid Date: {safeFormatDate(data.bid_date)}</Text>
              <Text>Start Date: {safeFormatDate(data.start_date)}</Text>
              <Text>End Date: {safeFormatDate(data.end_date)}</Text>
              <Text>Duration (Days): {data.duration || ""}</Text>
            </View>
          </View>
        );
      }

      case "straight_sale":
      default: {
        const data = quoteData as Partial<StraightSaleQuote>;
        return (
          <View style={{ flexDirection: "row", borderWidth: 1, borderColor: "#000", marginTop: 8, fontSize: 9 }}>
            {/* Customer Info */}
            <View style={{ width: "50%", borderRightWidth: 1, borderBottomWidth: 1, padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Customer Information</Text>
              <Text>Customer: {joinWithSlash(data.customer_name, data.customer_address)}</Text>
              <Text>Customer Contact: {joinWithSlash(data.customer_contact, data.customer_email, data.customer_phone)}</Text>
              <Text>Purchase Order #: {data.purchase_order || ""}</Text>
            </View>

            {/* Point of Contact */}
            <View style={{ width: "50%", padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>ETC Information</Text>
              <Text>Point of Contact: {joinWithSlash(data.etc_point_of_contact, data.etc_poc_email, data.etc_poc_phone_number)}</Text>
              <Text>Branch: {data.etc_branch || ""}</Text>
            </View>
          </View>
        );
      }
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.header1}>
              <Image src="/logo.jpg" style={styles.logo} />
              <Text style={{ color: 'blue' }}>www.establishedtraffic.com</Text>
            </View>
            <View style={styles.header2}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>Established Traffic Control, Inc.</Text>
              <Text style={styles.centerText}>3162 Unionville Pike</Text>
              <Text style={styles.centerText}>Hatfield, PA 19440</Text>
              <Text style={styles.centerText}>O: 215.997.8801</Text>
              <Text style={[styles.centerText]}>Email:
                <Text style={{ color: 'blue' }}>
                  estimating@establishedtraffic.com</Text>
              </Text>
            </View>
            <View style={styles.header3}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{quoteData?.status === "Accepted" ? "Sale Ticket" : "Proposal"}</Text>
              <Text style={styles.centerText}>Quote Date: {quoteDate.toLocaleDateString('en-US')}</Text>
              <Text style={styles.centerText}>
                Quote Expiration: {new Date(quoteDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US')}
              </Text>
              <Text style={[styles.centerText]}>THIS IS NOT A BILL/INVOICE DO NOT PAY</Text>
            </View>
          </View>

          {/* Customer Info */}
          {renderCustomerInfo()}

          {/* Items Table */}
          <View style={styles.table}>
            <View style={styles.tableRowWithBorder}>
              <Text style={[styles.tableHeader, styles.cellRow]}>Row</Text>
              <Text style={[styles.tableHeader, styles.cellItem]}>Item #</Text>
              <Text style={[styles.tableHeader, styles.cellDescription]}>Description</Text>
              <Text style={[styles.tableHeader, styles.cellUOM]}>UOM</Text>
              <Text style={[styles.tableHeader, styles.cellQuantity]}>Qty</Text>
              <Text style={[styles.tableHeader, styles.cellUnitPrice]}>Unit Price</Text>
              <Text style={[styles.tableHeader, styles.cellExtended]}>Ext. Price</Text>
            </View>

            {items.map((item, idx) => {
              const ext = calculateExtendedPrice(item);
              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.cellRow]}>{idx + 1}</Text>
                  <Text style={[styles.tableCell, styles.cellItem]}>{item.itemNumber || idx + 1}</Text>
                  <Text style={[styles.tableCell, styles.cellDescription]}>{item.description}</Text>
                  <Text style={[styles.tableCell, styles.cellUOM]}>{item.uom || 'EA'}</Text>
                  <Text style={[styles.tableCell, styles.cellQuantity]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, styles.cellUnitPrice]}>{formatMoney(item.unitPrice || 0)}</Text>
                  <Text style={[styles.tableCell, styles.cellExtended]}>{formatMoney(ext)}</Text>
                </View>
              );
            })}
            <View style={styles.lineSeparator}></View>
            {/* Totals */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, styles.cellRow]}></Text>
              <Text style={[styles.tableHeader, styles.cellItem]}></Text>
              <Text style={[styles.tableHeader, styles.cellDescription]}></Text>
              <Text style={[styles.tableHeader, styles.cellUOM]}></Text>
              <Text style={[styles.tableHeader, styles.cellQuantity]}></Text>
              <View style={[styles.tableCell, styles.cellUnitPrice, { justifyContent: 'center' }]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>SUBTOTAL</Text>
              </View>
              <View style={[styles.tableCell, styles.cellExtended, { justifyContent: 'center' }]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'right' }}>{formatMoney(total)}</Text>
              </View>

            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, styles.cellRow]}></Text>
              <Text style={[styles.tableHeader, styles.cellItem]}></Text>
              <Text style={[styles.tableHeader, styles.cellDescription]}></Text>
              <Text style={[styles.tableHeader, styles.cellUOM]}></Text>
              <Text style={[styles.tableHeader, styles.cellQuantity]}></Text>
              <View style={[styles.tableCell, styles.cellUnitPrice, { justifyContent: 'center' }]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>TAX</Text>
              </View>
              <View style={[styles.tableCell, styles.cellExtended, { justifyContent: 'center' }]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'right' }}>{formatMoney(totalTax)}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, styles.cellRow]}></Text>
              <Text style={[styles.tableHeader, styles.cellItem]}></Text>
              <Text style={[styles.tableHeader, styles.cellDescription]}></Text>
              <Text style={[styles.tableHeader, styles.cellUOM]}></Text>
              <Text style={[styles.tableHeader, styles.cellQuantity]}></Text>
              <View style={[styles.tableCell, styles.cellUnitPrice, { justifyContent: 'center' }]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>TOTAL</Text>
              </View>
              <View style={[styles.tableCell, styles.cellExtended, { justifyContent: 'center' }]}>
                <Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'right' }}>{formatMoney(total + totalTax)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.notesSection}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Notes:</Text>
            <View style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
              {notes?.split('\n').map((line, index) => (
                <Text key={index}>
                  {line}
                </Text>
              ))}
              <View style={{marginBottom: 6}}/>
              {items.map((i, idx) =>
                i.notes ? (
                  <Text key={idx}>{i.itemNumber + ' - '} <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>{i.description}</Text> {' - ' + i.notes}</Text>
                ) : null
              )}
            </View>
          </View>
        </View>

        <View style={styles.endPage}>
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
          <Text style={styles.disclaimerText}>
            Due to extreme market volatility, all pricing and availability are subject to change without notice.{"\n"}
            All quotes to be confirmed at time of order placement.
          </Text>
        </View>

      </Page>
      {(termsAndConditions) && (
        <Page size="A4" style={styles.page}>
          <View style={{ flex: 1, width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: '25px' }}>

            (
            <View style={{ fontSize: 9, width: '100%' }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>EXCLUSIONS</Text>
              <Text >{exclusions}</Text>
            </View>
            )

            {
              <View style={{ fontSize: 9, marginTop: '25px' }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>STANDARD CONDITIONS</Text>
                <Text >{terms}</Text>
              </View>
            }
          </View>
          <SignatureLine />
        </Page>
      )}
    </Document>
  );
};
