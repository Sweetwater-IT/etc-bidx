'use client'
import React from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { returnSignTotalsSquareFootage } from '@/lib/mptRentalHelperFunctions'

const SignSquareFootageTotals = () => {
  const { mptRental } = useEstimate()
  
  // Calculate total square footage
  const totalSquareFootage = mptRental ? 
    (returnSignTotalsSquareFootage(mptRental).HI.totalSquareFootage +
     returnSignTotalsSquareFootage(mptRental).DG.totalSquareFootage +
     returnSignTotalsSquareFootage(mptRental).Special.totalSquareFootage) : 0
  
  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 mb-2">
        <div className="px-3 py-2 font-medium">Square Footage by Sign Type</div>
        <div className="px-3 py-2 font-medium">Area</div>
      </div>
      
      {/* High Intensity */}
      <div className="grid grid-cols-2 border-t border-gray-300 py-2">
        <div className="px-3 py-1 text-sm">High Intensity</div>
        <div className="px-3 py-1 text-sm">
          {mptRental ? returnSignTotalsSquareFootage(mptRental).HI.totalSquareFootage.toFixed(2) : "0.00"} sq. ft.
        </div>
      </div>
      
      {/* Diamond Grade */}
      <div className="grid grid-cols-2 border-t border-gray-300 py-2">
        <div className="px-3 py-1 text-sm">Diamond Grade</div>
        <div className="px-3 py-1 text-sm">
          {mptRental ? returnSignTotalsSquareFootage(mptRental).DG.totalSquareFootage.toFixed(2) : "0.00"} sq. ft.
        </div>
      </div>
      
      {/* Special */}
      <div className="grid grid-cols-2 border-t border-gray-300 py-2">
        <div className="px-3 py-1 text-sm">Special</div>
        <div className="px-3 py-1 text-sm">
          {mptRental ? returnSignTotalsSquareFootage(mptRental).Special.totalSquareFootage.toFixed(2) : "0.00"} sq. ft.
        </div>
      </div>
      
      {/* Total */}
      <div className="grid grid-cols-2 border-t border-gray-300 py-2 bg-green-50">
        <div className="px-3 py-1 text-sm">Total</div>
        <div className="px-3 py-1 text-sm">
          {totalSquareFootage.toFixed(2)} sq. ft.
        </div>
      </div>
    </div>
  )
}

export default SignSquareFootageTotals