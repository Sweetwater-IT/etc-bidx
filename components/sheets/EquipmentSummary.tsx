'use client'
import React, { useMemo } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { EquipmentType, SheetingType } from '@/types/MPTEquipment'
import { allEquipmentList, equipmentList } from '@/types/MPTEquipment'
import { returnSignTotalsByPhase, returnSignTotalsSquareFootage } from '@/lib/mptRentalHelperFunctions'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const sheetingTypes = ['HI', 'DG', 'Special']

const EquipmentSummary = () => {
  const { mptRental, equipmentRental } = useEstimate()

  const data = useMemo(() => {
    if (!mptRental) return []
    const equipmentTypes: EquipmentType[] = equipmentList.map(equipment => equipment.key)

    // Get standard equipment data
    const standardEquipment = equipmentTypes.map(type => ({
      type,
      displayName: equipmentList.find(equipment => equipment.key === type)?.label,
      phaseQuantities: mptRental?.phases.map(phase =>
        phase.standardEquipment[type]?.quantity || 0
      ) || [],
      totalQuantity: mptRental?.phases.reduce((sum, phase) =>
        sum + (phase.standardEquipment[type]?.quantity || 0), 0
      ) || 0
    }))

    const lightAndDrumEquipment = allEquipmentList.filter(equipmentType => 
      equipmentType.key === 'ACLights' || 
      equipmentType.key === 'BLights' ||
      equipmentType.key === 'TypeXIVP' || 
      equipmentType.key === 'HIVP' || 
      equipmentType.key === 'sharps'
    ).map(equipmentType => ({
      type: equipmentType.key,
      displayName: equipmentType.label,
      phaseQuantities: mptRental?.phases.map(phase =>
        phase.standardEquipment[equipmentType.key as EquipmentType]?.quantity || 0
      ) || [],
      totalQuantity: mptRental?.phases.reduce((sum, phase) =>
        sum + (phase.standardEquipment[equipmentType.key as EquipmentType]?.quantity || 0), 0
      ) || 0
    }))

    // Get unique custom item IDs
    const uniqueCustomItemIds: string[] = []
    mptRental.phases.forEach(phase => {
      phase.customLightAndDrumItems.forEach(item => {
        if (!uniqueCustomItemIds.includes(item.id)) {
          uniqueCustomItemIds.push(item.id)
        }
      })
    })

    // Create a summary for each unique custom item
    const customLightAndDrumItems = uniqueCustomItemIds.map(itemId => {
      return {
        type: itemId,
        displayName: itemId, // Using ID as display name, modify if needed
        phaseQuantities: mptRental.phases.map(phase => {
          const item = phase.customLightAndDrumItems.find(i => i.id === itemId)
          return item ? item.quantity : 0
        }),
        totalQuantity: mptRental.phases.reduce((sum, phase) => {
          const item = phase.customLightAndDrumItems.find(i => i.id === itemId)
          return sum + (item ? item.quantity : 0)
        }, 0)
      }
    })

    const signEquipment = sheetingTypes.map(type => ({
      type,
      displayName: type,
      phaseQuantities: mptRental?.phases.map(phase =>
        returnSignTotalsByPhase(phase)[type as SheetingType].totalSquareFootage.toFixed(2) || 0
      ) || [],
      totalQuantity: returnSignTotalsSquareFootage(mptRental!)[type as SheetingType].totalSquareFootage.toFixed(2) || 0
    }))

    // Get unique rental item names
    const uniqueRentalNames = (equipmentRental || [])
      .filter(item => item.name !== '')
      .reduce<string[]>((acc, item) => {
        if (!acc.includes(item.name)) {
          acc.push(item.name)
        }
        return acc
      }, [])

    // Get rental equipment data
    const rentalEquipment = uniqueRentalNames.map(name => ({
      type: name,
      displayName: name,
      phaseQuantities: mptRental?.phases.map(phase => 0),
      totalQuantity: (equipmentRental || [])
        .filter(item => item.name === name)
        .reduce((sum, item) => sum + item.quantity, 0)
    }))

    return [...standardEquipment, ...lightAndDrumEquipment, ...customLightAndDrumItems, ...signEquipment, ...rentalEquipment]
  }, [mptRental, equipmentRental])

  return (
    <div className="bg-white rounded-lg border p-4 md:col-span-2">
      <h3 className="text-lg font-medium mb-4">Equipment Summary</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Item</TableHead>
              <TableHead className="whitespace-nowrap">Total</TableHead>
              {mptRental?.phases.map((_, index) => (
                <TableHead key={index} className="whitespace-nowrap">
                  Phase {index + 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.displayName}</TableCell>
                  <TableCell>
                    {/* <Tooltip>
                      <TooltipTrigger className="cursor-help"> */}
                        {item.totalQuantity}
                      {/* </TooltipTrigger>
                      <TooltipContent>
                        <p>Total = Sum of {item.displayName} quantities across all phases</p>
                      </TooltipContent>
                    </Tooltip> */}
                  </TableCell>
                  {item.phaseQuantities && item.phaseQuantities.map((quantity, phaseIndex) => (
                    <TableCell key={phaseIndex}>
                      {/* <Tooltip>
                        <TooltipTrigger className="cursor-help"> */}
                          {quantity}
                        {/* </TooltipTrigger>
                        <TooltipContent>
                          <p>Quantity of {item.displayName} used in Phase {phaseIndex + 1}</p>
                        </TooltipContent>
                      </Tooltip> */}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 italic py-6">
                  No equipment added
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default EquipmentSummary