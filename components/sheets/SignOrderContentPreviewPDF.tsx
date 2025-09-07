import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { SignOrderAdminInformation } from '@/app/takeoffs/sign-order/SignOrderContentSimple'
import { MPTRentalEstimating, PrimarySign, SecondarySign } from '@/types/MPTEquipment'

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  section: { marginBottom: 12 },
  label: { fontWeight: 'bold' },
  table: { display: 'flex', width: 'auto', marginTop: 12, borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { width: '16%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, backgroundColor: '#eee', padding: 4 },
  tableCol: { width: '16%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, padding: 4 },
  tableColWide: { width: '36%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, padding: 4 },
})

function formatDate(date) {
  if (!date) return '-'
  if (typeof date === 'string') date = new Date(date)
  return date instanceof Date && !isNaN(date.getTime()) ? date.toLocaleDateString() : '-'
}

const SignOrderContentPreviewPDF = ({ adminInfo, mptRental }) => {
  const signs = mptRental?.phases?.[0]?.signs || []
  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <Text style={styles.title}>Sign Order Preview</Text>
        <View style={styles.section}>
          <Text><Text style={styles.label}>Contract #:</Text> {adminInfo.contractNumber || '-'}</Text>
          <Text><Text style={styles.label}>Job #:</Text> {adminInfo.jobNumber || '-'}</Text>
          <Text><Text style={styles.label}>Customer:</Text> {adminInfo.customer?.name || '-'}</Text>
          <Text><Text style={styles.label}>Order Date:</Text> {formatDate(adminInfo.orderDate)}</Text>
          <Text><Text style={styles.label}>Need Date:</Text> {formatDate(adminInfo.needDate)}</Text>
          <Text><Text style={styles.label}>Order Type:</Text> {(adminInfo.orderType || []).join(', ')}</Text>
        </View>
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Sign Items</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Designation</Text>
              <Text style={styles.tableColHeader}>Description</Text>
              <Text style={styles.tableColHeader}>Width</Text>
              <Text style={styles.tableColHeader}>Height</Text>
              <Text style={styles.tableColHeader}>Qty</Text>
              <Text style={styles.tableColHeader}>Sheeting</Text>
            </View>
            {signs.map((sign, idx) => (
              <View style={styles.tableRow} key={sign.id || idx}>
                <Text style={styles.tableCol}>{sign.designation}</Text>
                <Text style={styles.tableCol}>{sign.description}</Text>
                <Text style={styles.tableCol}>{sign.width}</Text>
                <Text style={styles.tableCol}>{sign.height}</Text>
                <Text style={styles.tableCol}>{sign.quantity}</Text>
                <Text style={styles.tableCol}>{sign.sheeting}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default SignOrderContentPreviewPDF 