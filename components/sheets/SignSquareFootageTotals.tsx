'use client'
import React from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { returnSignTotalsSquareFootage } from '@/lib/mptRentalHelperFunctions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const SignSquareFootageTotals = () => {
  const { mptRental } = useEstimate()
  
  // Calculate total square footage
  const totalSquareFootage = mptRental ? 
    (returnSignTotalsSquareFootage(mptRental).HI.totalSquareFootage +
     returnSignTotalsSquareFootage(mptRental).DG.totalSquareFootage +
     returnSignTotalsSquareFootage(mptRental).Special.totalSquareFootage) : 0
  
  return (
    <div className="border rounded-md p-4">
      <div className="grid grid-cols-2 mb-2">
        <div className="px-3 font-medium">Square Footage by Sign Type</div>
        <div className="px-3 font-medium">Area</div>
      </div>
      
      {/* High Intensity */}
      <div className="grid grid-cols-2 border-t border-gray-300">
        <div className="px-3 py-1 text-sm">High Intensity</div>
        <div className="px-3 py-1 text-sm">
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              {mptRental ? returnSignTotalsSquareFootage(mptRental).HI.totalSquareFootage.toFixed(2) : "0.00"} sq. ft.
            </TooltipTrigger>
            <TooltipContent>
              <p>HI Sign Area = Sum of (Width × Height) for all High Intensity signs</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Diamond Grade */}
      <div className="grid grid-cols-2 border-t border-gray-300">
        <div className="px-3 py-1 text-sm">Diamond Grade</div>
        <div className="px-3 py-1 text-sm">
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              {mptRental ? returnSignTotalsSquareFootage(mptRental).DG.totalSquareFootage.toFixed(2) : "0.00"} sq. ft.
            </TooltipTrigger>
            <TooltipContent>
              <p>DG Sign Area = Sum of (Width × Height) for all Diamond Grade signs</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Special */}
      <div className="grid grid-cols-2 border-t border-gray-300">
        <div className="px-3 py-1 text-sm">Special</div>
        <div className="px-3 py-1 text-sm">
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              {mptRental ? returnSignTotalsSquareFootage(mptRental).Special.totalSquareFootage.toFixed(2) : "0.00"} sq. ft.
            </TooltipTrigger>
            <TooltipContent>
              <p>Special Sign Area = Sum of (Width × Height) for all Special signs</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Total */}
      <div className="grid grid-cols-2 border-t border-gray-300 bg-green-50">
        <div className="px-3 py-1 text-sm">Total</div>
        <div className="px-3 py-1 text-sm">
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              {totalSquareFootage.toFixed(2)} sq. ft.
            </TooltipTrigger>
            <TooltipContent>
              <p>Total Area = Sum of all sign areas (HI + DG + Special)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default SignSquareFootageTotals