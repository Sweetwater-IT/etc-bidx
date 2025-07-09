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
  // Defensive helpers
  const safeDateString = (date: Date | null | undefined) =>
    date instanceof Date && !isNaN(date.getTime())
      ? date.toLocaleDateString()
      : '-'
  const safeNumberValue = (val: any, fallback = 0) =>
    typeof val === 'number' && !isNaN(val) ? val : fallback

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

  const Title = () => (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ flex: 0.66, borderRight: '1px solid black' }}>
        <Text>ETC Sign Order Worksheet</Text>
      </View>
      <View style={{ padding: 4, flex: 0.33, flexDirection: 'column' }}>
        <Text style={{ fontSize: 10 }}>Submitter: {adminData.estimator}</Text>
        <Text style={{ fontSize: 10 }}>Submission Date: {submissionDate}</Text>
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

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.mainContainer}>
          <Title />
          <Header />
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
        </View>
      </Page>
    </Document>
  )
}

export default SignOrderBidSummaryPDF
