import React, { useMemo } from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { styles as baseStyles } from './styles/bidSummaryPDFStyle'
import Checkbox from './SheetCheckBox'
import { SignOrderAdminInformation } from '@/app/takeoffs/sign-order/SignOrderContentSimple'
import { MPTRentalEstimating } from "@/types/MPTEquipment";
import { Note } from "@/components/pages/quote-form/QuoteNotes";
import { safeNumber } from "@/lib/safe-number";
import { getEquipmentTotalsPerPhase } from "@/lib/mptRentalHelperFunctions";

export interface SignItem {
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
  displayStructure?: string
  bLights?: number
  cover?: boolean
}

interface Props {
  adminInfo: SignOrderAdminInformation
  signList: SignItem[]
  mptRental: MPTRentalEstimating | undefined
  notes: Note[]
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
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
    borderTop: '4px solid black',
    marginTop: 8,
    marginBottom: 0,
    paddingTop: 12
  },
  headerContainer: {
    borderBottom: '4px solid black',
    borderTop: '4px solid black',
    marginBottom: 0,
    marginTop: 0
  },
  headerRow: {
    flexDirection: 'row',
    borderBottom: '1.5px solid black',
    minHeight: 20
  },
  lastHeaderRow: {
    flexDirection: 'row',
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
    borderTop: '1.5px solid black',
    minHeight: 18,
    alignItems: 'center',
    padding: 2
  },
  cell: {
    flex: 1,
    fontSize: 8,
    textAlign: 'center',
    padding: 2
  },
  columnHeader: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#000'
  },
  lastCell: {
    borderRight: 0
  },
  equipmentContainer: {
    flexDirection: 'row',
    borderTop: '4px solid black',
    borderBottom: '4px solid black',
    marginTop: 8,
    fontSize: 8
  },
  equipmentTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    padding: 6
  },
  equipmentRow: {
    flexDirection: 'row',
    borderTop: '1.5px solid black',
    padding: 4,
    fontSize: 9
  },
  equipmentCell: {
    flex: 0.5,
    textAlign: 'left',
  },
  equipmentCellRight: {
    textAlign: 'right',
    flex: 0.5,
  },
  notesContainer: {
    padding: 12,
    fontSize: 9,
    flex: 0.66,
    borderLeft: '1.5px solid black'
  },
  notesRow: {
    flexDirection: 'row',
    marginBottom: 4,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 4,
  },
  notesDate: {
    fontSize: 8,
    color: '#6b7280'
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
  adminInfo,
  signList = [],
  mptRental,
  notes
}) => {

  const contentKey = useMemo(() => {
    return JSON.stringify({
      adminInfo,
      signListLength: signList.length,
      notesLength: notes.length,
      mptRental: !!mptRental
    });
  }, [adminInfo, signList, mptRental, notes]);

  const safeSignList: SignItem[] = (Array.isArray(signList) ? signList : [])
    .filter(item => {
      if (!item || typeof item !== 'object') return false;
      const hasRequiredProps =
        'designation' in item &&
        'quantity' in item &&
        'width' in item &&
        'height' in item;

      if (!hasRequiredProps) {
        console.warn('Filtering invalid sign item:', item);
        return false;
      }
      return true;
    })
    .map(item => ({
      designation: item.designation ?? '-',
      description: item.description ?? '-',
      quantity: item.quantity ?? 0,
      width: item.width ?? 0,
      height: item.height ?? 0,
      sheeting: item.sheeting ?? '-',
      substrate: item.substrate ?? '-',
      stiffener: item.stiffener ?? '',
      inStock: item.inStock ?? 0,
      order: item.order ?? 0,
      make: item.make ?? 0,
      unitPrice: item.unitPrice ?? 0,
      totalPrice: item.totalPrice ?? 0,
      primarySignId: item.primarySignId ?? '-',
      displayStructure: item.displayStructure ?? '-',
      bLights: item.bLights ?? 0,
      cover: !!item?.cover
    }));
    
  return (
    <Document key={contentKey}>
      <Page size='A4' style={styles.page}>
        <View style={styles.mainContainer}>
          {/* Title Bar */}
          <View style={styles.titleBar}>
            <Text style={styles.titleText}>Sign Order Worksheet</Text>
            <View style={styles.titleRight}>
              <Text style={{ fontSize: 10 }}>
                Submitter: {adminInfo.requestor?.name || '-'}
              </Text>
              <Text style={{ fontSize: 10 }}>
                Submission Date: {new Date(adminInfo.orderDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
              <View style={styles.headerCell}>
                <Text style={styles.label}>Customer:</Text>
                <Text style={styles.value}>
                  {adminInfo.customer?.name || '-'}
                </Text>
              </View>
              <View style={[styles.headerCell, styles.lastCell]}>
                <Text style={styles.label}>Customer Contact:</Text>
                <Text style={styles.value}>{adminInfo.customer?.phones[0] || '-'}</Text>
              </View>
            </View>
            <View style={styles.headerRow}>
              <View style={styles.headerCell}>
                <Text style={styles.label}>Job #:</Text>
                <Text style={styles.value}>
                  {adminInfo.jobNumber || '-'}
                </Text>
              </View>
              <View style={[styles.headerCell]}>
                <Text style={styles.label}>Contract #:</Text>
                <Text style={styles.value}>
                  {adminInfo.contractNumber || '-'}
                </Text>
              </View>
              <View style={[styles.headerCell, styles.lastCell]}>
                <Text style={styles.label}>Phase #:</Text>
                <Text style={styles.value}>
                  {mptRental?.phases.length || 0}
                </Text>
              </View>
            </View>
            <View style={styles.headerRow}>
              <View style={styles.headerCell}>
                <Text style={styles.label}>Sale:</Text>
                <Checkbox checked={adminInfo.orderType.includes('sale')} />
              </View>
              <View style={[styles.headerCell]}>
                <Text style={styles.label}>Rental:</Text>
                <Checkbox checked={adminInfo.orderType.includes('rental')} />
              </View>
              <View style={[styles.headerCell]}>
                <Text style={styles.label}>Permanent:</Text>
                <Checkbox checked={adminInfo.orderType.includes('permanent signs')} />
              </View>
              <View style={[styles.headerCell, styles.lastCell]}>
                <Text style={styles.label}>Multiple:</Text>
                <Checkbox checked={adminInfo.orderType.length > 1} />
              </View>
            </View>
            <View style={styles.lastHeaderRow}>
              <View style={styles.headerCell}>
                <Text style={styles.label}>Need Date:</Text>
                <Text style={styles.value}>
                  {adminInfo.needDate ? new Date(adminInfo.needDate).toLocaleDateString() : '-'}
                </Text>
              </View>
              <View style={[styles.headerCell]}>
                <Text style={styles.label}>Rental Start Date:</Text>
                <Text style={styles.value}>
                  {adminInfo.startDate ? new Date(adminInfo.startDate).toLocaleDateString() : '-'}
                </Text>
              </View>
              <View style={[styles.headerCell, styles.lastCell]}>
                <Text style={styles.label}>Rental End Date:</Text>
                <Text style={styles.value}>
                  {adminInfo.endDate ? new Date(adminInfo.endDate).toLocaleDateString() : '-'}
                </Text>
              </View>
            </View>
          </View>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>SIGN LIST</Text>
          {/* Sign List Table */}
          <View style={[styles.container, { borderBottom: '4px solid black' }]}>
            <View style={{ flex: 1 }}>
              {/* Table Header */}
              <View style={[styles.row, { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.cell, styles.columnHeader]}>Designation</Text>
                <Text style={[styles.cell, styles.columnHeader]}>Width</Text>
                <Text style={[styles.cell, styles.columnHeader]}>Height</Text>
                <Text style={[styles.cell, styles.columnHeader]}>Quantity</Text>
                <Text style={[styles.cell, styles.columnHeader]}>Sheeting</Text>
                <Text style={[styles.cell, styles.columnHeader]}>Structure</Text>
                <Text style={[styles.cell, styles.columnHeader]}>B Lights</Text>
                <Text style={[styles.cell, styles.columnHeader]}>Covers</Text>
              </View>
              {/* Table Rows */}
              {
                safeSignList.map((item, idx) => (
                  <View style={styles.row} key={idx}>
                    <Text style={styles.cell}>{item.designation}</Text>
                    <Text style={styles.cell}>{item.width} in.</Text>
                    <Text style={styles.cell}>{item.height} in.</Text>
                    <Text style={styles.cell}>{item.quantity}</Text>
                    <Text style={styles.cell}>{item.sheeting}</Text>
                    <Text style={styles.cell}>{item.displayStructure}</Text>
                    <Text style={styles.cell}>{item.bLights}</Text>
                    <Text style={styles.cell}>{item.cover ? 'Yes' : 'No'}</Text>
                  </View>
                ))
              }
            </View>
          </View>
          {/* EQUIPMENT SUMMARY */}
          <View style={styles.equipmentContainer}>
            <View style={{ flex: 0.33 }}>
              <Text style={styles.equipmentTitle}>EQUIPMENT SUMMARY</Text>
              <View style={styles.equipmentRow}>
                <Text style={styles.equipmentCell}>4&apos; TYPE III =</Text>
                <Text style={styles.equipmentCellRight}>{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).fourFootTypeIII.totalQuantity)}</Text>
              </View>
              <View style={styles.equipmentRow}>
                <Text style={styles.equipmentCell}>H-STANDS =</Text>
                <Text style={styles.equipmentCellRight}>{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).hStand.totalQuantity)}</Text>
              </View>
              <View style={styles.equipmentRow}>
                <Text style={styles.equipmentCell}>V/P&apos;S =</Text>
                <Text style={styles.equipmentCellRight}>{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).HIVP.totalQuantity)}</Text>
              </View>
              <View style={styles.equipmentRow}>
                <Text style={styles.equipmentCell}>B-LIGHTS =</Text>
                <Text style={styles.equipmentCellRight}>{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).BLights.totalQuantity)}</Text>
              </View>
              <View style={styles.equipmentRow}>
                <Text style={styles.equipmentCell}>SANDBAGS =</Text>
                <Text style={styles.equipmentCellRight}>{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).sandbag.totalQuantity)}</Text>
              </View>
              <View style={styles.equipmentRow}>
                <Text style={styles.equipmentCell}>POSTS =</Text>
                <Text style={styles.equipmentCellRight}>{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).post.totalQuantity)}</Text>
              </View>
              <View style={styles.equipmentRow}>
                <Text style={styles.equipmentCell}>6&apos; WINGS =</Text>
                <Text style={styles.equipmentCellRight}>{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).sixFootWings.totalQuantity)}</Text>
              </View>
              <View style={styles.equipmentRow}>
                <Text style={styles.equipmentCell}>METAL STANDS =</Text>
                <Text style={styles.equipmentCellRight}>{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).metalStands.totalQuantity)}</Text>
              </View>
              <View style={styles.equipmentRow}>
                <Text style={styles.equipmentCell}>C-LIGHTS =</Text>
                <Text style={styles.equipmentCellRight}>{mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).covers.totalQuantity)}</Text>
              </View>
            </View>
            <View style={styles.notesContainer}>
              {
                notes.map((note, idx) => (
                  <View style={styles.notesRow} key={idx}>
                    <Text>{note.text}</Text>
                    <Text style={styles.notesDate}>{formatDateTime(note.timestamp)}</Text>
                  </View>
                ))
              }
            </View>
          </View>
          {/* Footer */}
          <Footer pageNumber={1} totalPages={1} />
        </View>
      </Page>
    </Document>
  )

}

export default SignOrderWorksheetPDF
