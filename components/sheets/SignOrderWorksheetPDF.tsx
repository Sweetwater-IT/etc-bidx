import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { styles as baseStyles } from './styles/bidSummaryPDFStyle'

interface AdminData {
  contractNumber?: string
  jobNumber?: string
  customer?: { name?: string }
  orderDate?: string | Date
  needDate?: string | Date
  branch?: string
  orderType?: string
  submitter?: string
}

interface SignItem {
  designation: string
  description: string
  quantity: number
  width: number
  height: number
  sheeting: string
  substrate: string
  stiffener: string | boolean
  inStock?: number
  order?: number
  make?: number
  unitPrice?: number
  totalPrice?: number
  primarySignId?: string
}

interface Props {
  adminData: AdminData
  signList: SignItem[]
  showFinancials: boolean
}

const styles = StyleSheet.create({
  ...baseStyles,
  mainContainer: {
    border: '4px solid black',
    padding: 0,
    margin: 0,
    backgroundColor: '#fff'
  },
  titleBar: {
    flexDirection: 'row',
    backgroundColor: '#fff', // Remove black background
    color: '#000', // Black text
    alignItems: 'center',
    borderBottom: '2px solid black',
    padding: 8
  },
  titleText: {
    color: '#000', // Black text
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    textAlign: 'left'
  },
  titleRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: 1
  },
  sectionTitle: {
    backgroundColor: '#fff', // Remove black background
    color: '#000', // Black text
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    padding: 6,
    borderTop: '2px solid black',
    borderBottom: '2px solid black',
    marginTop: 8,
    marginBottom: 0
  },
  headerContainer: {
    borderBottom: '2px solid black',
    borderTop: '2px solid black',
    marginBottom: 0,
    marginTop: 0
  },
  headerRow: {
    flexDirection: 'row',
    borderBottom: '1.5px solid black',
    minHeight: 20
  },
  headerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRight: '1.5px solid black'
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 3
  },
  value: {
    fontSize: 9,
    fontWeight: 500
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1.5px solid black',
    minHeight: 18,
    alignItems: 'center',
    padding: 2
  },
  cell: {
    flex: 1,
    fontSize: 8,
    textAlign: 'center',
    borderRight: '1.5px solid black',
    padding: 2
  },
  columnHeader: {
    fontWeight: 'bold',
    backgroundColor: '#E4E4E4',
    fontSize: 9,
    color: '#000'
  },
  lastCell: {
    borderRight: 0
  },
  footer: {
    flexDirection: 'row',
    borderTop: '2px solid black',
    marginTop: 8,
    padding: 4,
    fontSize: 8
  }
})

const safeDateString = (date: string | Date | undefined) => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d instanceof Date && !isNaN(d.getTime()) ? d.toLocaleDateString() : '-'
}

const Footer = ({
  pageNumber,
  totalPages
}: {
  pageNumber: number
  totalPages: number
}) => (
  <View style={styles.footer}>
    <Text style={{ flex: 0.33, textAlign: 'left' }}>ETC Form 61</Text>
    <Text style={{ flex: 0.33, textAlign: 'center' }}>v1.01 Jan/2025</Text>
    <Text style={{ flex: 0.33, textAlign: 'right' }}>
      Page {pageNumber} of {totalPages}
    </Text>
  </View>
)

const SignOrderWorksheetPDF: React.FC<Props> = ({
  adminData,
  signList,
  showFinancials
}) => (
  <Document>
    <Page size='A4' style={styles.page}>
      <View style={styles.mainContainer}>
        {/* Title Bar */}
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>Sign Order Worksheet</Text>
          <View style={styles.titleRight}>
            <Text style={{ fontSize: 10, color: '#fff' }}>
              Submitter: {adminData.submitter || '-'}
            </Text>
            <Text style={{ fontSize: 10, color: '#fff' }}>
              Submission Date: {safeDateString(new Date())}
            </Text>
          </View>
        </View>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.headerCell}>
              <Text style={styles.label}>Contract #:</Text>
              <Text style={styles.value}>
                {adminData.contractNumber || '-'}
              </Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.label}>Job #:</Text>
              <Text style={styles.value}>{adminData.jobNumber || '-'}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.label}>Branch:</Text>
              <Text style={styles.value}>{adminData.branch || '-'}</Text>
            </View>
            <View style={[styles.headerCell, styles.lastCell]}>
              <Text style={styles.label}>Order Type:</Text>
              <Text style={styles.value}>{adminData.orderType || '-'}</Text>
            </View>
          </View>
          <View style={styles.headerRow}>
            <View style={styles.headerCell}>
              <Text style={styles.label}>Customer:</Text>
              <Text style={styles.value}>
                {adminData.customer?.name || '-'}
              </Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.label}>Order Date:</Text>
              <Text style={styles.value}>
                {safeDateString(adminData.orderDate)}
              </Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.label}>Need Date:</Text>
              <Text style={styles.value}>
                {safeDateString(adminData.needDate)}
              </Text>
            </View>
            <View style={[styles.headerCell, styles.lastCell]} />
          </View>
        </View>
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
              <Text style={[styles.cell, styles.columnHeader]}>Substrate</Text>
              <Text style={[styles.cell, styles.columnHeader]}>Stiffener</Text>
              {showFinancials && (
                <Text style={[styles.cell, styles.columnHeader]}>
                  Unit Price
                </Text>
              )}
              {showFinancials && (
                <Text style={[styles.cell, styles.columnHeader]}>
                  Total Price
                </Text>
              )}
            </View>
            {/* Table Rows */}
            {signList.map((item, idx) => (
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
                {showFinancials && (
                  <Text style={styles.cell}>
                    {item.unitPrice !== undefined
                      ? `$${item.unitPrice.toFixed(2)}`
                      : '-'}
                  </Text>
                )}
                {showFinancials && (
                  <Text style={styles.cell}>
                    {item.totalPrice !== undefined
                      ? `$${item.totalPrice.toFixed(2)}`
                      : '-'}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
        {/* Footer */}
        <Footer pageNumber={1} totalPages={1} />
      </View>
    </Page>
  </Document>
)

export default SignOrderWorksheetPDF
