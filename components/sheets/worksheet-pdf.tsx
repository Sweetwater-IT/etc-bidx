'use client'
import React from 'react';
import { Page, Text, View, Document } from '@react-pdf/renderer';
import { AdminData } from '@/types/TAdminData';
import { styles } from './styles/bidSummaryPDFStyle';
import { AssociatedSignStructures, MPTRentalEstimating, PrimarySign, SecondarySign } from '@/types/MPTEquipment';
import { EquipmentRentalItem } from '@/types/IEquipmentRentalItem';
import { Flagging } from '@/types/TFlagging';
import { safeNumber } from '@/lib/safe-number';
import { getAssociatedSignEquipment, calculateEquipmentCostSummary, calculateLaborCostSummary, calculateTotalSignCostSummary, getEquipmentTotalsPerPhase, returnPhaseTotals, returnSignTotalsByPhase, returnSignTotalsSquareFootage } from '@/lib/mptRentalHelperFunctions';
import { defaultMPTObject } from '@/types/default-objects/defaultMPTObject';


interface Props {
  adminData: AdminData,
  mptRental: MPTRentalEstimating | undefined,
  equipmentRental: EquipmentRentalItem[] | undefined,
  flagging: Flagging | undefined,
  mptTotals: BasicTotals,
  allTotals: BasicTotals,
  rentalTotals: BasicTotals,
  flaggingTotals: BasicTotals,
  saleTotals: BasicTotals
  showFinancials: boolean
}

interface BasicTotals {
  revenue: string;
  grossProfit: string;
  grossMargin: string;
}

//below the bottom black line: form number on bottom left, ETC Form 61, in the center the document version, v1.01 Jan/2025, page numbers on right,

