// Copied from worksheet-pdf.tsx as a base for sign order worksheet export
'use client'
import React, { useEffect, useState } from 'react'
import { Page, Text, View, Document } from '@react-pdf/renderer'
import { styles } from './styles/bidSummaryPDFStyle'
import {
  MPTRentalEstimating,
  PrimarySign,
  SecondarySign
} from '@/types/MPTEquipment'
import { EquipmentRentalItem } from '@/types/IEquipmentRentalItem'
import { Flagging } from '@/types/TFlagging'
import { safeNumber } from '@/lib/safe-number'
import {
  getAssociatedSignEquipment,
  calculateEquipmentCostSummary,
  calculateLaborCostSummary,
  calculateTotalSignCostSummary,
  getEquipmentTotalsPerPhase,
  returnPhaseTotals,
  returnSignTotalsByPhase,
  returnSignTotalsSquareFootage
} from '@/lib/mptRentalHelperFunctions'
import { defaultMPTObject } from '@/types/default-objects/defaultMPTObject'

interface Props {
  adminData: any
  mptRental: MPTRentalEstimating | undefined
  equipmentRental: EquipmentRentalItem[] | undefined
  flagging: Flagging | undefined
}

const SignOrderBidSummaryPDF = ({
  adminData,
  mptRental,
  equipmentRental,
  flagging
}: Props) => {
  // Client-only: Submission date string
  const [submissionDate, setSubmissionDate] = useState('-')
  useEffect(() => {
    setSubmissionDate(
      new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })
    )
  }, [])

  if (!adminData || !mptRental) {
    return (
      <Document>
        <Page size='A4' style={styles.page}>
          <View style={styles.mainContainer}>
            <Text style={{ color: 'red', fontSize: 14, margin: 20 }}>
              Error: Missing data for worksheet. Please ensure all required
              information is loaded.
            </Text>
          </View>
        </Page>
      </Document>
    )
  }
  // Defensive helpers
  const safeDateString = (date: Date | null | undefined) =>
    date instanceof Date && !isNaN(date.getTime())
      ? date.toLocaleDateString()
      : '-'
  const safeNumberValue = (val: any, fallback = 0) =>
    typeof val === 'number' && !isNaN(val) ? val : fallback

  // Helper to safely render a date as a string
  const renderDate = (date: any) => {
    if (!date) return '-'
    if (date instanceof Date && !isNaN(date.getTime()))
      return date.toLocaleDateString()
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : '-'
  }

  const Title = () => (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ flex: 0.66, borderRight: '1px solid black' }}>
        <Text>ETC Sign Order Worksheet</Text>
      </View>
      <View style={{ padding: 4, flex: 0.33, flexDirection: 'column' }}>
        <Text style={{ fontSize: 10 }}>Requestor: {adminData.estimator}</Text>
        <Text style={{ fontSize: 10 }}>
          Order Date:{' '}
          {adminData.startDate
            ? adminData.startDate instanceof Date
              ? adminData.startDate.toLocaleDateString()
              : new Date(adminData.startDate).toLocaleDateString()
            : '-'}
        </Text>
      </View>
    </View>
  )

  // Add blue cell header section below the title bar
  const BlueHeaderSection = () => (
    <View style={{ marginBottom: 8 }}>
      {/* Row 1: Customer | Customer Point of Contact */}
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            padding: 6,
            border: '1px solid #fff'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>
            Customer
          </Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>
            {adminData?.customer?.name || adminData?.contractors?.name || '-'}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            padding: 6,
            border: '1px solid #fff'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>
            Customer Point of Contact
          </Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>
            {adminData?.contact || '-'}
          </Text>
        </View>
      </View>
      {/* Row 2: Job Number | Contract # | Phase */}
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            padding: 6,
            border: '1px solid #fff'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>
            Job Number
          </Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>
            {adminData?.job_number || adminData?.jobNumber || '-'}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            padding: 6,
            border: '1px solid #fff'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>
            Contract #
          </Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>
            {adminData?.contract_number || adminData?.contractNumber || '-'}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            padding: 6,
            border: '1px solid #fff'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>
            Phase
          </Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>
            {Array.isArray(mptRental?.phases) && mptRental.phases.length > 0
              ? mptRental.phases.length === 1
                ? 'Phase 1'
                : mptRental.phases
                    .map((_, idx) => `Phase ${idx + 1}`)
                    .join(', ')
              : '-'}
          </Text>
        </View>
      </View>
      {/* Row 3: Order Type (checkboxes) */}
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            padding: 6,
            border: '1px solid #fff',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 10,
              marginRight: 8
            }}
          >
            Order Type:
          </Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>[ ] Sale</Text>
          <Text style={{ color: '#fff', fontSize: 10, marginLeft: 8 }}>
            {adminData?.sale ? '[x]' : '[ ]'} Rental
          </Text>
          <Text style={{ color: '#fff', fontSize: 10, marginLeft: 8 }}>
            {adminData?.perm_signs ? '[x]' : '[ ]'} Perm Signs
          </Text>
        </View>
      </View>
      {/* Row 4: Need Date | If rental [Start date:] | If rental [End date:] */}
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            padding: 6,
            border: '1px solid #fff'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>
            Need Date
          </Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>
            {renderDate(adminData?.need_date || adminData?.needDate)}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            padding: 6,
            border: '1px solid #fff'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>
            If rental [Start date:]
          </Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>
            {renderDate(adminData?.start_date || adminData?.startDate)}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            padding: 6,
            border: '1px solid #fff'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>
            If rental [End date:]
          </Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>
            {renderDate(adminData?.end_date || adminData?.endDate)}
          </Text>
        </View>
      </View>
      {/* Row 5: Delete (full width) */}
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#2563eb',
            padding: 6,
            border: '1px solid #fff',
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>
            Delete
          </Text>
        </View>
      </View>
    </View>
  )

  // Render a simplified header with only admin info fields relevant to sign order
  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.label}>Contract #:</Text>
          <Text style={styles.value}>{adminData?.contractNumber || '-'}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>Branch:</Text>
          <Text style={styles.value}>{adminData?.county?.name || '-'}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>Order Date:</Text>
          <Text style={styles.value}>
            {adminData?.startDate ? safeDateString(adminData.startDate) : '-'}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>Need Date:</Text>
          <Text style={styles.value}>
            {adminData?.endDate ? safeDateString(adminData.endDate) : '-'}
          </Text>
        </View>
      </View>
      <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.label}>Requestor:</Text>
          <Text style={styles.value}>{adminData?.estimator || '-'}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>Order Type:</Text>
          <Text style={styles.value}>{adminData?.orderType || '-'}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{adminData?.customer?.name || '-'}</Text>
        </View>
        <View style={styles.headerCell} />
      </View>
    </View>
  )

  // Equipment Summary Section
  const EquipmentSummary = () => (
    <View style={{ flex: 1, marginTop: 16, flexDirection: 'row', gap: 16 }}>
      {/* Equipment Summary Table */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}>
          Equipment Summary
        </Text>
        {/* Add your equipment summary table or content here, e.g. list of equipment, quantities, etc. */}
        <Text style={{ fontSize: 10 }}>[Equipment summary content here]</Text>
      </View>
      {/* Notes Section */}
      <View style={{ flex: 1, paddingLeft: 16 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}>
          Notes
        </Text>
        <Text style={{ fontSize: 10 }}>{adminData?.notes || '-'}</Text>
      </View>
    </View>
  )

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.mainContainer}>
          <Title />
          <BlueHeaderSection />
          {/* Only render the sign list section below */}
          {/* Section Title */}
          <Text style={styles.sectionTitle}>SIGN LIST</Text>
          {/* Sign List Table */}
          <View style={styles.container}>
            <View style={{ flex: 1 }}>
              {/* Table Header */}
              <View style={styles.row}>
                <Text style={[styles.cell, styles.columnHeader]}>
                  Designation
                </Text>
                <Text style={[styles.cell, styles.columnHeader]}>
                  Description
                </Text>
                <Text style={[styles.cell, styles.columnHeader]}>Qty</Text>
                <Text style={[styles.cell, styles.columnHeader]}>Width</Text>
                <Text style={[styles.cell, styles.columnHeader]}>Height</Text>
                <Text style={[styles.cell, styles.columnHeader]}>Sheeting</Text>
                <Text style={[styles.cell, styles.columnHeader]}>
                  Substrate
                </Text>
                <Text style={[styles.cell, styles.columnHeader]}>
                  Stiffener
                </Text>
                {mptRental?.phases?.[0]?.signs?.some(s => 'unitPrice' in s) && (
                  <Text style={[styles.cell, styles.columnHeader]}>
                    Unit Price
                  </Text>
                )}
                {mptRental?.phases?.[0]?.signs?.some(
                  s => 'totalPrice' in s
                ) && (
                  <Text style={[styles.cell, styles.columnHeader]}>
                    Total Price
                  </Text>
                )}
              </View>
              {/* Table Rows */}
              {mptRental?.phases?.[0]?.signs?.map((item, idx) => (
                <View style={styles.row} key={idx}>
                  <Text style={styles.cell}>{item.designation}</Text>
                  <Text style={styles.cell}>{item.description}</Text>
                  <Text style={styles.cell}>{item.quantity}</Text>
                  <Text style={styles.cell}>{item.width}</Text>
                  <Text style={styles.cell}>{item.height}</Text>
                  <Text style={styles.cell}>{item.sheeting}</Text>
                  <Text style={styles.cell}>{item.substrate}</Text>
                  <Text style={styles.cell}>
                    {(item as any).primarySignId !== undefined
                      ? '-'
                      : item.stiffener
                      ? 'Yes'
                      : 'No'}
                  </Text>
                  {'unitPrice' in item &&
                    typeof item.unitPrice === 'number' && (
                      <Text style={styles.cell}>{`$${item.unitPrice.toFixed(
                        2
                      )}`}</Text>
                    )}
                  {'totalPrice' in item &&
                    typeof item.totalPrice === 'number' && (
                      <Text style={styles.cell}>{`$${item.totalPrice.toFixed(
                        2
                      )}`}</Text>
                    )}
                </View>
              ))}
            </View>
          </View>
          {/* Equipment Summary and Notes side by side */}
          <EquipmentSummary />
        </View>
      </Page>
    </Document>
  )
}

export default SignOrderBidSummaryPDF
