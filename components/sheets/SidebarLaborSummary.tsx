import { useEstimate } from '@/contexts/EstimateContext'
import { calculateLaborCostSummary } from '@/lib/mptRentalHelperFunctions'
import React, { useEffect, useState } from 'react'

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
    <div className="mt-8">
    <div className="grid grid-cols-2 mb-2">
      <div className="px-3 py-2 font-medium">LABOR SUMMARY (HOURS)</div>
      <div className="px-3 py-2 font-medium">Hours</div>
    </div>
    
    {laborSummary.map((row, index) => (
      <div 
        key={index} 
        className={`grid grid-cols-2 border-t border-gray-300 py-2 ${index === laborSummary.length - 1 ? 'bg-green-50' : ''}`}
      >
        <div className="px-3 py-1 text-sm">{row.item}</div>
        <div className="px-3 py-1 text-sm">{row.total.toFixed(2)} hrs</div>
      </div>
    ))}
  </div>
  )
}

export default SidebarLaborSummary
