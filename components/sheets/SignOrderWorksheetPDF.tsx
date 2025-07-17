'use client'
import React, { useEffect, useState } from 'react'
import { Page, Text, View, Document } from '@react-pdf/renderer'
import { styles } from './styles/bidSummaryPDFStyle'
import { safeNumber } from '@/lib/safe-number'
import { MPTRentalEstimating, PrimarySign, SecondarySign } from '@/types/MPTEquipment'

interface SignOrderWorksheetPDFProps {
  adminData: {
    contractNumber?: string
    jobNumber?: string
    customer?: { name?: string }
    customerPointOfContact?: string
    orderDate?: string | Date
    needDate?: string | Date
    startDate?: string | Date
    endDate?: string | Date
    branch?: string
    orderType?: string
    submitter?: string
    phaseNumber?: string
    standardEquipment?: Record<string, { quantity: number }>
  }
  mptRental: MPTRentalEstimating
  showFinancials: boolean
}

const SignOrderWorksheetPDF = ({ adminData, mptRental, showFinancials }: SignOrderWorksheetPDFProps) => {
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

  // Defensive helper for dates
  const renderDate = (date: any) => {
    if (!date) return '-'
    if (date instanceof Date && !isNaN(date.getTime())) return date.toLocaleDateString()
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : '-'
  }

  // Title Section
  const Title = () => (
    <View style={{ flexDirection: 'row', borderBottom: '1px solid black', paddingBottom: 4 }}>
      <View style={{ flex: 0.66, borderRight: '1px solid black', padding: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>ETC Sign Order Worksheet</Text>
        <Text style={{ fontSize: 10 }}>ETC Form 61</Text>
        <Text style={{ fontSize: 10 }}>v1.01 Jan/2025</Text>
      </View>
      <View style={{ flex: 0.33, padding: 4 }}>
        <Text style={{ fontSize: 10 }}>Requestor: {adminData.submitter || '-'}</Text>
        <Text style={{ fontSize: 10 }}>Order Date: {renderDate(adminData.orderDate)}</Text>
        <Text style={{ fontSize: 10 }}>Location: {adminData.branch || '-'}</Text>
      </View>
    </View>
  )

  // Admin Section (5 rows)
  const AdminSection = () => (
    <View style={{ marginBottom: 8, border: '1px solid black', padding: 6, backgroundColor: '#F8F9FA' }}>
      {/* Row 2: Customer, Customer Point of Contact */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        <View style={{ flex: 1, paddingRight: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>Customer</Text>
          <Text style={{ fontSize: 10, color: '#000' }}>{adminData.customer?.name || '-'}</Text>
        </View>
        <View style={{ flex: 1, paddingLeft: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>Customer Point of Contact</Text>
          <Text style={{ fontSize: 10, color: '#000' }}>{adminData.customerPointOfContact || '-'}</Text>
        </View>
      </View>
      {/* Row 3: Job Number, Contract Number, Phase Number */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        <View style={{ flex: 1, paddingRight: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>Job Number</Text>
          <Text style={{ fontSize: 10, color: '#000' }}>{adminData.jobNumber || '-'}</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>Contract Number</Text>
          <Text style={{ fontSize: 10, color: '#000' }}>{adminData.contractNumber || '-'}</Text>
        </View>
        <View style={{ flex: 1, paddingLeft: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>Phase Number</Text>
          <Text style={{ fontSize: 10, color: '#000' }}>{adminData.phaseNumber || 'Phase 1'}</Text>
        </View>
      </View>
      {/* Row 4: Order Type */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000', marginRight: 8 }}>Order Type:</Text>
          <Text style={{ fontSize: 10, color: '#000' }}>
            {adminData.orderType ? (
              <>
                {adminData.orderType.includes('Sale') ? '[x] Sale ' : '[ ] Sale '}
                {adminData.orderType.includes('Rental') ? '[x] Rental ' : '[ ] Rental '}
                {adminData.orderType.includes('Permanent Signs') ? '[x] Perm Signs' : '[ ] Perm Signs'}
              </>
            ) : '-'}
          </Text>
        </View>
      </View>
      {/* Row 5: Need Date, Start Date, End Date */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, paddingRight: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>Need Date</Text>
          <Text style={{ fontSize: 10, color: '#000' }}>{renderDate(adminData.needDate)}</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>Start Date</Text>
          <Text style={{ fontSize: 10, color: '#000' }}>{renderDate(adminData.startDate)}</Text>
        </View>
        <View style={{ flex: 1, paddingLeft: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>End Date</Text>
          <Text style={{ fontSize: 10, color: '#000' }}>{renderDate(adminData.endDate)}</Text>
        </View>
      </View>
    </View>
  )

  // Sign List (with phase grouping, secondary signs under primaries)
  const SignList = () => {
    const columns = [
      { label: 'Designation', flex: 1.5 },
      { label: 'Width', flex: 1 },
      { label: 'Height', flex: 1 },
      { label: 'Quantity', flex: 1.5 },
      { label: 'Sheeting', flex: 1.5 },
      { label: 'Structure', flex: 1.5 },
      { label: 'B Lights', flex: 1.5 },
      { label: 'Covers', flex: 1 }
    ]

    const structureMapping = {
      hStand: 'H Stand',
      none: 'None',
      fourFootTypeIII: "4' Type III",
      post: 'Post'
    }

    // Helper function to group signs (ensures secondary signs under primaries)
    const groupSignsByPrimary = (signs: (PrimarySign | SecondarySign)[]) => {
      const primarySigns = signs.filter(
        sign => !('primarySignId' in sign) && sign.quantity > 0 && sign.width > 0 && sign.height > 0
      ) as PrimarySign[]
      return primarySigns.map(primary => ({
        primary,
        secondaries: signs.filter(
          sign => 'primarySignId' in sign && sign.primarySignId === primary.id && sign.quantity > 0 && sign.width > 0 && sign.height > 0
        ) as SecondarySign[]
      }))
    }

    return (
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.sectionTitle}>SIGN LIST</Text>
        <View style={styles.container}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={[styles.summaryRow, { backgroundColor: '#F8F9FA' }]}>
              {columns.map((col, index) => (
                <Text key={index} style={[styles.phaseSummaryCell, { flex: col.flex, fontWeight: 'bold', fontSize: 10 }]}>
                  {col.label}
                </Text>
              ))}
            </View>
            {/* Phase Groups */}
            {mptRental?.phases?.length > 0 ? (
              mptRental.phases.map((phase, phaseIndex) => (
                <React.Fragment key={phaseIndex}>
                  <View style={[styles.summaryRow, { backgroundColor: '#E4E4E4' }]}>
                    <Text style={[styles.phaseSummaryCell, { flex: 9.5, fontSize: 10 }]}>Phase {phaseIndex + 1}</Text>
                  </View>
                  {groupSignsByPrimary(phase.signs).map((group, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                      {/* Primary Sign */}
                      <View style={styles.summaryRow}>
                        <Text style={[styles.phaseSummaryCell, { flex: 1.5, fontSize: 10 }]}>{group.primary.designation || '-'}</Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1, fontSize: 10 }]}>{Number(group.primary.width).toFixed(1)} in.</Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1, fontSize: 10 }]}>{Number(group.primary.height).toFixed(1)} in.</Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1.5, fontSize: 10 }]}>{group.primary.quantity || 0}</Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1.5, fontSize: 10 }]}>{group.primary.sheeting || '-'}</Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1.5, fontSize: 10 }]}>{structureMapping[group.primary.associatedStructure] || '-'}</Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1.5, fontSize: 10 }]}>{group.primary.bLights || 0}</Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1, fontSize: 10 }]}>{group.primary.cover ? group.primary.quantity : 0}</Text>
                      </View>
                      {/* Secondary Signs (directly under primary) */}
                      {group.secondaries.map((secondary, secondaryIndex) => (
                        <View key={secondaryIndex} style={styles.summaryRow}>
                          <Text style={[styles.phaseSummaryCell, { flex: 1.5, marginLeft: 20, fontSize: 10 }]}>{secondary.designation || '-'}</Text>
                          <Text style={[styles.phaseSummaryCell, { flex: 1, fontSize: 10 }]}>{Number(secondary.width).toFixed(1)} in.</Text>
                          <Text style={[styles.phaseSummaryCell, { flex: 1, fontSize: 10 }]}>{Number(secondary.height).toFixed(1)} in.</Text>
                          <Text style={[styles.phaseSummaryCell, { flex: 1.5, fontSize: 10 }]}>{secondary.quantity || 0}</Text>
                          <Text style={[styles.phaseSummaryCell, { flex: 1.5, fontSize: 10 }]}>{secondary.sheeting || '-'}</Text>
                          <Text style={[styles.phaseSummaryCell, { flex: 1.5, fontSize: 10 }]}>-</Text>
                          <Text style={[styles.phaseSummaryCell, { flex: 1.5, fontSize: 10 }]}>-</Text>
                          <Text style={[styles.phaseSummaryCell, { flex: 1, fontSize: 10 }]}>-</Text>
                        </View>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <View style={styles.summaryRow}>
                <Text style={[styles.phaseSummaryCell, { flex: 9.5, fontSize: 10 }]}>No signs available</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }

  // Equipment Summary and Notes
  const EquipmentAndNotes = () => {
    const equipmentTotals = adminData.standardEquipment
      ? Object.entries(adminData.standardEquipment)
          .filter(([key]) => ['fourFootTypeIII', 'hStand', 'post', 'sandbag', 'BLights', 'ACLights', 'sixFootWings', 'metalStands'].includes(key))
          .map(([key, value]: [string, any]) => ({
            type: key,
            quantity: safeNumber(value.quantity)
          }))
      : []

    return (
      <View style={{ flexDirection: 'row', marginBottom: 8, gap: 8 }}>
        {/* Equipment Summary (half row) */}
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>EQUIPMENT SUMMARY</Text>
          <View style={[styles.mptColumn, { border: '1px solid black', backgroundColor: '#F8F9FA' }]}>
            <View style={[styles.columnHeader, { backgroundColor: '#F8F9FA' }]}>
              <Text style={styles.columnHeaderText}>MPT EQUIPMENT</Text>
            </View>
            {equipmentTotals.length > 0 ? (
              equipmentTotals.map((item, idx) => (
                <View style={styles.row} key={idx}>
                  <Text style={[styles.cell, { fontSize: 10 }]}>
                    {item.type === 'fourFootTypeIII' ? "4' TYPE III" :
                     item.type === 'hStand' ? 'H-STANDS' :
                     item.type === 'post' ? 'POSTS' :
                     item.type === 'sandbag' ? 'SANDBAGS' :
                     item.type === 'BLights' ? 'B-LIGHTS' :
                     item.type === 'ACLights' ? 'C-LIGHTS' :
                     item.type === 'sixFootWings' ? "6' WINGS" :
                     item.type === 'metalStands' ? 'METAL STANDS' : item.type} =
                  </Text>
                  <Text style={[styles.quantityCell, { fontSize: 10 }]}>{item.quantity}</Text>
                </View>
              ))
            ) : (
              <View style={styles.row}>
                <Text style={[styles.cell, { fontSize: 10 }]}>No equipment data available</Text>
              </View>
            )}
            <View style={styles.totalStructure}>
              <Text style={styles.value}>
                STRUCTURES:{' '}
                {equipmentTotals.reduce((acc, item) => 
                  ['fourFootTypeIII', 'hStand', 'post'].includes(item.type) ? acc + item.quantity : acc, 0)}
              </Text>
            </View>
          </View>
        </View>
        {/* Notes Section (half row) */}
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>NOTES</Text>
          <View style={{ border: '1px solid black', minHeight: 100, padding: 6, backgroundColor: '#F8F9FA' }}>
            <Text style={{ fontSize: 10, color: '#000' }}></Text>
          </View>
        </View>
      </View>
    )
  }

  // Footer
  const Footer = () => (
    <View style={{ marginHorizontal: 10, marginTop: 'auto' }}>
      <View style={{ flexDirection: 'row', borderTop: '1px solid black', paddingTop: 4 }}>
        <Text style={{ flex: 0.33, textAlign: 'left', fontSize: 8 }}>ETC Form 61</Text>
        <Text style={{ flex: 0.33, textAlign: 'center', fontSize: 8 }}>v1.01 Jan/2025</Text>
        <Text style={{ flex: 0.33, textAlign: 'right', fontSize: 8 }}>Page 1 of 1</Text>
      </View>
    </View>
  )

  return (
    <Document title={`Sign Order Worksheet ${adminData.contractNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.mainContainer}>
          <Title />
          <AdminSection />
          <SignList />
          <EquipmentAndNotes />
          <Footer />
        </View>
      </Page>
    </Document>
  )
}

export default SignOrderWorksheetPDF
