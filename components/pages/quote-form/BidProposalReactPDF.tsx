"use client";

import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { QuoteItem } from '@/types/IQuoteItem';
import { StandardConditions, StandardExclusions } from './proposal-parts/StandardTermsAndConditions';
import { StandardRentalEquipmentAgreement } from './proposal-parts/RentalEquipmentAgreement';
import { StandardFlaggingTermsConditions } from './proposal-parts/FlaggingTermsAndConditions';
import { AdminData } from '@/types/TAdminData';
import { PaymentTerms } from './QuoteAdminInformation';

const proposalStyles = {
    page: {
        padding: 30,
        fontSize: 12,
    },
    companyInfoContainer: {
        flexDirection: 'row' as const,
        marginBottom: 20,
    },
    leftInfo: {
        flex: 1,
        marginLeft: 10,
    },
    rightInfo: {
        flex: 1,
        alignItems: 'flex-end' as const,
    },
    infoText: {
        fontSize: 10,
        marginBottom: 2,
    },
    img: {
        width: 100,
        height: 50,
    },
    quoteTable: {
        width: 200,
        border: '1px solid black',
    },
    quoteTableRow: {
        flexDirection: 'row' as const,
        borderBottom: '1px solid black',
    },
    quoteTableCell: {
        flex: 1,
        padding: 4,
        fontSize: 10,
    },
    quoteTableLabel: {
        fontWeight: 'bold',
        fontSize: 10,
    },
    validThrough: {
        fontSize: 10,
        marginTop: 5,
    },
    simpleBox: {
        width: '45%',
        border: '1px solid black',
        padding: 5,
    },
    simpleBoxRow: {
        marginBottom: 5,
    },
    jobInfoBox: {
        width: '45%',
        border: '1px solid black',
        padding: 5,
    },
    infoGrid: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
    },
    infoGridCell: {
        width: '50%',
        fontSize: 10,
        marginBottom: 3,
    },
    table: {
        marginTop: 20,
        border: '1px solid black',
    },
    tableHeader: {
        flexDirection: 'row' as const,
        backgroundColor: '#e4e4e4',
        borderBottom: '1px solid black',
        padding: 5,
    },
    tableHeaderCell: {
        flex: 1,
        fontSize: 10,
        fontWeight: 'bold',
        padding: 3,
        borderRight: '1px solid black',
    },
    tableRow: {
        flexDirection: 'row' as const,
        borderBottom: '1px solid black',
        minHeight: 25,
    },
    tableCell: {
        flex: 1,
        fontSize: 9,
        padding: 3,
        borderRight: '1px solid black',
    },
    warningText: {
        marginTop: 10,
        fontSize: 9,
        textAlign: 'center' as const,
        fontWeight: 'bold',
    },
};

export type StandardTermsAndConditions = 'Standard' | 'Rental' | 'Sale' | 'Flagging';

interface Props {
    adminData: AdminData;
    items?: QuoteItem[];
    customers: string[];
    name: string;
    email: string;
    quoteDate: Date;
    quoteNumber: string;
    paymentTerms: PaymentTerms;
    includedTaC: StandardTermsAndConditions[];
    customTerms: string;
    county: string;
    sr: string;
    ecms: string;
}

