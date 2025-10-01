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
  notes: string | undefined;
  quoteType: 'straight_sale' | 'to_project' | 'estimate_bid';
  quoteData: Partial<StraightSaleQuote | ToProjectQuote | EstimateBidQuote> | null;
  termsAndConditions?: boolean;
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
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
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
  cellRow: {
    width: '6%',
    textAlign: 'center',
  },
  cellItem: {
    width: '14%',
    textAlign: 'center',
  },
  cellDescription: {
    width: '30%',
    textAlign: 'center',
    paddingRight: 4,
  },
  cellUOM: {
    width: '12.5%',
    textAlign: 'center',
  },
  cellQuantity: {
    width: '12.5%',
    textAlign: 'center',
  },
  cellUnitPrice: {
    width: '12.5%',
    textAlign: 'center',
  },
  cellExtended: {
    width: '10%',
    textAlign: 'center',
  }
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
  quoteData,
  termsAndConditions

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
              <Text>Contact: {data.customer_contact || ""}</Text>
              <Text>Email: {data.customer_email || ""}</Text>
              <Text>Phone: {data.customer_phone || ""}</Text>
              <Text>Address: {data.customer_address || ""}</Text>
            </View>

            {/* ETC */}
            <View style={{ width: "50%", padding: 4, borderBottomWidth: 1 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>ETC Information</Text>
              <Text>ETC Point Of Contact: {data.etc_point_of_contact || ""}</Text>
              <Text>ETC Email: {data.etc_poc_email || ""}</Text>
              <Text>ETC Phone: {data.etc_poc_phone_number || ""}</Text>
              <Text>ETC Branch: {data.etc_branch || ""}</Text>
            </View>

            {/* Job Info */}
            <View style={{ width: "50%", padding: 4, borderRight: 1, borderTop: 1, borderColor: 'black', }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Job Location / Details</Text>
              <Text>Township: {data.township || ""}</Text>
              <Text>County: {data.county || ""}</Text>s
              <Text>S.R./Route: {data.sr_route || ""}</Text>
              <Text>Job Address: {data.job_address || ""}</Text>
              <Text>ECMS #: {data.ecsm_contract_number || ""}</Text>
            </View>

            {/* Additional */}
            <View style={{ width: "50%", padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Additional Project Details</Text>
              <Text>Bid Date: {data.bid_date || ""}</Text>
              <Text>Start Date: {data.start_date || ""}</Text>
              <Text>End Date: {data.end_date || ""}</Text>
              <Text>{"Duration (Days):"} {data.duration || ""}</Text>
            </View>
          </View>
        );
      }

      case "to_project": {
        const data = quoteData as Partial<ToProjectQuote>;

        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: "#000", marginTop: 8, fontSize: 10 }}>
            {/* Customer Info */}
            <View style={{ width: "50%", padding: 4, borderRight: 1, borderColor: 'black' }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Customer Information</Text>
              <Text>Customer: {data.customer_name || ""}</Text>
              <Text>Contact: {data.customer_contact || ""}</Text>
              <Text>Email: {data.customer_email || ""}</Text>
              <Text>Phone: {data.customer_phone || ""}</Text>
              <Text>Address: {data.customer_address || ""}</Text>
              <Text>Customer Job #: {data.customer_job_number || ""}</Text>
            </View>

            {/* ETC */}
            <View style={{ width: "50%", padding: 4, borderBottomWidth: 1 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>ETC Information</Text>
              <Text>ETC Point Of Contact: {data.etc_point_of_contact || ""}</Text>
              <Text>ETC Email: {data.etc_poc_email || ""}</Text>
              <Text>ETC Phone: {data.etc_poc_phone_number || ""}</Text>
              <Text>ETC Branch: {data.etc_branch || ""}</Text>
              <Text>ETC Job Number: {data.etc_job_number || ""}</Text>
            </View>

            {/* Job Info */}
            <View style={{ width: "50%", padding: 4, borderRight: 1, borderTop: 1, borderColor: 'black', }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Job Location / Details</Text>
              <Text>Township: {data.township || ""}</Text>
              <Text>County: {data.county || ""}</Text>
              <Text>S.R./Route: {data.sr_route || ""}</Text>
              <Text>Job Address: {data.job_address || ""}</Text>
              <Text>ECMS #: {data.ecsm_contract_number || ""}</Text>
            </View>

            {/* Additional */}
            <View style={{ width: "50%", padding: 4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Additional Project Details</Text>
              <Text>Bid Date: {data.bid_date || ""}</Text>
              <Text>Start Date: {data.start_date || ""}</Text>
              <Text>End Date: {data.end_date || ""}</Text>
              <Text>{"Duration (Days):"} {data.duration || ""}</Text>
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
              <Text>Contact: {data.customer_contact || ""}</Text>
              <Text>Email: {data.customer_email || ""}</Text>
              <Text>Phone: {data.customer_phone || ""}</Text>
              <Text>Address: {data.customer_address || ""}</Text>
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
                  {sender.email}</Text>
              </Text>
            </View>
            <View style={styles.header3}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>Proposal</Text>
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
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, styles.cellRow]}>Row</Text>
              <Text style={[styles.tableHeader, styles.cellItem]}>Item #</Text>
              <Text style={[styles.tableHeader, styles.cellDescription]}>Description</Text>
              <Text style={[styles.tableHeader, styles.cellUOM]}>UOM</Text>
              <Text style={[styles.tableHeader, styles.cellQuantity]}>Quantity</Text>
              <Text style={[styles.tableHeader, styles.cellUnitPrice]}>Unit Price</Text>
              <Text style={[styles.tableHeader, styles.cellExtended]}>Extended</Text>
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
                <Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>{formatMoney(total)}</Text>
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
                <Text style={{ fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>{formatMoney(total)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.notesSection}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Notes:</Text>
            <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {notes}
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
      {termsAndConditions && (
        <Page size="A4" style={styles.page}>
          <View style={{ marginTop: 12, fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>STANDARD CONDITIONS</Text>

            <Text>
              --- This quote including all terms and conditions will be included In any contract between contractor and Established Traffic Control. ETC must be notified within 14 days of bid date if Contractor is utilizing our proposal.
            </Text>

            <Text>
              --- Payment for lump sum items shall be 50% paid on the 1st estimate for mobilization. The remaining balance will be prorated over the remaining pay estimates. A pro-rated charge or use of PennDOT Publication 408, Section 110.03(d) 3a will be assessed if contract exceeds the MPT completion date and/or goes over the MPT Days.
            </Text>

            <Text>
              --- This quote including all terms and conditions will be included In any contract between contractor and Established Traffic Control. ETC must be notified within 14 days of bid date if Contractor is utilizing our proposal.
            </Text>

            <Text>
              --- In the event that payment by owner to contractor is delayed due to a dispute between owner, and contractor not involving the work performed by Established Traffic Control, Inc (ETC), then payment by contractor to ETC shall not likewise be delayed.
            </Text>

            <Text>
              --- No extra work will be performed without proper written authorization. Extra work orders signed by an agent of the contractor shall provide for full payment of work within 30 days of invoice date, regardless if owner has paid contractor.
            </Text>

            <Text>
              --- All sale and rental invoices are NET 30 days. Sales tax is not included. Equipment Delivery/Pickup fee is not included.
            </Text>

            <Text>
              --- All material supplied by ETC is project specific (shall be kept on this project) and will remain our property at the project completion. The contractor is responsible for all lost/stolen or damaged materials and will be invoiced to contractor at replacement price. Payment for lost/stolen or damaged materials invoices are net 30 days regardless of payment from the owner or responsible party. Materials moved to other projects will be subject to additional invoicing.
            </Text>

            <Text>
              --- ETC will require a minimum notice of 2 weeks (4–5 weeks for permanent signing) for all project start and/or changes with approved stamped drawings or additional fees may apply. Permanent signing proposal includes an original set of shop drawings, prepared per original contract plans. Additional permanent signing shop drawing requests are $150.00/drawing.
            </Text>

            <Text>
              --- In the event that any terms in our exclusions/conditions conflict with other terms of the contract documents, the terms of our exclusions shall govern.
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
};
