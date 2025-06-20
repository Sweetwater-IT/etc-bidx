'use client'
import React, { useMemo, useState } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { EquipmentType, SheetingType } from '@/types/MPTEquipment'
import { allEquipmentList, equipmentList } from '@/types/MPTEquipment'
import { returnSignTotalsByPhase, returnSignTotalsSquareFootage } from '@/lib/mptRentalHelperFunctions'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"

const sheetingTypes = ['HI', 'DG', 'Special']

// Mock data for demonstration
const mockPhases = [
  {
    name: 'Excavation Phase',
    startDate: '2025-07-01',
    endDate: '2025-07-15',
    standardEquipment: {
      fourFootTypeIII: { quantity: 10 },
      sixFootWings: { quantity: 5 },
      hStand: { quantity: 8 },
      post: { quantity: 20 },
      sandbag: { quantity: 50 },
      covers: { quantity: 12 },
      metalStands: { quantity: 6 },
      HIVP: { quantity: 4 },
      TypeXIVP: { quantity: 3 },
      BLights: { quantity: 8 },
      ACLights: { quantity: 10 },
      sharps: { quantity: 15 }
    },
    customLightAndDrumItems: [
      { id: 'Custom Barrier A', quantity: 5 },
      { id: 'Special Drum', quantity: 8 }
    ],
    signs: [
      { type: 'HI', totalSquareFootage: 120 },
      { type: 'DG', totalSquareFootage: 80 },
      { type: 'Special', totalSquareFootage: 40 }
    ]
  },
  {
    name: 'Concrete Pour Phase',
    startDate: '2025-07-16',
    endDate: '2025-07-30',
    standardEquipment: {
      fourFootTypeIII: { quantity: 15 },
      sixFootWings: { quantity: 8 },
      hStand: { quantity: 12 },
      post: { quantity: 30 },
      sandbag: { quantity: 75 },
      covers: { quantity: 18 },
      metalStands: { quantity: 9 },
      HIVP: { quantity: 6 },
      TypeXIVP: { quantity: 4 },
      BLights: { quantity: 12 },
      ACLights: { quantity: 15 },
      sharps: { quantity: 20 }
    },
    customLightAndDrumItems: [
      { id: 'Custom Barrier A', quantity: 8 },
      { id: 'Special Drum', quantity: 12 },
      { id: 'Traffic Controller', quantity: 2 }
    ],
    signs: [
      { type: 'HI', totalSquareFootage: 200 },
      { type: 'DG', totalSquareFootage: 150 },
      { type: 'Special', totalSquareFootage: 60 }
    ]
  },
  {
    name: 'Finishing Phase',
    startDate: '2025-08-01',
    endDate: '2025-08-10',
    standardEquipment: {
      fourFootTypeIII: { quantity: 8 },
      sixFootWings: { quantity: 4 },
      hStand: { quantity: 6 },
      post: { quantity: 15 },
      sandbag: { quantity: 30 },
      covers: { quantity: 8 },
      metalStands: { quantity: 4 },
      HIVP: { quantity: 2 },
      TypeXIVP: { quantity: 2 },
      BLights: { quantity: 6 },
      ACLights: { quantity: 8 },
      sharps: { quantity: 10 }
    },
    customLightAndDrumItems: [
      { id: 'Custom Barrier A', quantity: 3 },
      { id: 'Traffic Controller', quantity: 1 }
    ],
    signs: [
      { type: 'HI', totalSquareFootage: 80 },
      { type: 'DG', totalSquareFootage: 60 },
      { type: 'Special', totalSquareFootage: 20 }
    ]
  }
]