const BidProposalReactPDF = ({
    paymentTerms,
    quoteNumber,
    quoteDate,
    adminData,
    items,
    customers,
    name,
    includedTaC,
    customTerms,
    county,
    sr,
    ecms
}: Props) => {
    // Calculate the total for all items including composite items
    const calculateTotal = () => {
        if (!items?.length) return 0;

        return items.reduce((acc, item) => {
            const discount = item.discount || 0;
            const discountType = item.discountType || 'percentage';

            // Calculate parent item value
            const quantity = item.quantity || 0;
            const unitPrice = item.unitPrice || 0;
            const basePrice = quantity * unitPrice;

            // Calculate discount amount based on type
            const discountAmount = discountType === 'dollar'
                ? discount
                : (basePrice * (discount / 100));

            // Calculate composite items total if they exist
            const compositeTotal = item.associatedItems && item.associatedItems.length > 0
                ? item.associatedItems.reduce((subSum, compositeItem) =>
                    subSum + ((compositeItem.quantity || 0) * (compositeItem.unitPrice || 0)), 0)
                : 0;

            // Apply discount to the combined total
            return acc + (basePrice + compositeTotal - discountAmount);
        }, 0);
    };

    // Calculate extended price for a single item
    const calculateExtendedPrice = (item: QuoteItem) => {
        const discount = item.discount || 0;
        const discountType = item.discountType || 'percentage';

        // Calculate parent item value
        const quantity = item.quantity || 0;
        const unitPrice = item.unitPrice || 0;
        const basePrice = quantity * unitPrice;

        // Calculate discount amount based on type
        const discountAmount = discountType === 'dollar'
            ? discount
            : (basePrice * (discount / 100));

        // Calculate composite items total if they exist
        const compositeTotal = item.associatedItems && item.associatedItems.length > 0
            ? item.associatedItems.reduce((subSum, compositeItem) =>
                subSum + ((compositeItem.quantity || 0) * (compositeItem.unitPrice || 0)), 0)
            : 0;

        // Apply discount to the combined total
        return (basePrice + compositeTotal - discountAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const total = calculateTotal();

    return (
        <Document title={`Proposal ${ecms || quoteNumber}`}>
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
                            <Text>Quote For: {customers.length > 1 ? 'Estimating' : customers[0]} - Quote ID: {quoteNumber} cont.</Text>
                        ) : null
                    )}
                />

                {/* Company Info and Header */}
                <View style={proposalStyles.companyInfoContainer}>
                    <View style={{ width: 100, height: 50, backgroundColor: '#f0f0f0' }}>
                        {/* Logo placeholder */}
                        <Text style={{ fontSize: 8, textAlign: 'center' }}>COMPANY LOGO</Text>
                    </View>
                    <View style={proposalStyles.leftInfo}>
                        <Text style={proposalStyles.infoText}>ESTABLISHED TRAFFIC CONTROL</Text>
                        <Text style={proposalStyles.infoText}>3162 UNIONVILLE PIKE</Text>
                        <Text style={proposalStyles.infoText}>HATFIELD, PA 19440</Text>
                        <Text style={proposalStyles.infoText}>OFFICE: (215) 997-8801</Text>
                        <Text style={proposalStyles.infoText}>FAX: (215) 997-8868</Text>
                        <Text style={proposalStyles.infoText}>DBE / VBE</Text>
                    </View>
                    <View style={proposalStyles.rightInfo}>
                        {/* Table structure */}
                        <View style={proposalStyles.quoteTable}>
                            <View style={proposalStyles.quoteTableRow}>
                                <View style={proposalStyles.quoteTableCell}>
                                    <Text style={proposalStyles.quoteTableLabel}>Quote Date</Text>
                                </View>
                                <View style={proposalStyles.quoteTableCell}>
                                    <Text style={proposalStyles.quoteTableLabel}>Quote ID</Text>
                                </View>
                            </View>
                            <View style={proposalStyles.quoteTableRow}>
                                <View style={proposalStyles.quoteTableCell}>
                                    <Text>{quoteDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</Text>
                                </View>
                                <View style={proposalStyles.quoteTableCell}>
                                    <Text>{quoteNumber}</Text>
                                </View>
                            </View>
                            <View style={proposalStyles.quoteTableRow}>
                                <View style={proposalStyles.quoteTableCell}>
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
                    </View>
                </View>

                {/* Main container with space-between justification */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
                    {/* Left box - Attention/Requested By */}
                    <View style={proposalStyles.simpleBox}>
                        <View style={proposalStyles.simpleBoxRow}>
                            <Text style={proposalStyles.quoteTableLabel}>
                                Attention
                            </Text>
                        </View>
                        <View style={{ fontSize: 11 }}>
                            <Text>{customers.length > 1 ? 'Estimating' : customers[0]}</Text>
                        </View>
                    </View>

                    {/* Right box - Job Information */}
                    <View style={proposalStyles.jobInfoBox}>
                        <View style={proposalStyles.infoGrid}>
                            <View style={proposalStyles.infoGridCell}>
                                <Text style={proposalStyles.quoteTableLabel}>County:</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text>{county}</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text style={proposalStyles.quoteTableLabel}>State Route:</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text>{sr}</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text style={proposalStyles.quoteTableLabel}>ECMS</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text>{ecms}</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text style={proposalStyles.quoteTableLabel}>Start Date</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text>{adminData.startDate && adminData.startDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text style={proposalStyles.quoteTableLabel}>End Date</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text>{adminData.endDate && adminData.endDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text style={proposalStyles.quoteTableLabel}>Total days:</Text>
                            </View>
                            <View style={proposalStyles.infoGridCell}>
                                <Text>
                                    {(adminData.startDate && adminData.endDate)
                                        ? `${Math.ceil((adminData.endDate.getTime() - adminData.startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                                        : ''}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Table for items */}
                <View style={proposalStyles.table}>
                    <View style={proposalStyles.tableHeader}>
                        <Text style={proposalStyles.tableHeaderCell}>ITEM # / SKU</Text>
                        <Text style={[proposalStyles.tableHeaderCell, { flex: 3 }]}>DESCRIPTION</Text>
                        <Text style={proposalStyles.tableHeaderCell}>PRICE</Text>
                        <Text style={[proposalStyles.tableHeaderCell, { flex: 0.8 }]}>UOM</Text>
                        <Text style={[proposalStyles.tableHeaderCell, { flex: 0.8 }]}>QTY</Text>
                        <Text style={[proposalStyles.tableHeaderCell, { borderRightWidth: 0 }]}>TOTAL</Text>
                    </View>
                    {/* First render all actual items */}
                    {items?.map((item, index) => (
                        <View key={`item-${index}`} style={proposalStyles.tableRow}>
                            <Text style={proposalStyles.tableCell}>{item.itemNumber}</Text>
                            <Text style={[proposalStyles.tableCell, { flex: 3 }]}>{item.description + '\n\n' + (item.notes || '')}</Text>
                            <Text style={proposalStyles.tableCell}>
                                ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                            <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}>{item.uom || 'EA'}</Text>
                            <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}>{item.quantity}</Text>
                            <Text style={[proposalStyles.tableCell, { borderRightWidth: 0 }]}>
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
                            <Text style={[proposalStyles.tableCell, { borderRightWidth: 0 }]}>$    -</Text>
                        </View>
                    ))}
                    <View style={proposalStyles.tableRow}>
                        <Text style={proposalStyles.tableCell}></Text>
                        <Text style={[proposalStyles.tableCell, { flex: 3 }]}></Text>
                        <Text style={proposalStyles.tableCell}></Text>
                        <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}></Text>
                        <Text style={[proposalStyles.tableCell, { flex: 0.8 }]}>TOTAL</Text>
                        <Text style={[proposalStyles.tableCell, { borderRightWidth: 0 }]}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </View>
                </View>

                <Text style={proposalStyles.warningText}>
                    ABOVE PRICING IS SUBJECT TO CHANGE AT ANY TIME DUE TO THE CONTINUED ESCALATION OF RAW MATERIAL AND TRANSPORTATION COSTS. ABOVE PRICES EXCLUDE TAX.
                </Text>
                {customTerms && customTerms.trim() !== '' && (
                    <View style={{ marginTop: 10, padding: 5, border: '1px solid black' }}>
                        <Text style={{ fontSize: 11 }}>{customTerms}</Text>
                    </View>
                )}

                {includedTaC.includes('Sale') && (
                    <View style={{ marginTop: 10, backgroundColor: '#FFFF00', padding: 5 }}>
                        <Text style={{ fontSize: 8, color: 'red', textAlign: 'center' }}>SALE ITEM PAYMENT TERMS ARE NET 14</Text>
                    </View>
                )}

                <View style={{ marginTop: 40, marginHorizontal: 30 }}>
                    <Text style={{ fontSize: 10, textAlign: 'center', color: '#000080' }}>
                        IF THE PROPOSAL IS ACCEPTED, PLEASE SIGN AND DATE BELOW AND RETURN. THANK YOU!,
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 10 }}>ACCEPTED BY:________________________________</Text>
                        <Text style={{ fontSize: 10 }}>DATE:_______________</Text>
                    </View>
                </View>

                {includedTaC.includes('Standard') && (
                    <>
                        <StandardConditions />
                        <StandardExclusions />
                    </>
                )}

                {includedTaC.includes('Rental') && <StandardRentalEquipmentAgreement />}
                {includedTaC.includes('Flagging') && <StandardFlaggingTermsConditions />}
            </Page>
        </Document>
    );
};

export default BidProposalReactPDF;