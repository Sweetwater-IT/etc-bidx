'use client'
import React, { useState, useEffect } from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { styles as baseStyles } from './styles/bidSummaryPDFStyle'
import Checkbox from './SheetCheckBox'
import { SignOrderAdminInformation } from '@/app/takeoffs/sign-order/SignOrderContentSimple'
import { MPTRentalEstimating } from "@/types/MPTEquipment";
import { Note } from "@/components/pages/quote-form/QuoteNotes";
import { safeNumber } from "@/lib/safe-number";
import { getEquipmentTotalsPerPhase } from "@/lib/mptRentalHelperFunctions";

export interface SignItem {
  legend: string
  quantity: number
  size: string
  displayStructure: string
  type?: 'trailblazers' | 'type3' | 'loose'
}

interface Props {
  adminInfo: SignOrderAdminInformation
  type3Signs: SignItem[]
  trailblazersSigns: SignItem[]
  looseSigns: SignItem[]
  mptRental: MPTRentalEstimating | undefined
  notes: Note[]
}

function formatDateTime (ts: number) {
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
    borderTop: '4px solid black',
    marginTop: 8,
    marginBottom: 0,
    paddingTop: 12
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
    borderTop: '1.5px solid black',
    minHeight: 18,
    alignItems: 'center',
  },
  firstRow: {
    flex: 0.19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstBody: {
    flex: 0.8,
    borderLeft: '1.5px solid black',
  },
  firstBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

const MPTOrderWorksheetPDF: React.FC<Props> = ({
  adminInfo,
  type3Signs,
  trailblazersSigns,
  looseSigns,
  mptRental,
  notes
}) => {
  const [signList, setSignList] = useState<SignItem[]>([])
  useEffect(() => {
    setSignList([...trailblazersSigns.map((item) => ({...item, type: 'trailblazers' as const})), ...type3Signs.map((item) => ({...item, type: 'type3' as const})), ...looseSigns.map((item) => ({...item, type: 'loose' as const}))])
  }, [trailblazersSigns, type3Signs, looseSigns])
  return (
  <Document>
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
            <View style={styles.headerCell}>
              <Text style={styles.label}>Contact:</Text>
              <Text style={styles.value}>
                {adminInfo.customer?.mainPhone || '-'}
              </Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.label}>E-mail:</Text>
              <Text style={styles.value}>
                {adminInfo.customer?.emails[0] || '-'}
              </Text>
            </View>
            <View style={[styles.headerCell, styles.lastCell]}>
              <Text style={styles.label}>Phone:</Text>
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
              <Text style={styles.label}>Order Date:</Text>
              <Text style={styles.value}>
                {adminInfo.orderDate ? new Date(adminInfo.orderDate).toLocaleDateString() : '-'}
              </Text>
            </View>
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
        <View style={{ borderBottom: '4px solid black'}}>
            {/* Table Header */}
            <View style={[styles.row, { backgroundColor: '#F3F4F6' }]}>
              <Text style={[styles.cell, styles.columnHeader, { flex: 0.2}]}></Text>
              <Text style={[styles.cell, styles.columnHeader, { flex: 0.1 }]}>Qty</Text>
              <Text style={[styles.cell, styles.columnHeader, { flex: 0.1 }]}>Size</Text>
              <Text style={[styles.cell, styles.columnHeader, { flex: 0.4 }]}>Legend</Text>
              <Text style={[styles.cell, styles.columnHeader, { flex: 0.2 }]}>Structure</Text>
            </View>
            {
              signList.map((item, idx) => (
                <>
                  <View style={styles.row} key={idx}>
                    <Text style={[styles.cell, { flex: 0.1 }]}>{item.quantity || 0}</Text>
                    <Text style={[styles.cell, { flex: 0.1 }]}>{item.size || ''}</Text>
                    <Text style={[styles.cell, { flex: 0.4 }]}>{item.legend || ''}</Text>
                    <Text style={[styles.cell, { flex: 0.2 }]}>{item.displayStructure || ''}</Text>
                  </View>
                </>
              ))
            }
            {/* Group items by type and render with category headers */}
            {(() => {
              const groupedItems = {
                trailblazers: signList.filter(item => item.type === 'trailblazers'),
                type3: signList.filter(item => item.type === 'type3'),
                loose: signList.filter(item => item.type === 'loose')
              };
              
              const sections: React.ReactElement[] = [];
              
              // TRAILBLAZERS Section
              if (groupedItems.trailblazers.length > 0) {
                sections.push(
                  <View key="trailblazers-section">
                    {groupedItems.trailblazers.map((item, idx) => (
                      <View style={styles.row} key={`trailblazers-${idx}`}>
                        {idx === 0 && (
                          <Text style={[styles.cell, { flex: 0.2, borderRight: '1.5px solid black' }]}>
                            TRAILBLAZERS
                          </Text>
                        )}
                        <Text style={[styles.cell, { flex: 0.1 }]}>{item.quantity || 0}</Text>
                        <Text style={[styles.cell, { flex: 0.1 }]}>{item.size || ''}</Text>
                        <Text style={[styles.cell, { flex: 0.4 }]}>{item.legend || ''}</Text>
                        <Text style={[styles.cell, { flex: 0.2 }]}>{item.displayStructure || ''}</Text>
                      </View>
                    ))}
                  </View>
                );
              }
              
              // TYPE III Section
              if (groupedItems.type3.length > 0) {
                sections.push(
                  <View key="type3-section">
                    {groupedItems.type3.map((item, idx) => (
                      <View style={styles.row} key={`type3-${idx}`}>
                        {idx === 0 && (
                          <Text style={[styles.cell, { flex: 0.2, borderRight: '1.5px solid black' }]}>
                            TYPE III'S
                          </Text>
                        )}
                        <Text style={[styles.cell, { flex: 0.1 }]}>{item.quantity || 0}</Text>
                        <Text style={[styles.cell, { flex: 0.1 }]}>{item.size || ''}</Text>
                        <Text style={[styles.cell, { flex: 0.4 }]}>{item.legend || ''}</Text>
                        <Text style={[styles.cell, { flex: 0.2 }]}>{item.displayStructure || ''}</Text>
                      </View>
                    ))}
                  </View>
                );
              }
              
              // LOOSE Section
              if (groupedItems.loose.length > 0) {
                sections.push(
                  <View key="loose-section">
                    {groupedItems.loose.map((item, idx) => (
                      <View style={styles.row} key={`loose-${idx}`}>
                        {idx === 0 && (
                          <Text style={[styles.cell, { flex: 0.2, borderRight: '1.5px solid black' }]}>
                            LOOSE
                          </Text>
                        )}
                        <Text style={[styles.cell, { flex: 0.1 }]}>{item.quantity || 0}</Text>
                        <Text style={[styles.cell, { flex: 0.1 }]}>{item.size || ''}</Text>
                        <Text style={[styles.cell, { flex: 0.4 }]}>{item.legend || ''}</Text>
                        <Text style={[styles.cell, { flex: 0.2 }]}>{item.displayStructure || ''}</Text>
                      </View>
                    ))}
                  </View>
                );
              }
              
              return sections;
            })()}
        </View>
        {/* NOTES */}
        <View style={styles.equipmentContainer}>
            <Text style={styles.equipmentTitle}>NOTES</Text>
            {
              notes.map((note, idx) => (
                <View style={styles.notesRow} key={idx}>
                  <Text>{note.text}</Text>
                  <Text style={styles.notesDate}>{formatDateTime(note.timestamp)}</Text>
                </View>
              ))
            }
        </View>
        {/* Footer */}
        <Footer pageNumber={1} totalPages={1} />
      </View>
    </Page>
  </Document>
  )
}

export default MPTOrderWorksheetPDF
