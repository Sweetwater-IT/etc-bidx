'use client'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { PDFViewer } from '@react-pdf/renderer'
import GenerateBidSummaryReactPDF from './worksheet-pdf'
import { Dispatch, SetStateAction, useMemo } from 'react'
import { 
  getAllTotals, 
  calculateEquipmentCostSummary,
  calculateTotalSignCostSummary,
  calculateRentalSummary,
  calculateLaborCostSummary,
  getEquipmentTotalsPerPhase,
  returnSignTotalsSquareFootage,
  returnSignTotalsByPhase,
  getAssociatedSignEquipment
} from '@/lib/mptRentalHelperFunctions'
import { defaultFlaggingObject } from '@/types/default-objects/defaultFlaggingObject'
import { defaultPermanentSignsObject } from '@/types/default-objects/defaultPermanentSignsObject'
import { defaultMPTObject } from '@/types/default-objects/defaultMPTObject'
import { safeNumber } from '@/lib/safe-number'
import { PrimarySign, SecondarySign } from '@/types/MPTEquipment'

interface BasicTotals {
  revenue: string
  grossProfit: string
  grossMargin: string
}

interface WorksheetDialogProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  selectedPdfType: string
  mptRental: any
  equipmentRental: any
  flagging: any
  adminData: any
  serviceWork?: any
  saleItems?: any[]
  permanentSigns?: any
}

