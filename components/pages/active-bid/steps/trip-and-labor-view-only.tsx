'use client'

import { useEstimate } from '@/contexts/EstimateContext'
import React from 'react'
import { TripAndLaborSummary } from './trip-and-labor-summary';

const TripAndLaborViewOnlyAll = () => {
  const { mptRental, adminData } = useEstimate();

  const phases = mptRental?.phases || [];

  return (
    <div className="space-y-6">
      {phases.map((phase, index) => (
        <div className='border-b border-border mb-4 pb-4 pl-6' key={index}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4   last:border-b-0">
            {/* Phase Header */}
            <div className="flex flex-col col-span-3">
              <label className="text-sm font-semibold mb-2">
                Phase {index + 1} {phase.name.trim() !== '' && '-'} {phase.name || ''}
              </label>
            </div>

            {/* Personnel Section */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold">
                Number of Personnel
              </label>
              <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                {phase.personnel || "-"}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold">
                Number of Trucks
              </label>
              <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                {phase.numberTrucks || "-"}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold">
                Additional Trips
              </label>
              <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                {phase.maintenanceTrips || "-"}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold">
                Additional Rated Hours
              </label>
              <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                {phase.additionalRatedHours || "-"}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold">
                Additional Non-Rated Hours
              </label>
              <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                {phase.additionalNonRatedHours || "-"}
              </div>
            </div>
          </div>
          <TripAndLaborSummary
            phase={phase}
            phaseIndex={index}
            adminData={adminData}
            mptRental={mptRental}
          />
        </div>
      ))}
    </div>
  )
}

export default TripAndLaborViewOnlyAll