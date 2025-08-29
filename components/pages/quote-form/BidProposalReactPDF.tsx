import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { AdminData } from "@/types/TAdminData";
import { QuoteItem } from "@/types/IQuoteItem";
import { PaymentTerms } from "./QuoteAdminInformation";
import { proposalStyles } from "./proposal-parts/proposalStyles";
import { StandardConditions, StandardExclusions } from "./proposal-parts/StandardTermsAndConditions";
import { StandardRentalEquipmentAgreement } from "./proposal-parts/RentalEquipmentAgreement";
import { StandardFlaggingTermsConditions } from "./proposal-parts/FlaggingTermsAndConditions";
import { TermsNames } from "@/app/quotes/create/QuoteFormProvider";
import { User } from "@/types/User";
import { Customer } from "@/types/Customer";

interface Props {
  adminData: AdminData;
  items?: QuoteItem[];
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
}

export const BidProposalReactPDF = ({
  paymentTerms,
  pointOfContact,
  quoteNumber,
  sender,
  quoteDate,
  items,
  customers,
  includedTerms,
  customTaC,
  county,
  sr,
  ecms,
}: Props) => {
  // Cliente por defecto
  const defaultCustomer: Customer = {
    id: 0,
    name: "Unknown Customer",
    displayName: "Unknown Customer",
    emails: [],
    address: "No address available",
    phones: [],
    roles: [],
    names: [],
    contactIds: [],
    url: "",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    city: "-",
    state: "-",
    zip: "-",
    customerNumber: 0,
    mainPhone: "N/A",
    paymentTerms: "N/A",
  };

  const firstCustomer: Customer =
    customers && customers.length > 0 ? customers[0] : defaultCustomer;

  // Helpers
  const safeText = (value: any): string =>
    value === null || value === undefined ? "" : String(value);

  const calculateTotal = () => {
    if (!items?.length) return 0;

    return items.reduce((acc, item) => {
      const discount = item.discount || 0;
      const discountMultiplier = (100 - discount) / 100;
      const parentItemValue = (item.quantity || 0) * (item.unitPrice || 0);
      const compositeTotal = item.associatedItems?.length
        ? item.associatedItems.reduce(
            (subSum, ci) =>
              subSum + (ci.quantity || 0) * (ci.unitPrice || 0),
            0
          )
        : 0;

      return acc + (parentItemValue + compositeTotal) * discountMultiplier;
    }, 0);
  };

  const calculateExtendedPrice = (item: QuoteItem) => {
    const discount = item.discount || 0;
    const discountMultiplier = (100 - discount) / 100;
    const parentItemValue = (item.quantity || 0) * (item.unitPrice || 0);
    const compositeTotal = item.associatedItems?.length
      ? item.associatedItems.reduce(
          (subSum, ci) =>
            subSum + (ci.quantity || 0) * (ci.unitPrice || 0),
          0
        )
      : 0;

    return (
      (parentItemValue + compositeTotal) *
      discountMultiplier
    ).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const total = calculateTotal();

  // Render
  return (
    <Document title={`Quote-${safeText(quoteNumber)}`}>
      <Page size="A4" style={proposalStyles.page}>
        {/* Footer */}
        <Text
          fixed
          style={{ position: "absolute", bottom: 10, right: 30, fontSize: 10 }}
          render={({ pageNumber, totalPages }) =>
            `Initials: ________ Page ${pageNumber} of ${totalPages}`
          }
        />

        {/* Continuation Header */}
        <View
          fixed
          style={{
            position: "absolute",
            top: 10,
            left: 30,
            fontSize: 13,
            fontWeight: "bold",
          }}
          render={({ pageNumber }) =>
            pageNumber > 1 ? (
              <Text>
                Quote For:{" "}
                {customers.length > 1
                  ? "Estimating"
                  : safeText(firstCustomer.name)}{" "}
                - Quote ID: {safeText(quoteNumber)} cont.
              </Text>
            ) : null
          }
        />

        {/* Company Info */}
        <View style={proposalStyles.companyInfoContainer}>
          <View
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "row",
              gap: 6,
            }}
          >
            <Image style={proposalStyles.img} src="/logo.jpg" />
            <Text style={proposalStyles.etcHeader}>
              Established Traffic Control, Inc.
            </Text>
          </View>
          <View>
            <Text style={proposalStyles.quoteNumber}>
              {safeText(quoteNumber)}
            </Text>
            <Text style={proposalStyles.infoText}>
              {safeText(sender?.name)}
            </Text>
            <Text style={proposalStyles.infoText}>
              {safeText(sender?.email)}
            </Text>
            <Text style={proposalStyles.infoText}>3162 UNIONVILLE PIKE</Text>
            <Text style={proposalStyles.infoText}>HATFIELD, PA 19440</Text>
            <Text style={proposalStyles.infoText}>OFFICE: (215) 997-8801</Text>
            <Text style={proposalStyles.infoText}>FAX: (215) 997-8868</Text>
            <Text style={proposalStyles.infoText}>DBE / VBE</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={proposalStyles.table}>
          <View style={proposalStyles.tableHeader}>
            <Text style={proposalStyles.tableHeaderCell}>ITEM #</Text>
            <Text style={[proposalStyles.tableHeaderCell, { flex: 3 }]}>
              DESCRIPTION
            </Text>
            <Text style={[proposalStyles.tableHeaderCell, { flex: 0.8 }]}>
              QTY
            </Text>
            <Text style={[proposalStyles.tableHeaderCell, { flex: 0.8 }]}>
              UOM
            </Text>
            <Text style={proposalStyles.tableHeaderCell}>UNIT PRICE</Text>
            <Text
              style={[
                proposalStyles.tableHeaderCell,
                { borderRightWidth: 0 },
              ]}
            >
              EXTENDED PRICE
            </Text>
          </View>

          {items?.map((item, index) => (
            <View key={`item-${index}`} style={proposalStyles.tableRow}>
              <Text style={proposalStyles.tableCell}>
                {safeText(item.itemNumber)}
              </Text>
              <Text style={[proposalStyles.tableCell, { flex: 3 }]}>
                {safeText(item.description)}
                {"\n\n"}
                {safeText(item.notes)}
              </Text>
              <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}>
                {safeText(item.quantity)}
              </Text>
              <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}>
                {safeText(item.uom || "EA")}
              </Text>
              <Text style={[proposalStyles.tableCell, { textAlign: "right" }]}>
                $
                {safeText(
                  item.unitPrice?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                )}
              </Text>
              <Text style={[proposalStyles.tableCell, { textAlign: "right" }]}>
                ${calculateExtendedPrice(item)}
              </Text>
            </View>
          ))}

          {/* Total */}
          <View style={proposalStyles.tableRow}>
            <Text style={proposalStyles.tableCell}></Text>
            <Text style={[proposalStyles.tableCell, { flex: 3 }]}></Text>
            <Text style={proposalStyles.tableCell}></Text>
            <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}></Text>
            <Text
              style={[proposalStyles.tableCell, { flex: 0.8, textAlign: "right" }]}
            >
              TOTAL
            </Text>
            <Text
              style={[
                proposalStyles.tableCell,
                { borderRightWidth: 0, textAlign: "right" },
              ]}
            >
              $
              {safeText(
                total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              )}
            </Text>
          </View>
        </View>

        {/* Terms */}
        {includedTerms["standard-terms"] && (
          <>
            <StandardConditions />
            <StandardExclusions />
          </>
        )}
        {includedTerms["rental-agreements"] && (
          <StandardRentalEquipmentAgreement />
        )}
        {includedTerms["flagging-terms"] && <StandardFlaggingTermsConditions />}
        {includedTerms["custom-terms"] && customTaC && (
          <Text>{safeText(customTaC)}</Text>
        )}
      </Page>
    </Document>
  );
};