export function WorksheetDialog ({
  open,
  onOpenChange,
  selectedPdfType,
  mptRental,
  equipmentRental,
  flagging,
  adminData,
  serviceWork,
  saleItems = [],
  permanentSigns
}:
WorksheetDialogProps) {
  // Defensive: check if required data is present
  const isDataReady = useMemo(() => {
    if (!adminData || !adminData.contractNumber) return false
    if (!adminData.county || typeof adminData.county !== 'object') return false
    // mptRental and equipmentRental can be empty but should not be undefined
    if (typeof mptRental !== 'object' || typeof equipmentRental === 'undefined')
      return false
    return true
  }, [adminData, mptRental, equipmentRental])

  // Memoized calculations for MPT totals
  const mptTotals = useMemo((): BasicTotals => {
    if (!isDataReady || !mptRental || !equipmentRental || !flagging) {
      return { revenue: '0.00', grossProfit: '0.00', grossMargin: '0.00' }
    }

    try {
      const allTotalsData = getAllTotals(
        adminData, 
        mptRental, 
        equipmentRental, 
        flagging, 
        serviceWork ?? defaultFlaggingObject, 
        saleItems, 
        permanentSigns ?? defaultPermanentSignsObject
      )

      return {
        revenue: allTotalsData.mptTotalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        grossProfit: allTotalsData.mptGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        grossMargin: allTotalsData.mptGrossMargin.toFixed(2)
      }
    } catch (error) {
      console.error('Error calculating MPT totals:', error)
      return { revenue: '0.00', grossProfit: '0.00', grossMargin: '0.00' }
    }
  }, [adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems, permanentSigns, isDataReady])

  // Memoized calculations for all totals
  const allTotals = useMemo((): BasicTotals => {
    if (!isDataReady || !mptRental || !equipmentRental || !flagging) {
      return { revenue: '0.00', grossProfit: '0.00', grossMargin: '0.00' }
    }

    try {
      const allTotalsData = getAllTotals(
        adminData, 
        mptRental, 
        equipmentRental, 
        flagging, 
        serviceWork ?? defaultFlaggingObject, 
        saleItems, 
        permanentSigns ?? defaultPermanentSignsObject
      )

      return {
        revenue: allTotalsData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        grossProfit: allTotalsData.totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        grossMargin: allTotalsData.totalGrossMargin.toFixed(2)
      }
    } catch (error) {
      console.error('Error calculating all totals:', error)
      return { revenue: '0.00', grossProfit: '0.00', grossMargin: '0.00' }
    }
  }, [adminData, mptRental, equipmentRental, flagging, serviceWork, saleItems, permanentSigns, isDataReady])

  // Memoized calculations for rental totals
  const rentalTotals = useMemo((): BasicTotals => {
    if (!equipmentRental || equipmentRental.length === 0) {
      return { revenue: '0.00', grossProfit: '0.00', grossMargin: '0.00' }
    }

    try {
      const rentalSummary = calculateRentalSummary(equipmentRental)

      return {
        revenue: rentalSummary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        grossProfit: rentalSummary.totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        grossMargin: (rentalSummary.totalGrossProfitMargin * 100).toFixed(2)
      }
    } catch (error) {
      console.error('Error calculating rental totals:', error)
      return { revenue: '0.00', grossProfit: '0.00', grossMargin: '0.00' }
    }
  }, [equipmentRental])

  // Memoized calculations for sale totals
  const saleTotals = useMemo((): BasicTotals => {
    if (!saleItems || saleItems.length === 0) {
      return { revenue: '0.00', grossProfit: '0.00', grossMargin: '0.00' }
    }

    try {
      const totalRevenue = saleItems.reduce((sum, item) => 
        sum + (item.quotePrice * (1 + (item.markupPercentage / 100)) * item.quantity), 0
      )
      const totalCost = saleItems.reduce((sum, item) => 
        sum + (item.quotePrice * item.quantity), 0
      )
      const totalGrossProfit = totalRevenue - totalCost
      const grossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0

      return {
        revenue: totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        grossProfit: totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        grossMargin: grossMargin.toFixed(2)
      }
    } catch (error) {
      console.error('Error calculating sale totals:', error)
      return { revenue: '0.00', grossProfit: '0.00', grossMargin: '0.00' }
    }
  }, [saleItems])

  // Calculate equipment totals
  const equipmentTotals = useMemo(() => {
    if (!mptRental) {
      return {
        fourFootTypeIII: 0,
        hStand: 0,
        HIVP: 0,
        sharps: 0,
        TypeXIVP: 0,
        BLights: 0,
        sandbag: 0,
        post: 0,
        sixFootWings: 0,
        metalStands: 0,
        covers: 0
      }
    }

    try {
      const totals = getEquipmentTotalsPerPhase(mptRental)
      return {
        fourFootTypeIII: totals.fourFootTypeIII.totalQuantity,
        hStand: totals.hStand.totalQuantity,
        HIVP: totals.HIVP.totalQuantity,
        sharps: totals.sharps.totalQuantity,
        TypeXIVP: totals.TypeXIVP.totalQuantity,
        BLights: totals.BLights.totalQuantity,
        sandbag: totals.sandbag.totalQuantity,
        post: totals.post.totalQuantity,
        sixFootWings: totals.sixFootWings.totalQuantity,
        metalStands: totals.metalStands.totalQuantity,
        covers: totals.covers.totalQuantity
      }
    } catch (error) {
      console.error('Error calculating equipment totals:', error)
      return {
        fourFootTypeIII: 0,
        hStand: 0,
        HIVP: 0,
        sharps: 0,
        TypeXIVP: 0,
        BLights: 0,
        sandbag: 0,
        post: 0,
        sixFootWings: 0,
        metalStands: 0,
        covers: 0
      }
    }
  }, [mptRental])

  // Calculate sign totals
  const signTotals = useMemo(() => {
    if (!mptRental) {
      return { HI: 0, DG: 0, Special: 0 }
    }

    try {
      const totals = returnSignTotalsSquareFootage(mptRental)
      return {
        HI: totals.HI.totalSquareFootage,
        DG: totals.DG.totalSquareFootage,
        Special: totals.Special.totalSquareFootage
      }
    } catch (error) {
      console.error('Error calculating sign totals:', error)
      return { HI: 0, DG: 0, Special: 0 }
    }
  }, [mptRental])

  // Calculate labor summary
  const laborSummary = useMemo(() => {
    if (!mptRental || !adminData) {
      return { ratedHours: 0, shopHours: 0, totalHours: 0 }
    }

    try {
      const laborStats = calculateLaborCostSummary(adminData, mptRental)
      return {
        ratedHours: laborStats.ratedLaborHours,
        shopHours: laborStats.nonRatedLaborHours,
        totalHours: laborStats.ratedLaborHours + laborStats.nonRatedLaborHours
      }
    } catch (error) {
      console.error('Error calculating labor summary:', error)
      return { ratedHours: 0, shopHours: 0, totalHours: 0 }
    }
  }, [mptRental, adminData])

  // Calculate discount rates
  const discountRates = useMemo(() => {
    if (!mptRental) {
      return { mptDiscount: 0, signDiscount: 0 }
    }

    try {
      const mptTotalsCalc = calculateEquipmentCostSummary(mptRental ?? defaultMPTObject)
      const signTotalsCalc = calculateTotalSignCostSummary(mptRental ?? defaultMPTObject)

      const mptDiscount = mptTotalsCalc.cost > 0 ? 1 - mptTotalsCalc.revenue / mptTotalsCalc.cost : 0
      const signTotalRevenue = signTotalsCalc.HI.revenue + signTotalsCalc.DG.revenue + signTotalsCalc.Special.revenue
      const signTotalCost = signTotalsCalc.HI.cost + signTotalsCalc.DG.cost + signTotalsCalc.Special.cost
      const signDiscount = signTotalCost > 0 ? 1 - signTotalRevenue / signTotalCost : 0

      return { mptDiscount, signDiscount }
    } catch (error) {
      console.error('Error calculating discount rates:', error)
      return { mptDiscount: 0, signDiscount: 0 }
    }
  }, [mptRental])

  // Calculate phase summary data
  const phaseSummaryData = useMemo(() => {
    if (!mptRental?.phases) {
      return { phases: [], totals: { days: 0, vp: 0, bLights: 0, cLights: 0, type3: 0, sixFootWings: 0, hStand: 0, post: 0, sandbag: 0, metalStands: 0 } }
    }

    try {
      const phases = mptRental.phases.map(phase => {
        const signTotals = returnSignTotalsByPhase(phase)
        return {
          days: safeNumber(phase.days),
          vp: safeNumber(phase.standardEquipment.HIVP.quantity) +
               safeNumber(phase.standardEquipment.TypeXIVP.quantity) +
               safeNumber(phase.standardEquipment.sharps.quantity),
          bLights: safeNumber(phase.standardEquipment.BLights.quantity),
          cLights: safeNumber(phase.standardEquipment.ACLights.quantity),
          type3: safeNumber(phase.standardEquipment.fourFootTypeIII.quantity),
          sixFootWings: safeNumber(phase.standardEquipment.sixFootWings.quantity),
          hStand: safeNumber(phase.standardEquipment.hStand.quantity),
          post: safeNumber(phase.standardEquipment.post.quantity),
          sandbag: safeNumber(phase.standardEquipment.sandbag.quantity),
          metalStands: safeNumber(phase.standardEquipment.metalStands.quantity),
          signTotals: {
            HI: signTotals.HI.totalSquareFootage,
            DG: signTotals.DG.totalSquareFootage,
            Special: signTotals.Special.totalSquareFootage
          },
          associatedEquipment: getAssociatedSignEquipment(phase)
        }
      })

      const totals = phases.reduce((acc, phase) => ({
        days: acc.days + phase.days,
        vp: acc.vp + phase.vp,
        bLights: acc.bLights + phase.bLights,
        cLights: acc.cLights + phase.cLights,
        type3: acc.type3 + phase.type3,
        sixFootWings: acc.sixFootWings + phase.sixFootWings,
        hStand: acc.hStand + phase.hStand,
        post: acc.post + phase.post,
        sandbag: acc.sandbag + phase.sandbag,
        metalStands: acc.metalStands + phase.metalStands
      }), { days: 0, vp: 0, bLights: 0, cLights: 0, type3: 0, sixFootWings: 0, hStand: 0, post: 0, sandbag: 0, metalStands: 0 })

      return { phases, totals }
    } catch (error) {
      console.error('Error calculating phase summary data:', error)
      return { phases: [], totals: { days: 0, vp: 0, bLights: 0, cLights: 0, type3: 0, sixFootWings: 0, hStand: 0, post: 0, sandbag: 0, metalStands: 0 } }
    }
  }, [mptRental])

  // Calculate sign list data
  const signListData = useMemo(() => {
    if (!mptRental?.phases) {
      return { phases: [] }
    }

    try {
      const structureMapping = {
        hStand: 'H Stand',
        none: 'None',
        fourFootTypeIII: "4' Type III",
        post: 'Post'
      }

      // Helper function to group signs
      const groupSignsByPrimary = (signs: (PrimarySign | SecondarySign)[]) => {
        const primarySigns = signs.filter(
          sign =>
            !('primarySignId' in sign) &&
            sign.quantity > 0 &&
            sign.width > 0 &&
            sign.height > 0
        ) as PrimarySign[]

        return primarySigns.map(primary => ({
          primary: {
            designation: primary.designation,
            width: primary.width,
            height: primary.height,
            quantity: primary.quantity,
            sheeting: primary.sheeting,
            associatedStructure: primary.associatedStructure,
            bLights: primary.bLights,
            cover: primary.cover
          },
          secondaries: signs.filter(
            sign =>
              'primarySignId' in sign &&
              sign.primarySignId === primary.id &&
              sign.quantity > 0 &&
              sign.width > 0 &&
              sign.height > 0
          ).map(secondary => ({
            designation: secondary.designation,
            width: secondary.width,
            height: secondary.height,
            quantity: secondary.quantity,
            sheeting: secondary.sheeting
          }))
        }))
      }

      const phases = mptRental.phases.map((phase, phaseIndex) => {
        const signGroups = groupSignsByPrimary(phase.signs)
        const phaseTotals = returnSignTotalsByPhase(phase)
        const associatedEquipment = getAssociatedSignEquipment(phase)

        return {
          phaseIndex,
          signGroups,
          phaseTotals: {
            HI: phaseTotals.HI.totalSquareFootage,
            DG: phaseTotals.DG.totalSquareFootage,
            Special: phaseTotals.Special.totalSquareFootage
          },
          structureTotals: {
            fourFootTypeIII: associatedEquipment.fourFootTypeIII,
            post: associatedEquipment.post,
            hStand: associatedEquipment.hStand
          },
          equipmentTotals: {
            BLights: associatedEquipment.BLights,
            covers: associatedEquipment.covers
          }
        }
      })

      return { phases }
    } catch (error) {
      console.error('Error calculating sign list data:', error)
      return { phases: [] }
    }
  }, [mptRental])

  // Calculate rental equipment summary
  const rentalEquipmentSummary = useMemo(() => {
    if (!equipmentRental || equipmentRental.length === 0) {
      return []
    }

    try {
      return Object.values(
        equipmentRental.reduce((acc, item) => {
          if (item.name === '') return acc

          if (!acc[item.name]) {
            acc[item.name] = {
              name: item.name,
              quantity: 0,
              months: 0
            }
          }
          acc[item.name].quantity += item.quantity
          acc[item.name].months += item.months
          return acc
        }, {} as Record<string, { name: string; quantity: number; months: number }>)
      )
    } catch (error) {
      console.error('Error calculating rental equipment summary:', error)
      return []
    }
  }, [equipmentRental])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl h-fit w-fit'>
        <DialogTitle>
          {selectedPdfType === 'estimators'
            ? 'Bid Summary - For Estimators'
            : 'Bid Summary - For Project Managers'}
        </DialogTitle>
        {open && (
          <div className='mt-4'>
            {isDataReady ? (
              <PDFViewer height={600} width={800}>
                <GenerateBidSummaryReactPDF
                  showFinancials={selectedPdfType === 'estimators'}
                  mptRental={mptRental}
                  equipmentRental={equipmentRental}
                  flagging={flagging}
                  adminData={adminData}
                  mptTotals={mptTotals}
                  allTotals={allTotals}
                  rentalTotals={rentalTotals}
                  saleTotals={saleTotals}
                  equipmentTotals={equipmentTotals}
                  signTotals={signTotals}
                  laborSummary={laborSummary}
                  discountRates={discountRates}
                  phaseSummaryData={phaseSummaryData}
                  signListData={signListData}
                  rentalEquipmentSummary={rentalEquipmentSummary as any}
                />
              </PDFViewer>
            ) : (
              <div className='flex items-center justify-center h-96 text-lg text-muted-foreground'>
                Loading worksheet data or missing required information.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}