const GenerateBidSummaryReactPDF = ({ adminData, mptRental, equipmentRental, flagging, mptTotals, allTotals, rentalTotals, flaggingTotals, saleTotals, showFinancials }: Props) => {

  const Title = () => (
    <View style={{ flexDirection: 'row' }} >
      <View style={{ flex: .66, borderRight: '1px solid black' }}>
        <Text>ETC Bid Summary Worksheet</Text>
      </View>
      <View style={{ padding: 4, flex: .33, flexDirection: 'column' }}>
        <Text style={{ fontSize: 10 }}>Submitter: {adminData.estimator}</Text>
        <Text style={{ fontSize: 10 }}>Submission Date: {new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        })}</Text>
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
          <Text style={styles.value}>{adminData?.county.name || '-'}</Text>
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
          <Text style={styles.value}>$ {adminData?.county.laborRate || '0.00'}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>START DATE:</Text>
          <Text style={styles.value}>
            {adminData?.startDate ? adminData.startDate.toLocaleDateString() : '-'}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>COMPLETION DATE:</Text>
          <Text style={styles.value}>
            {adminData?.endDate ? adminData.endDate.toLocaleDateString() : '-'}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>BRANCH:</Text>
          <Text style={styles.value}>
            {adminData?.county.branch ?? ''}
          </Text>
        </View>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.label}>FRINGE:</Text>
          <Text style={styles.value}>$ {adminData?.county.fringeRate || '0.00'}</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>PROJECT DAYS:</Text>
          <Text style={styles.value}>
            {adminData.startDate && adminData.endDate ? Math.ceil((adminData.endDate.getTime() - adminData.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>W/S DAYS:</Text>
          <Text style={styles.value}>
            {adminData?.winterStart && adminData?.winterEnd ? Math.ceil((adminData.winterEnd.getTime() - adminData.winterStart.getTime()) / (1000 * 60 * 60 * 24)) : '-'}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>DBE %:</Text>
          <Text style={styles.value}>
            {adminData?.dbe ?? ''}%
          </Text>
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
            {safeNumber((adminData?.owMileage ?? 0) * 2)}
          </Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.label}>TRAVEL TIME R/T:</Text>
          <Text style={styles.value}>
            {safeNumber((adminData?.owTravelTimeMins ?? 0) * 2)}
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
  );

  const EquipmentSummary = () => {
    const mptTotals = calculateEquipmentCostSummary(mptRental ?? defaultMPTObject)
    const signTotals = calculateTotalSignCostSummary(mptRental ?? defaultMPTObject)

    const mptDiscount = mptTotals.cost > 0 ? 1 - (mptTotals.revenue / mptTotals.cost) : 0
    const signTotalRevenue = signTotals.HI.revenue + signTotals.DG.revenue + signTotals.Special.revenue
    const signTotalCost = signTotals.HI.cost + signTotals.DG.cost + signTotals.Special.cost
    const signDiscount = signTotalCost > 0 ? 1 - (signTotalRevenue / signTotalCost) : 0
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
                {mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).fourFootTypeIII.totalQuantity)}
              </Text>
            </View>
            <View
              style={styles.row}>
              <Text style={styles.cell}>H-STANDS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).hStand.totalQuantity)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>{`V/P'S`} =</Text>
              <Text style={styles.quantityCell}>
                {mptRental && (safeNumber(getEquipmentTotalsPerPhase(mptRental).HIVP.totalQuantity) + safeNumber(getEquipmentTotalsPerPhase(mptRental).sharps.totalQuantity)
                + safeNumber(getEquipmentTotalsPerPhase(mptRental).TypeXIVP.totalQuantity))}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>B-LIGHTS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).BLights.totalQuantity)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>SANDBAGS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).sandbag.totalQuantity)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>POSTS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).post.totalQuantity)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>{`6'`} WINGS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).sixFootWings.totalQuantity)}
              </Text>
            </View>
            {/* <View style={styles.row}>
              <Text style={styles.cell}>A/C LIGHTS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).ACLights.totalQuantity)}
              </Text>
            </View> */}
            <View style={styles.row}>
              <Text style={styles.cell}>METAL STANDS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).metalStands.totalQuantity)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>C-LIGHTS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental && safeNumber(getEquipmentTotalsPerPhase(mptRental).covers.totalQuantity)}
              </Text>
            </View>
            <View style={styles.totalStructure}>
              <Text style={styles.value}>STRUCTURES: {mptRental ? safeNumber((getEquipmentTotalsPerPhase(mptRental).fourFootTypeIII.totalQuantity + getEquipmentTotalsPerPhase(mptRental).hStand.totalQuantity)) : '-'}</Text>
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
            {equipmentRental && Object.values(
              equipmentRental.reduce((acc, item) => {
                if (item.name === '') return acc;

                if (!acc[item.name]) {
                  acc[item.name] = {
                    name: item.name,
                    quantity: 0,
                    months: 0
                  };
                }
                acc[item.name].quantity += item.quantity;
                acc[item.name].months += item.months;
                return acc;
              }, {} as Record<string, { name: string; quantity: number; months: number }>)
            ).map((item, index) => (
              <View style={styles.row} key={index}>
                <Text style={styles.cell}>{item.name}</Text>
                <Text style={styles.quantityCell}>{safeNumber(item.quantity)}</Text>
                <Text style={styles.quantityCell}>{safeNumber(item.months)}</Text>
              </View>
            ))}

            <View style={styles.columnHeader}>
              <Text style={styles.columnHeaderText}>DISCOUNT RATES</Text>
            </View>
            {/* const mptDiscount = mptTotals.cost > 0 ? 1 - (mptTotals.revenue / mptTotals.cost) : 0
    const signTotalRevenue = signTotals.HI.revenue + signTotals.DG.revenue + signTotals.Special.revenue
    const signTotalCost = signTotals.HI.cost + signTotals.DG.cost + signTotals.Special.cost
    const signDiscount = signTotalCost > 0 ? 1 - (signTotalRevenue / signTotalCost) : 0 */}
            <View style={styles.row}>
              <Text style={styles.cell}>MPT</Text>
              <Text style={styles.quantityCell}>{safeNumber(mptDiscount * 100).toFixed(2)}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>SIGNS</Text>
              <Text style={styles.quantityCell}>{safeNumber(signDiscount * 100).toFixed(2)}%</Text>
            </View>
          </View>

          <View style={styles.signsColumn}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnHeaderText}>SIGNS</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>HI SIGNS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental ? returnSignTotalsSquareFootage(mptRental).HI.totalSquareFootage.toFixed(1) : '-'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>DG SIGNS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental ? returnSignTotalsSquareFootage(mptRental).DG.totalSquareFootage.toFixed(1) : '-'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>SPECIAL SIGNS =</Text>
              <Text style={styles.quantityCell}>
                {mptRental ? returnSignTotalsSquareFootage(mptRental).Special.totalSquareFootage.toFixed(1) : '-'}
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
  };

  const JobSummary = () => {

    return (
      <View style={styles.container}>
        <View>
          <View style={styles.columnHeader}>
            <Text style={styles.columnHeaderText}>LABOR SUMMARY</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.cell}>RATED = {mptRental ? safeNumber(calculateLaborCostSummary(adminData, mptRental).ratedLaborHours).toFixed(1) : '-'}</Text>
            <Text style={styles.cell}>SHOP = {mptRental ? safeNumber(calculateLaborCostSummary(adminData, mptRental).nonRatedLaborHours).toFixed(1) : '-'}</Text>
            <Text style={styles.cell}>PERM. SIGNS = 0</Text>
            <Text style={styles.summaryTotalRow}>TOTAL = {mptRental ? (safeNumber(calculateLaborCostSummary(adminData, mptRental).nonRatedLaborHours) + safeNumber(calculateLaborCostSummary(adminData, mptRental).ratedLaborHours)).toFixed(1) : '-'}</Text>
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
    const getTotals = () => {
      if (!mptRental?.phases) return {
        days: 0,
        vp: 0,
        bLights: 0,
        cLights: 0,
        type3: 0,
        sixFootWings: 0,
        hStand: 0,
        post: 0,
        sandbag: 0,
        wings: 0,
        metalStands: 0,
        hi: 0,
        dg: 0,
        special: 0
      };

      return mptRental.phases.reduce((acc, phase) => {
        const signTotals = returnSignTotalsByPhase(phase)

        return {
          days: acc.days + safeNumber(phase.days),
          vp: acc.vp + safeNumber(phase.standardEquipment.HIVP.quantity) + safeNumber(phase.standardEquipment.TypeXIVP.quantity) +
          safeNumber(phase.standardEquipment.sharps.quantity),
          bLights: acc.bLights + safeNumber(phase.standardEquipment.BLights.quantity),
          cLights: acc.cLights + safeNumber(phase.standardEquipment.ACLights.quantity),
          type3: acc.type3 + safeNumber(phase.standardEquipment.fourFootTypeIII.quantity),
          hStand: acc.hStand + safeNumber(phase.standardEquipment.hStand.quantity),
          post: acc.post + safeNumber(phase.standardEquipment.post.quantity),
          sandbag: acc.sandbag + safeNumber(phase.standardEquipment.sandbag.quantity),
          metalStands: acc.metalStands + safeNumber(phase.standardEquipment.metalStands.quantity),
          sixFootWings: acc.sixFootWings + safeNumber(phase.standardEquipment.sixFootWings.quantity),
          hi: signTotals.HI.totalSquareFootage,
          dg: signTotals.DG.totalSquareFootage,
          special: signTotals.Special.totalSquareFootage
        };
      }, {
        days: 0,
        vp: 0,
        bLights: 0,
        cLights: 0,
        type3: 0,
        hStand: 0,
        post: 0,
        sandbag: 0,
        metalStands: 0,
        sixFootWings: 0,
        hi: 0,
        dg: 0,
        special: 0
      });
    };

    const rentalItemTotals = equipmentRental?.reduce((acc, item) => {
      switch (item.name) {
        case 'TMA':
          acc.tma += item.quantity;
          break;
        case 'Message Board':
          acc.messageBoard += item.quantity;
          break;
        case 'Arrow Board':
          acc.arrowBoard += item.quantity;
          break;
        case 'Speed Trailer':
          acc.speedTrailer += item.quantity;
          break;
      }
      return acc;  // Need to return the accumulator
    }, { tma: 0, messageBoard: 0, arrowBoard: 0, speedTrailer: 0 });
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
          {/* <Text style={styles.phaseSummaryCell}>TMA</Text>
          <Text style={styles.phaseSummaryCell}>AB</Text>
          <Text style={styles.phaseSummaryCell}>MB</Text>
          <Text style={styles.phaseSummaryCell}>ST</Text> */}
        </View>

        {mptRental?.phases.map((phase, index) => (
          <View key={index} style={styles.summaryRow}>
            <Text style={styles.phaseSummaryFirstCell}>Phase {index + 1}</Text>
            <Text style={styles.phaseSummaryCell}>{safeNumber(phase.days)}</Text>
            <Text style={styles.phaseSummaryCell}>
              {safeNumber(phase.standardEquipment.HIVP.quantity) + safeNumber(phase.standardEquipment.TypeXIVP.quantity) + safeNumber(phase.standardEquipment.sixFootWings.quantity)}
            </Text>
            <Text style={{ flex: .5, fontSize: 8 }}>
              {safeNumber(phase.standardEquipment.BLights.quantity)}
            </Text>
            <Text style={{ flex: .5, fontSize: 8 }}>
              {safeNumber(phase.standardEquipment.ACLights.quantity)}
            </Text>
            <Text style={styles.phaseSummaryCell}>
              {safeNumber(phase.standardEquipment.fourFootTypeIII.quantity)}
            </Text>
            <Text style={styles.phaseSummaryCell}>
              {safeNumber(phase.standardEquipment.sixFootWings.quantity)}
            </Text>
            <Text style={styles.phaseSummaryCell}>
              {safeNumber(phase.standardEquipment.hStand.quantity)}
            </Text>
            <Text style={styles.phaseSummaryCell}>
              {safeNumber(phase.standardEquipment.post.quantity)}
            </Text>
            <Text style={styles.phaseSummaryCell}>
              {safeNumber(phase.standardEquipment.sandbag.quantity)}
            </Text>
            <Text style={styles.phaseSummaryCell}>
              {safeNumber(phase.standardEquipment.metalStands.quantity)}
            </Text>
            
            {
            //No longer display rental items by phase
            /* <Text style={styles.phaseSummaryCell}>
              {equipmentRental?.filter(item => item.name === 'TMA' && item.phase === index + 1)
                .reduce((acc, item) => acc + item.quantity, 0)}
            </Text>
            <Text style={styles.phaseSummaryCell}>
              {equipmentRental?.filter(item => item.name === 'Arrow Board' && item.phase === index + 1).reduce((acc, item) => acc + item.quantity, 0)}
            </Text>
            <Text style={styles.phaseSummaryCell}>
              {equipmentRental?.filter(item => item.name === 'Message Board' && item.phase === index + 1).reduce((acc, item) => acc + item.quantity, 0)}
            </Text>
            <Text style={styles.phaseSummaryCell}>
              {equipmentRental?.filter(item => item.name === 'Speed Trailer' && item.phase === index + 1).reduce((acc, item) => acc + item.quantity, 0)}
            </Text> */}
          </View>
        ))}

        <View style={[styles.summaryTotalRow]}>
          <Text style={[styles.phaseSummaryFirstCell, { fontWeight: 'bold' }]}>TOTALS</Text>
          <Text style={styles.phaseSummaryCell}>{getTotals().days}</Text>
          <Text style={styles.phaseSummaryCell}>{getTotals().vp}</Text>
          <Text style={{ flex: .5, fontSize: 8 }}>{getTotals().bLights}</Text>
          <Text style={{ flex: .5, fontSize: 8 }}>{getTotals().cLights}</Text>
          <Text style={styles.phaseSummaryCell}>{getTotals().type3}</Text>
          <Text style={styles.phaseSummaryCell}>{getTotals().sixFootWings}</Text>
          <Text style={styles.phaseSummaryCell}>{getTotals().hStand}</Text>
          <Text style={styles.phaseSummaryCell}>{getTotals().post}</Text>
          <Text style={styles.phaseSummaryCell}>{getTotals().sandbag}</Text>
          <Text style={styles.phaseSummaryCell}>{getTotals().metalStands}</Text>
          {/* <Text style={styles.phaseSummaryCell}>{rentalItemTotals?.tma}</Text>
          <Text style={styles.phaseSummaryCell}>{rentalItemTotals?.arrowBoard}</Text>
          <Text style={styles.phaseSummaryCell}>{rentalItemTotals?.messageBoard}</Text>
          <Text style={styles.phaseSummaryCell}>{rentalItemTotals?.speedTrailer}</Text> */}
        </View>
      </View>
    );
  };

  const SignList = () => {
    const columns = [
      { label: 'Designation', flex: 1.5 },
      { label: 'Width', flex: 1 },
      { label: 'Height', flex: 1 },
      { label: 'Quantity', flex: 1.5 },
      { label: 'Sheeting', flex: 1.5 },
      { label: 'Structure', flex: 1.5 },
      { label: 'B Lights', flex: 1.5 },
      // { label: 'A/C Lights', flex: 1.5 },
      { label: 'Covers', flex: 1 }
    ];

    const structureMapping = {
      hStand: 'H Stand',
      none: 'None',
      fourFootTypeIII: 'Four Foot Type III',
      post: 'Post'
    };

    // Helper function to group signs
    const groupSignsByPrimary = (signs: (PrimarySign | SecondarySign)[]) => {
      const primarySigns = signs.filter(sign =>
        !('primarySignId' in sign) && sign.quantity > 0 && sign.width > 0 && sign.height > 0
      ) as PrimarySign[];

      return primarySigns.map(primary => ({
        primary,
        secondaries: signs.filter(sign =>
          'primarySignId' in sign &&
          sign.primarySignId === primary.id &&
          sign.quantity > 0 &&
          sign.width > 0 &&
          sign.height > 0
        ) as SecondarySign[]
      }));
    };

    return (
      <View>
        <Text style={styles.sectionTitle}>SIGN LIST</Text>
        <View style={styles.container}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={[styles.summaryRow, { backgroundColor: '#F8F9FA' }]}>
              {columns.map((col, index) => (
                <Text key={index} style={[styles.phaseSummaryCell, { flex: col.flex }]}>
                  {col.label}
                </Text>
              ))}
            </View>

            {/* Phase Groups */}
            {mptRental?.phases.map((phase, phaseIndex) => (
              <React.Fragment key={phaseIndex}>
                {/* Phase Header */}
                <View style={[styles.summaryRow, { backgroundColor: '#E4E4E4' }]}>
                  <Text style={[styles.phaseSummaryCell, { flex: 12 }]}>
                    Phase {phaseIndex + 1}
                  </Text>
                </View>

                {/* Signs grouped by primary */}
                {groupSignsByPrimary(phase.signs).map((group, groupIndex) => (
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
                        {structureMapping[group.primary.associatedStructure as AssociatedSignStructures]}
                      </Text>
                      <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                        {group.primary.bLights}
                      </Text>
                      {/* <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                        {group.primary.aLights}
                      </Text> */}
                      <Text style={[styles.phaseSummaryCell, { flex: 1 }]}>
                        {group.primary.covers}
                      </Text>
                    </View>

                    {/* Secondary Signs */}
                    {group.secondaries.map((secondary, secondaryIndex) => (
                      <View key={secondaryIndex} style={[styles.summaryRow]}>
                        <Text style={[styles.phaseSummaryCell, { flex: 1.5 }, { marginLeft: 20 }]}>
                          {secondary.designation}
                        </Text>
                        <Text style={[styles.phaseSummaryCell, { flex: 1 }, { marginLeft: -20 }]}>
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

                {/* Phase Totals remain the same */}
                <View style={[styles.summaryTotalRow]}>
                  <Text style={[styles.phaseSummaryCell, { flex: 3.5 }]}>
                    Phase {phaseIndex + 1} Totals
                  </Text>
                  <Text style={[styles.phaseSummaryCell, { flex: 4.5 }]}>
                    HI: {returnSignTotalsByPhase(phase).HI.totalSquareFootage.toFixed(1)} sq. ft |
                    DG: {returnSignTotalsByPhase(phase).DG.totalSquareFootage.toFixed(1)} sq. ft |
                    Special: {returnSignTotalsByPhase(phase).Special.totalSquareFootage.toFixed(1)} sq. ft
                  </Text>
                  <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                    {getAssociatedSignEquipment(phase).bLights}
                  </Text>
                  {/* <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]}>
                    {getAssociatedSignEquipment(phase).acLights}
                  </Text> */}
                  <Text style={[styles.phaseSummaryCell, { flex: 1 }]}>
                    {getAssociatedSignEquipment(phase).cover}
                  </Text>
                </View>

                <View style={[styles.summaryTotalRow]}>
                  <Text style={[styles.phaseSummaryCell, { flex: 3.5 }]}>
                    Phase {phaseIndex + 1} Structure Totals
                  </Text>
                  <Text style={[styles.phaseSummaryCell, { flex: 4.5 }]}>
                    Four Foot Type III: {getAssociatedSignEquipment(phase).type3} |
                    Post: {getAssociatedSignEquipment(phase).post} |
                    H Stand: {getAssociatedSignEquipment(phase).hStand}
                  </Text>
                  <Text style={[styles.phaseSummaryCell, { flex: 1.5 }]} />
                  <Text style={[styles.phaseSummaryCell, { flex: 1 }]} />
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const Spacer = () => {
    return <View style={{ height: 10, backgroundColor: '#00000080', borderTop: '1px solid black', borderBottom: '1px solid black' }}></View>
  }

  const Footer = ({ pageNumber, totalPages }: { pageNumber: number, totalPages: number }) => (
    <View style={[styles.container, { marginHorizontal: 10, marginTop: 'auto' }]}>
      <Text style={{ flex: .33, textAlign: 'left', fontSize: 8 }}>ETC Form 61</Text>
      <Text style={{ flex: .33, textAlign: 'center', fontSize: 8 }}>v1.01 Jan/2025</Text>
      <Text style={{ flex: .33, textAlign: 'right', fontSize: 8 }}>
        Page {pageNumber} of {totalPages}
      </Text>
    </View>
  );

  return (
    <Document title={`Bid Summary ${adminData.contractNumber}`}>
      <Page size="A4" style={styles.page}>
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
      <Page size="A4" style={styles.page}>
        <View style={styles.mainContainer}>
          <SignList />
        </View>
        <Footer pageNumber={2} totalPages={2} />
      </Page>
    </Document>
  );
};

export default GenerateBidSummaryReactPDF;