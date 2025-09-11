'use client'
import { getNonRatedHoursPerPhase, getRatedHoursPerPhase } from '@/lib/mptRentalHelperFunctions'
import { safeNumber } from '@/lib/safe-number'
import { Phase } from '@/types/MPTEquipment'
import React, { useMemo } from 'react'

export const TripAndLaborSummary = ({
  phase,
  phaseIndex,
  adminData,
  mptRental
}: {
  phase: Phase
  phaseIndex: number
  adminData: any
  mptRental: any
}) => {
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || Number.isNaN(value)) {
      return '$0.00'
    }
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  // Memoize cost calculations
  const {
    mobilizationCost,
    fuelCost,
    truckAndFuelCost,
    baseTrips,
    totalTrips,
    ratedHours,
    nonRatedHours,
  } = useMemo(() => {
    // Safely access equipment quantities from phase.standardEquipment
    const fourFootTypeIIIQuantity = phase.standardEquipment.fourFootTypeIII?.quantity || 0;
    const sixFootWingsQuantity = phase.standardEquipment.sixFootWings?.quantity || 0; // Included as per your code

    // Calculate baseTrips based on equipment
    const baseTrips = Math.ceil((fourFootTypeIIIQuantity) / 30);

    // Add additional trips from phase.maintenanceTrips
    const additionalTrips = safeNumber(phase.maintenanceTrips);
    const totalTrips = baseTrips + additionalTrips;

    const rated = getRatedHoursPerPhase(phase);
    const nonRated = getNonRatedHoursPerPhase(adminData, phase);

    const mobilization = (phase.numberTrucks || 0) * totalTrips * (mptRental?.dispatchFee || 0);
    const fuel =
      (((phase.numberTrucks || 0) * totalTrips * 2 * (adminData?.owMileage ?? 0)) /
        (mptRental?.mpgPerTruck || 1)) *
      (adminData?.fuelCostPerGallon ?? 0);

    return {
      mobilizationCost: mobilization,
      fuelCost: fuel,
      truckAndFuelCost: mobilization + fuel,
      baseTrips,
      totalTrips,
      ratedHours: rated,
      nonRatedHours: nonRated,
    };
  }, [phase, adminData, mptRental]);


  return (
    <div className='grid grid-cols-3 gap-4 text-sm'>
      {/* Row 1 */}
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Number of Days</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(phase.days)}
        </div>
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Number of Personnel</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(phase.personnel)}
        </div>
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Number of Trucks</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(phase.numberTrucks)}
        </div>
      </div>

      {/* Row 2 */}
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Base Mobilizations</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(baseTrips)}
        </div>
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Additional Mobilizations</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(phase.maintenanceTrips)}
        </div>
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Total Mobilizations</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(baseTrips + safeNumber(phase.maintenanceTrips))}
        </div>
      </div>

      {/* Row 3 */}
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Base Non-Rated Hours</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(nonRatedHours).toFixed(1)}
        </div>
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>
          Additional Non-Rated Hours
        </label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(phase.additionalNonRatedHours).toFixed(1)}
        </div>
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Total Non-Rated Hours</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(
            nonRatedHours + safeNumber(phase.additionalNonRatedHours)
          ).toFixed(1)}
        </div>
      </div>

      {/* Row 4 */}
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Base Rated Hours</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(ratedHours).toFixed(1)}
        </div>
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Additional Rated Hours</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(phase.additionalRatedHours).toFixed(1)}
        </div>
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Total Rated Hours</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {safeNumber(
            ratedHours + safeNumber(phase.additionalRatedHours)
          ).toFixed(1)}
        </div>
      </div>

      {/* Row 5 */}
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Mobilization</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {formatCurrency(mobilizationCost)}
        </div>
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Fuel Cost</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {formatCurrency(fuelCost)}
        </div>
      </div>
      <div className='flex flex-col'>
        <label className='text-sm font-semibold'>Truck & Fuel Cost</label>
        <div className='pr-3 py-1 select-text cursor-default text-muted-foreground'>
          {formatCurrency(truckAndFuelCost)}
        </div>
      </div>
    </div>
  )
}
