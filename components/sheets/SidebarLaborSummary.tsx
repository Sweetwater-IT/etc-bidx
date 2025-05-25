import { useEstimate } from '@/contexts/EstimateContext'
import { calculateLaborCostSummary } from '@/lib/mptRentalHelperFunctions'
import React, { useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Card } from '../ui/card'

const SidebarLaborSummary = () => {

    const [laborSummary, setLaborSummary] = useState<{item: string, total: number}[]>([])

    const { adminData, mptRental } = useEstimate();

    useEffect(() => {
        if(!mptRental){
          setLaborSummary([])
          return
        }
    
    
        const laborHours = calculateLaborCostSummary(adminData, mptRental)
        setLaborSummary([
          {
            item: 'Rated Labor Hours',
            total: laborHours.ratedLaborHours || 0
          },
          {
            item: 'Shop Labor Hours',
            total: laborHours.nonRatedLaborHours || 0
          },
          {
            item: 'Permanent Sign Hours',
            total: 0
          },
          {
            item: 'Total',
            total: (laborHours.ratedLaborHours + laborHours.nonRatedLaborHours) || 0
          }
        ])
      }, [adminData, mptRental])

  return (
    <div className='border rounded-md p-4'>
    <div className="grid grid-cols-2">
      <div className="px-3 font-medium">LABOR SUMMARY</div>
      <div className="px-3 font-medium">Hours</div>
    </div>
    
    {laborSummary.map((row, index) => (
      <div 
        key={index} 
        className={`grid grid-cols-2 border-t border-gray-300 ${index === laborSummary.length - 1 ? 'bg-green-50' : ''}`}
      >
        <div className="px-3 py-1 text-sm">{row.item}</div>
        <div className="px-3 py-1 text-sm">
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              {row.total.toFixed(2)} hrs
            </TooltipTrigger>
            <TooltipContent>
              {row.item === 'Rated Labor Hours' && (
                <p>Rated Labor Hours = (Number of Personnel × Project Days × Hours Per Day)</p>
              )}
              {row.item === 'Shop Labor Hours' && (
                <p>Shop Labor Hours = (Non-Rated Hours Per Phase × Number of Phases)</p>
              )}
              {row.item === 'Permanent Sign Hours' && (
                <p>Permanent Sign Hours = Sum of labor hours for permanent sign installation</p>
              )}
              {row.item === 'Total' && (
                <p>Total Hours = (Rated Labor Hours + Shop Labor Hours + Permanent Sign Hours)</p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    ))}
  </div>
  )
}

export default SidebarLaborSummary
