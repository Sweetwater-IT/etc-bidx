'use client'
import React, { useEffect, useState } from 'react'
import { Page, Text, View, Document } from '@react-pdf/renderer'
import { AdminData } from '@/types/TAdminData'
import { styles } from './styles/bidSummaryPDFStyle'
import {
  MPTRentalEstimating,
  PrimarySign,
  SecondarySign
} from '@/types/MPTEquipment'
import { EquipmentRentalItem } from '@/types/IEquipmentRentalItem'
import { Flagging } from '@/types/TFlagging'
import { safeNumber } from '@/lib/safe-number'

interface BasicTotals {
  revenue: string
  grossProfit: string
  grossMargin: string
}

interface EquipmentTotals {
  fourFootTypeIII: number
  hStand: number
  HIVP: number
  sharps: number
  TypeXIVP: number
  BLights: number
  sandbag: number
  post: number
  sixFootWings: number
  metalStands: number
  covers: number
}

interface SignTotals {
  HI: number
  DG: number
  Special: number
}

interface LaborSummary {
  ratedHours: number
  shopHours: number
  totalHours: number
}

interface DiscountRates {
  mptDiscount: number
  signDiscount: number
}

interface PhaseSummaryData {
  phases: Array<{
    days: number
    vp: number
    bLights: number
    cLights: number
    type3: number
    sixFootWings: number
    hStand: number
    post: number
    sandbag: number
    metalStands: number
    signTotals: {
      HI: number
      DG: number
      Special: number
    }
    associatedEquipment: {
      fourFootTypeIII: number
      hStand: number
      post: number
      BLights: number
      covers: number
    }
  }>
  totals: {
    days: number
    vp: number
    bLights: number
    cLights: number
    type3: number
    sixFootWings: number
    hStand: number
    post: number
    sandbag: number
    metalStands: number
  }
}

interface SignListData {
  phases: Array<{
    phaseIndex: number
    signGroups: Array<{
      primary: {
        designation: string
        width: number
        height: number
        quantity: number
        sheeting: string
        associatedStructure: string
        bLights: number
        cover: boolean
      }
      secondaries: Array<{
        designation: string
        width: number
        height: number
        quantity: number
        sheeting: string
      }>
    }>
    phaseTotals: {
      HI: number
      DG: number
      Special: number
    }
    structureTotals: {
      fourFootTypeIII: number
      post: number
      hStand: number
    }
    equipmentTotals: {
      BLights: number
      covers: number
    }
  }>
}

interface Props {
  adminData: AdminData
  mptRental: MPTRentalEstimating | undefined
  equipmentRental: EquipmentRentalItem[] | undefined
  flagging: Flagging | undefined
  mptTotals: BasicTotals
  allTotals: BasicTotals
  rentalTotals: BasicTotals
  saleTotals: BasicTotals
  showFinancials: boolean
  // Pre-calculated data props
  equipmentTotals: EquipmentTotals
  signTotals: SignTotals
  laborSummary: LaborSummary
  discountRates: DiscountRates
  phaseSummaryData: PhaseSummaryData
  signListData: SignListData
  rentalEquipmentSummary: Array<{
    name: string
    quantity: number
    months: number
  }>
}

