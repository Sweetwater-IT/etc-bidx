import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { TakeoffHeader, TakeoffItem } from '@/types/Takeoff'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1pt solid black',
    paddingBottom: 5,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  fieldLabel: {
    width: '30%',
    fontWeight: 'bold',
  },
  fieldValue: {
    width: '70%',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '0.5pt solid #ccc',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  notesCell: {
    flex: 2,
  },
})

interface BuildTakeoffPDFProps {
  header: TakeoffHeader
  items: TakeoffItem[]
}

export default function BuildTakeoffPDF({ header, items }: BuildTakeoffPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cover Sheet */}
        <Text style={styles.title}>Takeoff Sheet</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Information</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ETC Job #:</Text>
            <Text style={styles.fieldValue}>{header.etcJobNumber}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Work Type:</Text>
            <Text style={styles.fieldValue}>{header.workType}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Customer:</Text>
            <Text style={styles.fieldValue}>{header.customer?.displayName || header.customer?.name}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Customer Job #:</Text>
            <Text style={styles.fieldValue}>{header.customerJobNumber}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Contract #:</Text>
            <Text style={styles.fieldValue}>{header.contractNumber}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Customer POC:</Text>
            <Text style={styles.fieldValue}>{header.customerPOC}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>POC Email:</Text>
            <Text style={styles.fieldValue}>{header.customerPOCEmail}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>POC Phone:</Text>
            <Text style={styles.fieldValue}>{header.customerPOCPhone}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Items</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 1 }]}>Item #</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>Description</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Quantity</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>UOM</Text>
            <Text style={[styles.tableCell, styles.notesCell]}>Notes</Text>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>{item.itemNumber}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{item.description}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{item.uom}</Text>
              <Text style={[styles.tableCell, styles.notesCell]}>{item.notes}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}