const PhaseQuantitiesTable = () => {
  const { mptRental, equipmentRental } = useEstimate()
  
  // Use mock data for now
  const phases = mockPhases
  
  // State for actual quantities and dates
  const [actualQuantities, setActualQuantities] = useState<Record<string, Record<string, number>>>({})
  const [phaseDates, setPhaseDates] = useState<Record<string, { startDate: string, endDate: string }>>({})

  // Get equipment data for a specific phase
  const getPhaseEquipmentData = (phase: any, phaseIndex: number) => {
    const equipmentTypes: EquipmentType[] = equipmentList.map(equipment => equipment.key)

    // Get standard equipment data
    const standardEquipment = equipmentTypes.map(type => ({
      type,
      displayName: equipmentList.find(equipment => equipment.key === type)?.label || type,
      estimatedQuantity: phase.standardEquipment[type]?.quantity || 0
    }))

    // Get light and drum equipment
    const lightAndDrumEquipment = allEquipmentList.filter(equipmentType => 
      equipmentType.key === 'ACLights' || 
      equipmentType.key === 'BLights' ||
      equipmentType.key === 'TypeXIVP' || 
      equipmentType.key === 'HIVP' || 
      equipmentType.key === 'sharps'
    ).map(equipmentType => ({
      type: equipmentType.key,
      displayName: equipmentType.label,
      estimatedQuantity: phase.standardEquipment[equipmentType.key as EquipmentType]?.quantity || 0
    }))

    // Get custom light and drum items
    const customLightAndDrumItems = (phase.customLightAndDrumItems || []).map((item: any) => ({
      type: item.id,
      displayName: item.id,
      estimatedQuantity: item.quantity
    }))

    // Get sign equipment
    const signEquipment = sheetingTypes.map(type => {
      const signData = phase.signs?.find((s: any) => s.type === type)
      return {
        type: `sign_${type}`,
        displayName: `${type} Signs (sq ft)`,
        estimatedQuantity: signData?.totalSquareFootage || 0
      }
    })

    return [...standardEquipment, ...lightAndDrumEquipment, ...customLightAndDrumItems, ...signEquipment]
  }

  const handleActualQuantityChange = (phaseIndex: number, equipmentType: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setActualQuantities(prev => ({
      ...prev,
      [phaseIndex]: {
        ...prev[phaseIndex],
        [equipmentType]: numValue
      }
    }))
  }

  const handleDateChange = (phaseIndex: number, dateType: 'startDate' | 'endDate', value: string) => {
    setPhaseDates(prev => ({
      ...prev,
      [phaseIndex]: {
        ...prev[phaseIndex],
        [dateType]: value
      }
    }))
  }

  const handleSave = (phaseIndex: number, equipmentType: string) => {
    console.log(`Saving phase ${phaseIndex}, equipment ${equipmentType}:`, actualQuantities[phaseIndex]?.[equipmentType])
    // Save logic will go here
  }

  if (!phases || phases.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4 md:col-span-2">
        <h3 className="text-lg font-medium mb-4">Equipment Summary</h3>
        <p className="text-center text-gray-500 italic py-6">No phase data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-4 md:col-span-2">
      <h3 className="text-lg font-medium mb-4">Phase Equipment Summary</h3>
      
      <Tabs defaultValue="phase0" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${phases.length}, 1fr)` }}>
          {phases.map((phase, index) => (
            <TabsTrigger key={index} value={`phase${index}`}>
              {phase.name || `Phase ${index + 1}`}
            </TabsTrigger>
          ))}
        </TabsList>

        {phases.map((phase, phaseIndex) => {
          const equipmentData = getPhaseEquipmentData(phase, phaseIndex)
          const currentPhaseDates = phaseDates[phaseIndex] || { 
            startDate: phase.startDate || '', 
            endDate: phase.endDate || '' 
          }

          return (
            <TabsContent key={phaseIndex} value={`phase${phaseIndex}`} className="mt-4">
              {/* Equipment Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Equipment</TableHead>
                      <TableHead className="whitespace-nowrap">Estimated Quantity</TableHead>
                      <TableHead className="whitespace-nowrap">Actual Quantity</TableHead>
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Date Fields Row */}
                    <TableRow className="bg-gray-50">
                      <TableCell className="font-medium">Start Date</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={currentPhaseDates.startDate}
                          onChange={(e) => handleDateChange(phaseIndex, 'startDate', e.target.value)}
                          className="w-40"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => console.log('Saving start date')}
                          size="sm"
                          variant="ghost"
                          className="p-1 h-8 w-8"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-gray-50">
                      <TableCell className="font-medium">End Date</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={currentPhaseDates.endDate}
                          onChange={(e) => handleDateChange(phaseIndex, 'endDate', e.target.value)}
                          className="w-40"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => console.log('Saving end date')}
                          size="sm"
                          variant="ghost"
                          className="p-1 h-8 w-8"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {equipmentData.length > 0 ? (
                      equipmentData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.displayName}</TableCell>
                          <TableCell>{item.estimatedQuantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="0"
                              value={actualQuantities[phaseIndex]?.[item.type] || ''}
                              onChange={(e) => handleActualQuantityChange(phaseIndex, item.type, e.target.value)}
                              className="w-24"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleSave(phaseIndex, item.type)}
                              size="sm"
                              variant="ghost"
                              className="p-1 h-8 w-8"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 italic py-6">
                          No equipment added to this phase
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

export default PhaseQuantitiesTable