const GenerateBidSummaryReactPDF = ({
  adminData,
  mptRental,
  equipmentRental,
  flagging,
  mptTotals,
  allTotals,
  rentalTotals,
  saleTotals,
  showFinancials,
  equipmentTotals,
  signTotals,
  laborSummary,
  discountRates,
  phaseSummaryData,
  signListData,
  rentalEquipmentSummary
}: Props) => {
  // Defensive helpers
  const safeDateString = (date: Date | null | undefined) =>
    date instanceof Date && !isNaN(date.getTime())
      ? date.toLocaleDateString()
      : '-'

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
        <Text>ETC Bid Summary Worksheet</Text>
      </View>
      <View style={{ padding: 4, flex: 0.33, flexDirection: 'column' }}>
        <Text style={{ fontSize: 10 }}>Submitter: {adminData.estimator}</Text>
        <Text style={{ fontSize: 10 }}>Submission Date: {submissionDate}</Text>
      </View>
    </View>
  )

  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.label}>ECMS:</Text>
          <Text style={styles.value}>{adminData?.contractNumber || '-'}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>COUNTY:</Text>
          <Text style={styles.value}>{adminData?.county?.name || '-'}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>SR:</Text>
          <Text style={styles.value}>{adminData?.srRoute || '-'}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>LOCATION:</Text>
          <Text style={styles.value}>{adminData?.location || '-'}</Text>
        </View>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.label}>WAGE RATE:</Text>
          <Text style={styles.value}>
            $ {safeNumber(adminData?.county?.laborRate).toFixed(2)}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>START DATE:</Text>
          <Text style={styles.value}>
            {safeDateString(adminData?.startDate)}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>COMPLETION DATE:</Text>
          <Text style={styles.value}>{safeDateString(adminData?.endDate)}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>BRANCH:</Text>
          <Text style={styles.value}>{adminData?.county?.branch || ''}</Text>
        </View>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.label}>FRINGE:</Text>
          <Text style={styles.value}>
            $ {safeNumber(adminData?.county?.fringeRate).toFixed(2)}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>PROJECT DAYS:</Text>
          <Text style={styles.value}>
            {adminData?.startDate &&
            adminData?.endDate &&
            adminData.startDate instanceof Date &&
            adminData.endDate instanceof Date
              ? Math.ceil(
                  (adminData.endDate.getTime() -
                    adminData.startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>W/S DAYS:</Text>
          <Text style={styles.value}>
            {adminData?.winterStart &&
            adminData?.winterEnd &&
            adminData.winterStart instanceof Date &&
            adminData.winterEnd instanceof Date
              ? Math.ceil(
                  (adminData.winterEnd.getTime() -
                    adminData.winterStart.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : '-'}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>DBE %:</Text>
          <Text style={styles.value}>{adminData?.dbe ?? ''}%</Text>
        </View>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.label}>JOB TYPE:</Text>
          <Text style={styles.value}>MPT</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>MILES R/T:</Text>
          <Text style={styles.value}>
            {safeNumber(adminData?.owMileage) * 2}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>TRAVEL TIME R/T:</Text>
          <Text style={styles.value}>
            {safeNumber(adminData?.owTravelTimeMins) * 2}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>EMERGENCY JOB:</Text>
          <Text style={styles.value}>
            {adminData?.emergencyJob ? 'YES' : 'NO'}
          </Text>
        </View>
      </View>

      {showFinancials && <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.label}>MPT VALUE:</Text>
          <Text style={styles.value}>$ {mptTotals.revenue}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>MPT GPM%:</Text>
          <Text style={styles.value}>
            {mptTotals.grossMargin}%
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>PERM SIGNS VALUE:</Text>
          <Text style={styles.value}>
            {'-'}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>TOTAL GPM%:</Text>
          <Text style={styles.value}>
            {allTotals.grossMargin}%
          </Text>
        </View>
      </View>}
    </View>
  )

  const EquipmentSummary = () => {
    return (
      <View style={{ flexDirection: 'column' }}>
        <Text style={styles.sectionTitle}>EQUIPMENT AND MATERIAL SUMMARY</Text>
        <View style={styles.container}>
          <View style={styles.mptColumn}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnHeaderText}>MPT EQUIPMENT</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>{`4'`} TYPE III =</Text>
              <Text style={styles.quantityCell}>
                {equipmentTotals.fourFootTypeIII}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>H-STANDS =</Text>
              <Text style={styles.quantityCell}>
                {equipmentTotals.hStand}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>{`V/P'S`} =</Text>
              <Text style={styles.quantityCell}>
                {equipmentTotals.HIVP + equipmentTotals.sharps + equipmentTotals.TypeXIVP}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>B-LIGHTS =</Text>
              <Text style={styles.quantityCell}>
                {equipmentTotals.BLights}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>SANDBAGS =</Text>
              <Text style={styles.quantityCell}>
                {equipmentTotals.sandbag}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>POSTS =</Text>
              <Text style={styles.quantityCell}>
                {equipmentTotals.post}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>{`6'`} WINGS =</Text>
              <Text style={styles.quantityCell}>
                {equipmentTotals.sixFootWings}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>METAL STANDS =</Text>
              <Text style={styles.quantityCell}>
                {equipmentTotals.metalStands}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>C-LIGHTS =</Text>
              <Text style={styles.quantityCell}>
                {equipmentTotals.covers}
              </Text>
            </View>
            <View style={styles.totalStructure}>
              <Text style={styles.value}>
                STRUCTURES: {equipmentTotals.fourFootTypeIII + equipmentTotals.hStand}
              </Text>
            </View>
          </View>

          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnHeaderText}>RENTAL EQUIPMENT</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}></Text>
              <Text style={styles.rentalHeader}>QUANTITY</Text>
              <Text style={styles.rentalHeader}>MONTHS</Text>
            </View>
            {rentalEquipmentSummary.map((item, index) => (
              <View style={styles.row} key={index}>
                <Text style={styles.cell}>{item.name}</Text>
                <Text style={styles.quantityCell}>
                  {safeNumber(item.quantity)}
                </Text>
                <Text style={styles.quantityCell}>
                  {safeNumber(item.months)}
                </Text>
              </View>
            ))}

            <View style={styles.columnHeader}>
              <Text style={styles.columnHeaderText}>DISCOUNT RATES</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>MPT</Text>
              <Text style={styles.quantityCell}>
                {safeNumber(discountRates.mptDiscount * 100).toFixed(2)}%
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>SIGNS</Text>
              <Text style={styles.quantityCell}>
                {safeNumber(discountRates.signDiscount * 100).toFixed(2)}%
              </Text>
            </View>
          </View>

          <View style={styles.signsColumn}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnHeaderText}>SIGNS</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>HI SIGNS =</Text>
              <Text style={styles.quantityCell}>
                {signTotals.HI.toFixed(1)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>DG SIGNS =</Text>
              <Text style={styles.quantityCell}>
                {signTotals.DG.toFixed(1)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>SPECIAL SIGNS =</Text>
              <Text style={styles.quantityCell}>
                {signTotals.Special.toFixed(1)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>POST MT TYPE B =</Text>
              <Text style={styles.quantityCell}>-</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>RESET TYPE B =</Text>
              <Text style={styles.quantityCell}>-</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>REMOVE TYPE B =</Text>
              <Text style={styles.quantityCell}>-</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>POST MT TYPE F =</Text>
              <Text style={styles.quantityCell}>-</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>RESET TYPE F =</Text>
              <Text style={styles.quantityCell}>-</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>REMOVE TYPE F =</Text>
              <Text style={styles.quantityCell}>-</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const JobSummary = () => {
    return (
      <View style={styles.container}>
        <View>
          <View style={styles.columnHeader}>
            <Text style={styles.columnHeaderText}>LABOR SUMMARY</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.cell}>RATED = {laborSummary.ratedHours.toFixed(1)}</Text>
            <Text style={styles.cell}>SHOP = {laborSummary.shopHours.toFixed(1)}</Text>
            <Text style={styles.cell}>PERM. SIGNS = 0</Text>
            <Text style={styles.summaryTotalRow}>TOTAL = {laborSummary.totalHours.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.jobSummaryTable}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnHeaderText}>JOB SUMMARY</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryCell}>REVENUE</Text>
            <Text style={styles.summaryCell}>GROSS PROFIT</Text>
            <Text style={styles.summaryCellLast}>% MARGIN</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryCell}>
              MPT REV = ${mptTotals.revenue}
            </Text>
            <Text style={styles.summaryCell}>
              ${mptTotals.grossProfit}
            </Text>
            <Text style={styles.summaryCellLast}>
              {mptTotals.grossMargin}%
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryCell}>
              RENTAL REV = ${rentalTotals.revenue}
            </Text>
            <Text style={styles.summaryCell}>
              ${rentalTotals.grossProfit}
            </Text>
            <Text style={styles.summaryCellLast}>
              {rentalTotals.grossMargin}%
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryCell}>
              PERM REV = $0
            </Text>
            <Text style={styles.summaryCell}>
              $0
            </Text>
            <Text style={styles.summaryCellLast}>
              0%
            </Text>
          </View>
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryCell}>
              TOTAL REV = ${allTotals.revenue}
            </Text>
            <Text style={styles.summaryCell}>
              ${allTotals.grossProfit}
            </Text>
            <Text style={styles.summaryCell}>
              {allTotals.grossMargin}%
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryCell}>
              FLAGGING = {flagging && flagging?.personnel > 0 ? 'YES' : 'NO'}
            </Text>
            <Text style={styles.summaryCell}>
            </Text>
            <Text style={styles.summaryCellLast}>
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryCell}>
              EQUIPMENT SALE REV = ${saleTotals.revenue}
            </Text>
            <Text style={styles.summaryCell}>
              ${saleTotals.grossProfit}
            </Text>
            <Text style={styles.summaryCellLast}>
              {saleTotals.grossMargin}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const PhaseSummary = () => {
    return (
      <View>
        <Text style={styles.sectionTitle}>PHASE SUMMARY</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.phaseSummaryFirstCell}>Equipment</Text>
          <Text style={styles.phaseSummaryCell}>Days</Text>
          <Text style={styles.phaseSummaryCell}>VP</Text>
          <View style={styles.column}>
            <Text style={{ fontSize: 8, marginLeft: 4 }}>Lights</Text>
            <View style={{ flexDirection: 'row', marginTop: 2 }}>
              <Text style={styles.phaseSummaryCell}>B</Text>
              <Text style={styles.phaseSummaryCell}>C</Text>
            </View>
          </View>
          <Text style={styles.phaseSummaryCell}>Type 3</Text>
          <Text style={styles.phaseSummaryCell}>{`6'`} Wings</Text>
          <Text style={styles.phaseSummaryCell}>H Stand</Text>
          <Text style={styles.phaseSummaryCell}>Post</Text>
          <Text style={styles.phaseSummaryCell}>Sandbag</Text>
          <Text style={styles.phaseSummaryCell}>MS</Text>
        </View>

        {phaseSummaryData.phases.map((phase, index) => (
          <View key={index} style={styles.summaryRow}>
            <Text style={styles.phaseSummaryFirstCell}>Phase {index + 1}</Text>
            <Text style={styles.phaseSummaryCell}>{phase.days}</Text>
            <Text style={styles.phaseSummaryCell}>{phase.vp}</Text>
            <Text style={{ flex: 0.5, fontSize: 8 }}>{phase.bLights}</Text>
            <Text style={{ flex: 0.5, fontSize: 8 }}>{phase.cLights}</Text>
            <Text style={styles.phaseSummaryCell}>{phase.type3}</Text>
            <Text style={styles.phaseSummaryCell}>{phase.sixFootWings}</Text>
            <Text style={styles.phaseSummaryCell}>{phase.hStand}</Text>
            <Text style={styles.phaseSummaryCell}>{phase.post}</Text>
            <Text style={styles.phaseSummaryCell}>{phase.sandbag}</Text>
            <Text style={styles.phaseSummaryCell}>{phase.metalStands}</Text>
          </View>
        ))}

        <View style={[styles.summaryTotalRow]}>
          <Text style={[styles.phaseSummaryFirstCell, { fontWeight: 'bold' }]}>
            TOTALS
          </Text>
          <Text style={styles.phaseSummaryCell}>{phaseSummaryData.totals.days}</Text>
          <Text style={styles.phaseSummaryCell}>{phaseSummaryData.totals.vp}</Text>
          <Text style={{ flex: 0.5, fontSize: 8 }}>{phaseSummaryData.totals.bLights}</Text>
          <Text style={{ flex: 0.5, fontSize: 8 }}>{phaseSummaryData.totals.cLights}</Text>
          <Text style={styles.phaseSummaryCell}>{phaseSummaryData.totals.type3}</Text>
          <Text style={styles.phaseSummaryCell}>{phaseSummaryData.totals.sixFootWings}</Text>
          <Text style={styles.phaseSummaryCell}>{phaseSummaryData.totals.hStand}</Text>
          <Text style={styles.phaseSummaryCell}>{phaseSummaryData.totals.post}</Text>
          <Text style={styles.phaseSummaryCell}>{phaseSummaryData.totals.sandbag}</Text>
          <Text style={styles.phaseSummaryCell}>{phaseSummaryData.totals.metalStands}</Text>
        </View>
      </View>
    )
  }

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

    return (
      <View>
        <Text style={styles.sectionTitle}>SIGN LIST</Text>
        <View style={styles.container}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={[styles.summaryRow, { backgroundColor: '#F8F9FA' }]}>
              {columns.map((col, index) => (
                <Text
                  key={index}
                  style={[styles.phaseSummaryCell, { flex: col.flex }]}
                >
                  {col.label}
                </Text>
              ))}
            </View>

            {/* Phase Groups */}
            {signListData.phases.map((phaseData) => (
              <React.Fragment key={phaseData.phaseIndex}>
                {/* Phase Header */}
                <View
                  style={[styles.summaryRow, { backgroundColor: '#E4E4E4' }]}
                >
                  <Text style={[styles.phaseSummaryCell, { flex: 12 }]}>
                    Phase {phaseData.phaseIndex + 1}
                  </Text>
                </View>

                {/* Signs grouped by primary */}
                {phaseData.signGroups.map((group, groupIndex) => (
                  <React.Fragment key={groupIndex}>
                    {/* Primary Sign */}
                    <View style={styles.summaryRow}>
                      <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                        {group.primary.designation}
                      </Text>
                      <Text style={[styles.phaseSummaryCell, { flex: 1 }]}>
                        {Number(group.primary.width).toFixed(1)} in.
                      </Text>
                      <Text style={[styles.phaseSummaryCell, { flex: 1 }]}>
                        {Number(group.primary.height).toFixed(1)} in.
                      </Text>
                      <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                        {group.primary.quantity}
                      </Text>
                      <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                        {group.primary.sheeting}
                      </Text>
                      <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                        {structureMapping[group.primary.associatedStructure as keyof typeof structureMapping]}
                      </Text>
                      <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                        {group.primary.bLights}
                      </Text>
                      <Text style={[styles.phaseSummaryCell, { flex: 1 }]}>
                        {group.primary.cover ? group.primary.quantity : 0}
                      </Text>
                    </View>

                    {/* Secondary Signs */}
                    {group.secondaries.map((secondary, secondaryIndex) => (
                      <View key={secondaryIndex} style={[styles.summaryRow]}>
                        <Text
                          style={[
                            styles.phaseSummaryCell,
                            { flex: 1.5 },
                            { marginLeft: 20 }
                          ]}
                        >
                          {secondary.designation}
                        </Text>
                        <Text
                          style={[
                            styles.phaseSummaryCell,
                            { flex: 1 },
                            { marginLeft: -20 }
                          ]}
                        >
                          {Number(secondary.width).toFixed(1)} in.
                        </Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1 }]}>
                          {Number(secondary.height).toFixed(1)} in.
                        </Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                          {secondary.quantity}
                        </Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                          {secondary.sheeting}
                        </Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                          -
                        </Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                          -
                        </Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1 }]}>
                          -
                        </Text>
                      </View>
                    ))}
                  </React.Fragment>
                ))}

                {/* Phase Totals */}
                <View style={[styles.summaryTotalRow]}>
                  <Text style={[styles.phaseSummaryCell, { flex: 3.5 }]}>
                    Phase {phaseData.phaseIndex + 1} Totals
                  </Text>
                  <Text style={[styles.phaseSummaryCell, { flex: 4.5 }]}>
                    HI: {phaseData.phaseTotals.HI.toFixed(1)} sq. ft | DG: {phaseData.phaseTotals.DG.toFixed(1)} sq. ft | Special: {phaseData.phaseTotals.Special.toFixed(1)} sq. ft
                  </Text>
                  <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                    {phaseData.equipmentTotals.BLights}
                  </Text>
                  <Text style={[styles.phaseSummaryCell, { flex: 1 }]}>
                    {phaseData.equipmentTotals.covers}
                  </Text>
                </View>

                <View style={[styles.summaryTotalRow]}>
                  <Text style={[styles.phaseSummaryCell, { flex: 3.5 }]}>
                    Phase {phaseData.phaseIndex + 1} Structure Totals
                  </Text>
                  <Text style={[styles.phaseSummaryCell, { flex: 4.5 }]}>
                    4&apos; Type III: {phaseData.structureTotals.fourFootTypeIII} | Post: {phaseData.structureTotals.post} | H Stand: {phaseData.structureTotals.hStand}
                  </Text>
                  <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]} />
                  <Text style={[styles.phaseSummaryCell, { flex: 1 }]} />
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    )
  }

  const Spacer = () => {
    return (
      <View
        style={{
          height: 10,
          backgroundColor: '#00000080',
          borderTop: '1px solid black',
          borderBottom: '1px solid black'
        }}
      ></View>
    )
  }

  const Footer = ({
    pageNumber,
    totalPages
  }: {
    pageNumber: number
    totalPages: number
  }) => (
    <View
      style={[styles.container, { marginHorizontal: 10, marginTop: 'auto' }]}
    >
      <Text style={{ flex: 0.33, textAlign: 'left', fontSize: 8 }}>
        ETC Form 61
      </Text>
      <Text style={{ flex: 0.33, textAlign: 'center', fontSize: 8 }}>
        v1.01 Jan/2025
      </Text>
      <Text style={{ flex: 0.33, textAlign: 'right', fontSize: 8 }}>
        Page {pageNumber} of {totalPages}
      </Text>
    </View>
  )

  return (
    <Document title={`Bid Summary ${adminData.contractNumber}`}>
      <Page size='A4' style={styles.page}>
        <View style={styles.mainContainer}>
          <Title />
          <Header />
          <Spacer />
          <EquipmentSummary />
          <Spacer />
          {showFinancials && <JobSummary />}
          <Spacer />
          <PhaseSummary />
        </View>
        <Footer pageNumber={1} totalPages={2} />
      </Page>
      <Page size='A4' style={styles.page}>
        <View style={styles.mainContainer}>
          <SignList />
        </View>
        <Footer pageNumber={2} totalPages={2} />
      </Page>
    </Document>
  )
}

export default GenerateBidSummaryReactPDF