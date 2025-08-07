'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import React, { useEffect, useState, useCallback } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { safeNumber } from '@/lib/safe-number'
import { calculateFlaggingCostSummary } from '@/lib/mptRentalHelperFunctions'
import { Flagging } from '@/types/TFlagging'
import { Plus, Edit, Trash2, Clock, User } from 'lucide-react'
import EmptyContainer from './empty-container'
import { AdminData } from '@/types/TAdminData'

// Markup percentages arrays for rated and non-rated jobs
const NON_RATED_MARKUP_PERCENTAGES = [
  50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70, 72.5, 75, 77.5
]
const RATED_MARKUP_PERCENTAGES = [
  42.5, 45, 47.5, 50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70
]

interface FlaggingItem {
  id: string
  personnel: number
  numberTrucks: number
  onSiteJobHours: number
  fuelCostPerGallon: number
  arrowBoards: {
    quantity: number
    cost: number
    includeInLumpSum: boolean
  }
  messageBoards: {
    quantity: number
    cost: number
    includeInLumpSum: boolean
  }
  TMA: {
    quantity: number
    cost: number
    includeInLumpSum: boolean
  }
  additionalEquipmentCost: number
  markupRate?: number
  isStandardPricing: boolean
  standardLumpSum?: number
}

const FlaggingServicesTab = () => {
  const { adminData, flagging, dispatch } = useEstimate()
  const [flaggingItems, setFlaggingItems] = useState<FlaggingItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<FlaggingItem | null>(null)
  const [isStandardPricing, setIsStandardPricing] = useState(false)
  const [flaggingCostSummary, setFlaggingCostSummary] = useState<any>(null)
  const [editingArrowBoardCost, setEditingArrowBoardCost] = useState(false)
  const [editingMessageBoardCost, setEditingMessageBoardCost] = useState(false)
  const [editingTMACost, setEditingTMACost] = useState(false)
  const [arrowBoardCost, setArrowBoardCost] = useState('')
  const [messageBoardCost, setMessageBoardCost] = useState('')
  const [tmaCost, setTMACost] = useState('')
  const [customGrossMargin, setCustomGrossMargin] = useState<{
    customGrossMargin: number,
    lumpSum: number,
    hourlyRate: number,
    item: any;
  }>({
    customGrossMargin: 0,
    lumpSum: 0,
    hourlyRate: 0,
    item: {}
  })

  // Initialize flagging services if needed
  useEffect(() => {
    const fetchFlaggingStaticData = async () => {
      try {
        const flaggingResponse = await fetch('/api/flagging')
        if (flaggingResponse.ok) {
          const flaggingData = await flaggingResponse.json()
          const flaggingObject = flaggingData.data[0]

          dispatch({
            type: 'UPDATE_FLAGGING',
            payload: {
              key: 'fuelEconomyMPG',
              value: Number(flaggingObject.fuel_economy_mpg)
            }
          })

          dispatch({
            type: 'UPDATE_FLAGGING',
            payload: {
              key: 'truckDispatchFee',
              value: Number(flaggingObject.truck_dispatch_fee)
            }
          })

          dispatch({
            type: 'UPDATE_FLAGGING',
            payload: {
              key: 'workerComp',
              value: Number(flaggingObject.worker_comp)
            }
          })

          dispatch({
            type: 'UPDATE_FLAGGING',
            payload: {
              key: 'generalLiability',
              value: Number(flaggingObject.general_liability)
            }
          })
        }
      } catch (error) {
        console.error('Error fetching flagging data:', error)
      }
    }

    fetchFlaggingStaticData()
  }, [dispatch])

  // Calculate flagging cost summary for current form data
  useEffect(() => {
    if (formData && adminData && !formData.isStandardPricing) {
      // Create a temporary flagging object for calculation
      const tempFlagging: Flagging = {
        ...flagging,
        standardPricing: false,
        standardLumpSum: 0,
        fuelEconomyMPG: flagging?.fuelEconomyMPG ?? 0,
        truckDispatchFee: flagging?.truckDispatchFee ?? 0,
        workerComp: flagging?.workerComp ?? 0,
        generalLiability: flagging?.generalLiability ?? 0,
        markupRate: 0,
        personnel: formData.personnel,
        numberTrucks: formData.numberTrucks,
        onSiteJobHours: formData.onSiteJobHours,
        fuelCostPerGallon: formData.fuelCostPerGallon,
        arrowBoards: formData.arrowBoards,
        messageBoards: formData.messageBoards,
        TMA: formData.TMA,
        additionalEquipmentCost: formData.additionalEquipmentCost
      }
      setFlaggingCostSummary(
        calculateFlaggingCostSummary(adminData, tempFlagging, false)
      )
    }
  }, [formData, adminData, flagging])

  // On mount or when global flagging changes, sync local flaggingItems to always show the saved flagging
  useEffect(() => {
    // Only add to array if flagging has meaningful data (e.g., personnel or numberTrucks set)
    if (flagging && (flagging.personnel > 0 || flagging.numberTrucks > 0)) {
      setFlaggingItems([{ ...flagging, id: 'flagging', isStandardPricing: flagging.standardPricing || false }]);
    } else {
      setFlaggingItems([]);
    }
  }, [flagging]);

  const handleAddFlagging = () => {
    setFormData({
      id: Date.now().toString(),
      personnel: 0,
      numberTrucks: 0,
      onSiteJobHours: 0,
      fuelCostPerGallon: 0,
      arrowBoards: {
        quantity: 0,
        cost: 50,
        includeInLumpSum: false
      },
      messageBoards: {
        quantity: 0,
        cost: 100,
        includeInLumpSum: false
      },
      TMA: {
        quantity: 0,
        cost: 400,
        includeInLumpSum: false
      },
      additionalEquipmentCost: 0,
      isStandardPricing: false
    })
    setIsStandardPricing(false)
    setEditingIndex(null)
    setDrawerOpen(true)
  }

  const handleEditFlagging = (index: number) => {
    setFormData({ ...flaggingItems[index] })
    setIsStandardPricing(flaggingItems[index].isStandardPricing)
    setEditingIndex(index)
    setDrawerOpen(true)
  }

  const handleDeleteFlagging = (index: number) => {
    const newItems = flaggingItems.filter((_, i) => i !== index)
    setFlaggingItems(newItems)
    dispatch({ type: 'DELETE_FLAGGING' })
  }

  const handleFormUpdate = (field: keyof FlaggingItem, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value })
    }
  }

  const handleEquipmentInputChange = (
    field: 'arrowBoards' | 'messageBoards' | 'TMA',
    subfield: string,
    value: number | boolean
  ) => {
    if (!formData) return

    const currentEquipment = formData[field]
    setFormData({
      ...formData,
      [field]: {
        ...currentEquipment,
        [subfield]: value
      }
    })
  }

  const handleCountyRateChange = (propertyName: string, value: number) => {
    const updatedCounty = {
      ...adminData.county,
      [propertyName]: value
    }

    dispatch({
      type: 'UPDATE_ADMIN_DATA',
      payload: {
        key: 'county',
        value: updatedCounty
      }
    })
  }
  console.log('xdxdxd', formData);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      const item = customGrossMargin?.item

      if (!item || !adminData || !flagging) return;

      const { hourlyRate, lumpSumWithEquipment } = calculateCustomGrossMarginValues({
        item,
        adminData,
        flagging,
        markupRate: customGrossMargin.customGrossMargin
      })

      setCustomGrossMargin(prev => ({
        ...prev,
        lumpSum: lumpSumWithEquipment,
        hourlyRate
      }))
    }, 500)

    return () => clearTimeout(timeout)
  }, [customGrossMargin.customGrossMargin, flaggingItems, adminData, flagging])

  function calculateCustomGrossMarginValues({
    item,
    adminData,
    flagging,
    markupRate
  }: {
    item: FlaggingItem
    adminData: AdminData
    flagging: Flagging
    markupRate: number
  }) {
    if (!adminData || !flagging) return { lumpSumWithEquipment: 0, hourlyRate: 0 }

    const tempFlagging: Flagging = {
      ...flagging,
      standardPricing: false,
      standardLumpSum: 0,
      markupRate: 0,
      fuelEconomyMPG: flagging?.fuelEconomyMPG ?? 0,
      truckDispatchFee: flagging?.truckDispatchFee ?? 0,
      workerComp: flagging?.workerComp ?? 0,
      generalLiability: flagging?.generalLiability ?? 0,
      personnel: item.personnel,
      numberTrucks: item.numberTrucks,
      onSiteJobHours: item.onSiteJobHours,
      fuelCostPerGallon: item.fuelCostPerGallon,
      arrowBoards: item.arrowBoards,
      messageBoards: item.messageBoards,
      TMA: item.TMA,
      additionalEquipmentCost: item.additionalEquipmentCost
    }

    const summary = calculateFlaggingCostSummary(adminData, tempFlagging, false)
    if (!summary) return { lumpSumWithEquipment: 0, hourlyRate: 0 }

    const lumpSum = summary.totalFlaggingCost / (1 - markupRate / 100)

    const arrowBoardsCost = item.arrowBoards.includeInLumpSum
      ? safeNumber(item.arrowBoards.quantity) * item.arrowBoards.cost
      : 0

    const messageBoardsCost = item.messageBoards.includeInLumpSum
      ? safeNumber(item.messageBoards.quantity) * item.messageBoards.cost
      : 0

    const tmaCost = item.TMA.includeInLumpSum
      ? safeNumber(item.TMA.quantity) * item.TMA.cost
      : 0

    const lumpSumWithEquipment = lumpSum + arrowBoardsCost + messageBoardsCost + tmaCost

    const totalHours =
      Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60) +
      item.onSiteJobHours

    const hourlyRate =
      item.personnel > 0 ? safeNumber(lumpSum / (item.personnel * totalHours)) : 0

    return { lumpSumWithEquipment, hourlyRate }
  }


  // Standard pricing calculation functions
  const getPersonLumpSum = (numberPersonnel: number) => {
    if (!flagging || !adminData.county) return 0

    let onePersonLumpSum =
      safeNumber(flagging?.truckDispatchFee) +
      adminData.county.fuel +
      adminData.county.insurance

    const hourlyRate =
      adminData.rated === 'RATED'
        ? adminData.county.flaggingFringeRate +
        adminData.county.flaggingBaseRate
        : adminData.county.flaggingRate

    const dayRate = hourlyRate * 8

    const targetRate =
      adminData.rated === 'RATED'
        ? adminData.county.ratedTargetGM / 100
        : adminData.county.nonRatedTargetGM / 100

    onePersonLumpSum += dayRate / (1 - targetRate)

    return onePersonLumpSum * numberPersonnel
  }

  const getOnePersonOTRate = () => {
    if (!adminData.county) return 0

    const hourlyRate =
      adminData.rated === 'RATED'
        ? adminData.county.flaggingFringeRate +
        adminData.county.flaggingBaseRate
        : adminData.county.flaggingRate

    const overTime = hourlyRate * 1.5

    const overTimeRate =
      adminData.rated === 'RATED' ? overTime / (1 - 0.4) : overTime / (1 - 0.55)

    return overTimeRate
  }

  // Calculate standard lump sum
  const calculateStandardLumpSum = (personnel: number) => {
    if (!adminData.county?.name) return 0

    let calculatedLumpSum = getPersonLumpSum(personnel)

    if (adminData.county.market === 'MOBILIZATION') {
      calculatedLumpSum += 175 * personnel
    }

    return calculatedLumpSum
  }

  const handleSave = () => {
    if (!formData) return

    const finalFormData = { ...formData, markupRate: 50 }

    // If standard pricing, calculate the lump sum
    if (isStandardPricing) {
      finalFormData.standardLumpSum = calculateStandardLumpSum(
        formData.personnel
      )
    }

    finalFormData.isStandardPricing = isStandardPricing

    // Dispatch to global state instead of just local state
    if (finalFormData.isStandardPricing) {
      // For standard pricing, update the flagging state with standard pricing data
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: { key: 'standardPricing', value: true }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: { key: 'markupRate', value: 50 }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: {
          key: 'standardLumpSum',
          value: finalFormData.standardLumpSum || 0
        }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: { key: 'personnel', value: finalFormData.personnel }
      })
    } else {
      // For custom pricing, update all the flagging fields
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: { key: 'standardPricing', value: false }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: { key: 'personnel', value: finalFormData.personnel }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: { key: 'numberTrucks', value: finalFormData.numberTrucks }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: { key: 'onSiteJobHours', value: finalFormData.onSiteJobHours }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: {
          key: 'fuelCostPerGallon',
          value: finalFormData.fuelCostPerGallon
        }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: { key: 'arrowBoards', value: finalFormData.arrowBoards }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: { key: 'messageBoards', value: finalFormData.messageBoards }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: { key: 'TMA', value: finalFormData.TMA }
      })
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: {
          key: 'additionalEquipmentCost',
          value: finalFormData.additionalEquipmentCost
        }
      })
    }

    // Overwrite the local array with the new flagging (only one allowed)
    setFlaggingItems([{ ...finalFormData, id: 'flagging' }])

    handleCancel()
  }

  const handleCancel = () => {
    setDrawerOpen(false)
    setFormData(null)
    setEditingIndex(null)
    setIsStandardPricing(false)
    setFlaggingCostSummary(null)
  }

  // Calculate markup values for a flagging item
  const calculateMarkupValues = (item: FlaggingItem, rate: number) => {
    if (item.isStandardPricing) {
      return {
        lumpSumWithEquipment: item.standardLumpSum || 0,
        hourlyRate:
          item.personnel > 0
            ? (item.standardLumpSum || 0) / (item.personnel * 8)
            : 0
      }
    }

    // For custom pricing, calculate the cost summary for this specific item
    if (!adminData || !flagging)
      return { lumpSumWithEquipment: 0, hourlyRate: 0 }

    // Create a temporary flagging object for this specific item
    const tempFlagging: Flagging = {
      ...flagging,
      standardPricing: false,
      standardLumpSum: 0,
      fuelEconomyMPG: flagging?.fuelEconomyMPG ?? 0,
      truckDispatchFee: flagging?.truckDispatchFee ?? 0,
      workerComp: flagging?.workerComp ?? 0,
      generalLiability: flagging?.generalLiability ?? 0,
      markupRate: 0,
      personnel: item.personnel,
      numberTrucks: item.numberTrucks,
      onSiteJobHours: item.onSiteJobHours,
      fuelCostPerGallon: item.fuelCostPerGallon,
      arrowBoards: item.arrowBoards,
      messageBoards: item.messageBoards,
      TMA: item.TMA,
      additionalEquipmentCost: item.additionalEquipmentCost
    }

    // Calculate cost summary for this item
    const itemCostSummary = calculateFlaggingCostSummary(
      adminData,
      tempFlagging,
      false
    )

    if (!itemCostSummary) return { lumpSumWithEquipment: 0, hourlyRate: 0 }

    const arrowBoardsCost = item.arrowBoards.includeInLumpSum
      ? Number(safeNumber(item.arrowBoards.quantity) * item.arrowBoards.cost)
      : 0

    const messageBoardsCost = item.messageBoards.includeInLumpSum
      ? Number(
        safeNumber(item.messageBoards.quantity) * item.messageBoards.cost
      )
      : 0

    const tmaCost = item.TMA.includeInLumpSum
      ? Number(safeNumber(item.TMA.quantity) * item.TMA.cost)
      : 0

    // Calculate lump sum with markup
    const lumpSum = itemCostSummary.totalFlaggingCost / (1 - rate / 100)
    const lumpSumWithEquipment =
      arrowBoardsCost + messageBoardsCost + tmaCost + lumpSum

    // Calculate hourly rate
    const totalHours =
      Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60) +
      item.onSiteJobHours
    const hourlyRate =
      item.personnel !== 0
        ? safeNumber(lumpSum / (item.personnel * totalHours))
        : 0

    return { lumpSumWithEquipment, hourlyRate }
  }
  const handleMarkupSelection = (itemIndex: number, rate: number) => {
    const newItems = [...flaggingItems]
    newItems[itemIndex].markupRate = rate
    setFlaggingItems(newItems)

    dispatch({
      type: 'UPDATE_FLAGGING',
      payload: {
        key: 'markupRate',
        value: rate
      }
    })
  }

  // Calculate total hours
  const getTotalHours = (item: FlaggingItem) => {
    return (
      safeNumber(item.onSiteJobHours) +
      Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60)
    )
  }

  // Calculate overtime hours
  const getOvertimeHours = (item: FlaggingItem) => {
    return Math.max(
      0,
      safeNumber(item.onSiteJobHours) +
      Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60) -
      8
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between pb-2 border-b mb-6'>
        <h3 className='text-xl text-black font-semibold'>Flagging Services</h3>
        {flaggingItems.length < 1 && (
          <Button onClick={handleAddFlagging}>
            <Plus className='mr-2 h-4 w-4' />
            Add Flagging
          </Button>
        )}
      </div>

      <div className='relative'>
        {/* Flagging Items List */}
        {flaggingItems.length === 0 && (
          <EmptyContainer
            topText='No flagging services added yet'
            subtext='When you add flagging services, they will appear here.'
          />
        )}

        {flaggingItems.map((item, index) => (
          <div key={item.id} className='space-y-4'>
            <div className='rounded-lg border bg-card text-card-foreground shadow-sm mb-2 p-4'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-4'>
                  <div className='font-medium'>
                    {item.isStandardPricing
                      ? 'Standard Pricing'
                      : 'Custom Pricing'}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Personnel: {item.personnel} • Trucks: {item.numberTrucks} •
                    Hours: {item.onSiteJobHours}
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleEditFlagging(index)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleDeleteFlagging(index)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* Equipment Summary */}
              {(item.arrowBoards.quantity > 0 ||
                item.messageBoards.quantity > 0 ||
                item.TMA.quantity > 0) && (
                  <div className='grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-4'>
                    {item.arrowBoards.quantity > 0 && (
                      <div>Arrow Boards: {item.arrowBoards.quantity}</div>
                    )}
                    {item.messageBoards.quantity > 0 && (
                      <div>Message Boards: {item.messageBoards.quantity}</div>
                    )}
                    {item.TMA.quantity > 0 && <div>TMA: {item.TMA.quantity}</div>}
                  </div>
                )}

              {/* Cost Summary for Custom Pricing */}
              {!item.isStandardPricing && (
                <div className='grid grid-cols-2 gap-4 text-sm border-t pt-4'>
                  <div>Total Hours: {getTotalHours(item)}</div>
                  <div>Overtime Hours: {getOvertimeHours(item)}</div>
                </div>
              )}
            </div>

            {/* Pricing Table */}
            <div className='rounded-lg border bg-card text-card-foreground shadow-sm p-4'>
              <h4 className='text-lg font-medium mb-3'>Pricing Options</h4>
              <div className='grid grid-cols-4 gap-4 mb-4 text-sm font-medium'>
                <div>Gross Margin Target</div>
                <div>Lump Sum</div>
                <div>Hourly Rate / Man</div>
                <div className='text-center'>Use this price?</div>
              </div>

              <div className='grid grid-cols-4 gap-4 py-2 border-t text-sm items-center'>
                <Input
                  value={customGrossMargin.customGrossMargin}
                  max={100}
                  min={0}
                  placeholder='Custom gross margin'
                  className='bg-muted/50'
                  onChange={(e: any) =>
                    setCustomGrossMargin(prev => ({
                      ...prev,
                      customGrossMargin: Number(e.target.value),
                      item: item
                    }))
                  }
                />
                <div>
                  ${safeNumber(customGrossMargin.lumpSum).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <div>
                  ${customGrossMargin.hourlyRate.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <div className='flex justify-center'>
                  <Checkbox
                    checked={item.markupRate === customGrossMargin.customGrossMargin}
                    onCheckedChange={checked => {
                      if (checked) {
                        handleMarkupSelection(index, customGrossMargin.customGrossMargin)
                      }
                    }}
                  />
                </div>
              </div>

              {(adminData?.rated === 'RATED'
                ? RATED_MARKUP_PERCENTAGES
                : NON_RATED_MARKUP_PERCENTAGES
              ).map(rate => {
                const { lumpSumWithEquipment, hourlyRate } =
                  calculateMarkupValues(item, rate)

                return (
                  <div
                    key={rate}
                    className='grid grid-cols-4 gap-4 py-2 border-t text-sm'
                  >
                    <div>{rate}%</div>
                    <div>
                      $
                      {safeNumber(lumpSumWithEquipment).toLocaleString(
                        'en-US',
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </div>
                    <div>
                      $
                      {hourlyRate.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                    <div className='flex justify-center'>
                      <Checkbox
                        checked={item.markupRate === rate}
                        onCheckedChange={checked => {
                          if (checked) {
                            handleMarkupSelection(index, rate)
                          }
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Drawer for editing flagging */}
      <Drawer open={drawerOpen} direction='right' onOpenChange={setDrawerOpen}>
        <DrawerContent className='min-w-xl'>
          <div className='flex flex-col gap-2 relative z-10 bg-background'>
            <DrawerHeader>
              <DrawerTitle>
                {editingIndex !== null
                  ? 'Edit Flagging Service'
                  : 'Add Flagging Service'}
              </DrawerTitle>
            </DrawerHeader>
            <Separator className='w-full -mt-2' />
          </div>

          {formData && (
            <div className='px-4 space-y-6 mt-4 overflow-y-auto h-full'>
              {/* Pricing Type Toggle */}
              <div className='flex justify-between items-center'>
                <Label htmlFor='standard-pricing' className='text-base'>
                  Standard Pricing
                </Label>
                <Switch
                  id='standard-pricing'
                  checked={isStandardPricing}
                  onCheckedChange={setIsStandardPricing}
                />
              </div>

              {/* Standard Pricing Section */}
              {isStandardPricing && (
                <div className='space-y-4 rounded-lg bg-muted/50'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label
                        htmlFor='rate-type'
                        className='font-medium text-sm mb-2 block'
                      >
                        Rate Type
                      </Label>
                      <Select
                        value={adminData.rated || ''}
                        onValueChange={value =>
                          dispatch({
                            type: 'UPDATE_ADMIN_DATA',
                            payload: {
                              key: 'rated',
                              value
                            }
                          })
                        }
                      >
                        <SelectTrigger id='rate-type'>
                          <Clock className='mr-2 h-4 w-4' />
                          <SelectValue placeholder='Select rate type' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='RATED'>RATED</SelectItem>
                          <SelectItem value='NON-RATED'>NON-RATED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor='personnel-standard'
                        className='font-medium text-sm mb-2 block'
                      >
                        Personnel
                      </Label>
                      <div className='flex items-center'>
                        <Input
                          id='personnel-standard'
                          type='number'
                          min={0}
                          value={formData.personnel || ''}
                          onChange={e =>
                            handleFormUpdate(
                              'personnel',
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder='Personnel'
                        />
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='mb-2' htmlFor='county'>
                        County
                      </Label>
                      <Input
                        id='county'
                        value={adminData.county?.name || ''}
                        disabled
                      />
                    </div>

                    <div>
                      <Label className='mb-2' htmlFor='market'>
                        Market
                      </Label>
                      <Input
                        id='market'
                        value={adminData.county?.market || ''}
                        disabled
                      />
                    </div>
                    <div>
                      <Label className='mb-2' htmlFor='one-person-hourly-rate'>
                        1 Person Hourly Rate
                      </Label>
                      <Input
                        id='one-person-hourly-rate'
                        value={safeNumber(getPersonLumpSum(1) / 8).toFixed(2)}
                        disabled
                      />
                    </div>
                    <div>
                      <Label className='mb-2' htmlFor='one-person-ot-rate'>
                        1 Person Over Time Rate
                      </Label>
                      <Input
                        id='one-person-ot-rate'
                        value={getOnePersonOTRate().toFixed(2)}
                        disabled
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='mb-2' htmlFor='one-person-lump-sum'>
                        1 Person Lump Sum
                      </Label>
                      <Input
                        id='one-person-lump-sum'
                        value={safeNumber(getPersonLumpSum(1)).toFixed(2)}
                        disabled
                      />
                    </div>

                    <div>
                      <Label className='mb-2' htmlFor='total-lump-sum'>
                        Total Lump Sum
                      </Label>
                      <Input
                        id='total-lump-sum'
                        value={calculateStandardLumpSum(
                          formData.personnel
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                        disabled
                      />
                    </div>
                  </div>

                  {adminData.county?.market === 'MOBILIZATION' &&
                    formData.personnel &&
                    formData.personnel > 0 && (
                      <div className='text-sm text-muted-foreground'>
                        Mobilization Fee added to Lump Sum: $
                        {(formData.personnel * 175).toFixed(2)}
                      </div>
                    )}
                </div>
              )}

              {/* Custom Pricing Section */}
              {!isStandardPricing && (
                <div className='space-y-6'>
                  {/* General Settings */}
                  <div className='space-y-4'>
                    <h4 className='font-medium'>General Settings</h4>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label
                          htmlFor='rate-type-custom'
                          className='font-medium text-sm mb-2 block'
                        >
                          Rate Type
                        </Label>
                        <Select
                          value={adminData.rated || ''}
                          onValueChange={value =>
                            dispatch({
                              type: 'UPDATE_ADMIN_DATA',
                              payload: {
                                key: 'rated',
                                value
                              }
                            })
                          }
                        >
                          <SelectTrigger id='rate-type-custom'>
                            <SelectValue placeholder='Select rate type' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='RATED'>RATED</SelectItem>
                            <SelectItem value='NON-RATED'>NON-RATED</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor='gas-cost'
                          className='font-medium text-sm mb-2 block'
                        >
                          Gas Cost Per Gallon ($)
                        </Label>
                        <Input
                          id='gas-cost'
                          type='number'
                          min={0}
                          step={0.01}
                          value={formData.fuelCostPerGallon || ''}
                          onChange={e =>
                            handleFormUpdate(
                              'fuelCostPerGallon',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder='$ 0.00'
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label
                          htmlFor='flagging-base-rate'
                          className='font-medium text-sm mb-2 block'
                        >
                          Flagging Base Rate
                        </Label>
                        <Input
                          id='flagging-base-rate'
                          type='number'
                          min={0}
                          step={0.01}
                          value={adminData.county?.flaggingBaseRate || ''}
                          onChange={e =>
                            handleCountyRateChange(
                              'flaggingBaseRate',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder='$ 0.00'
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor='flagging-fringe-rate'
                          className='font-medium text-sm mb-2 block'
                        >
                          Flagging Fringe Rate
                        </Label>
                        <Input
                          id='flagging-fringe-rate'
                          type='number'
                          min={0}
                          step={0.01}
                          value={adminData.county?.flaggingFringeRate || ''}
                          onChange={e =>
                            handleCountyRateChange(
                              'flaggingFringeRate',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder='$ 0.00'
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor='flagging-rate'
                          className='font-medium text-sm mb-2 block'
                        >
                          Flagging Rate
                        </Label>
                        <Input
                          id='flagging-rate'
                          value={adminData.county?.flaggingRate || ''}
                          disabled
                          placeholder='$ 0.00'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resources and Equipment */}
                  <div className='space-y-4'>
                    <h4 className='font-medium'>Resources and Equipment</h4>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label
                          htmlFor='personnel-custom'
                          className='font-medium text-sm mb-2 block'
                        >
                          Personnel
                        </Label>
                        <Input
                          id='personnel-custom'
                          type='number'
                          min={0}
                          value={formData.personnel || ''}
                          onChange={e =>
                            handleFormUpdate(
                              'personnel',
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder='0'
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor='trucks'
                          className='font-medium text-sm mb-2 block'
                        >
                          Number of Trucks
                        </Label>
                        <Input
                          id='trucks'
                          type='number'
                          min={0}
                          value={formData.numberTrucks || ''}
                          onChange={e =>
                            handleFormUpdate(
                              'numberTrucks',
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder='0'
                        />
                      </div>
                    </div>

                    {/* Equipment Sections */}
                    <div className='grid grid-cols-2 gap-4'>
                      {/* Arrow Boards */}
                      <div>
                        <Label className='font-medium text-sm mb-2 block'>
                          Arrow Boards (
                          {editingArrowBoardCost ? (
                            <Input
                              type='number'
                              min={0}
                              step={0.01}
                              value={arrowBoardCost}
                              autoFocus
                              onChange={e => setArrowBoardCost(e.target.value)}
                              onBlur={() => {
                                handleEquipmentInputChange(
                                  'arrowBoards',
                                  'cost',
                                  parseFloat(arrowBoardCost) || 0
                                )
                                setEditingArrowBoardCost(false)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  handleEquipmentInputChange(
                                    'arrowBoards',
                                    'cost',
                                    parseFloat(arrowBoardCost) || 0
                                  )
                                  setEditingArrowBoardCost(false)
                                }
                              }}
                              className='w-16 inline-block text-left px-1 py-0.5'
                              style={{ display: 'inline-block' }}
                            />
                          ) : (
                            <span
                              className='underline cursor-pointer text-primary mx-1'
                              onClick={() => {
                                setArrowBoardCost(
                                  String(formData.arrowBoards.cost || 0)
                                )
                                setEditingArrowBoardCost(true)
                              }}
                            >
                              ${formData.arrowBoards.cost || 0}
                            </span>
                          )}
                          /day)
                        </Label>
                        <Input
                          type='number'
                          min={0}
                          value={formData.arrowBoards.quantity || ''}
                          onChange={e =>
                            handleEquipmentInputChange(
                              'arrowBoards',
                              'quantity',
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder='0'
                        />
                        <div className='flex items-center gap-2 mt-2'>
                          <Checkbox
                            id='include-arrow-boards'
                            checked={
                              formData.arrowBoards.includeInLumpSum || false
                            }
                            onCheckedChange={checked =>
                              handleEquipmentInputChange(
                                'arrowBoards',
                                'includeInLumpSum',
                                checked === true
                              )
                            }
                          />
                          <Label
                            htmlFor='include-arrow-boards'
                            className='text-sm'
                          >
                            Include in lump sum
                          </Label>
                        </div>
                      </div>

                      {/* Message Boards */}
                      <div>
                        <Label className='font-medium text-sm mb-2 block'>
                          Message Boards (
                          {editingMessageBoardCost ? (
                            <Input
                              type='number'
                              min={0}
                              step={0.01}
                              value={messageBoardCost}
                              autoFocus
                              onChange={e =>
                                setMessageBoardCost(e.target.value)
                              }
                              onBlur={() => {
                                handleEquipmentInputChange(
                                  'messageBoards',
                                  'cost',
                                  parseFloat(messageBoardCost) || 0
                                )
                                setEditingMessageBoardCost(false)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  handleEquipmentInputChange(
                                    'messageBoards',
                                    'cost',
                                    parseFloat(messageBoardCost) || 0
                                  )
                                  setEditingMessageBoardCost(false)
                                }
                              }}
                              className='w-16 inline-block text-left px-1 py-0.5'
                              style={{ display: 'inline-block' }}
                            />
                          ) : (
                            <span
                              className='underline cursor-pointer text-primary mx-1'
                              onClick={() => {
                                setMessageBoardCost(
                                  String(formData.messageBoards.cost || 0)
                                )
                                setEditingMessageBoardCost(true)
                              }}
                            >
                              ${formData.messageBoards.cost || 0}
                            </span>
                          )}
                          /day)
                        </Label>
                        <Input
                          type='number'
                          min={0}
                          value={formData.messageBoards.quantity || ''}
                          onChange={e =>
                            handleEquipmentInputChange(
                              'messageBoards',
                              'quantity',
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder='0'
                        />
                        <div className='flex items-center gap-2 mt-2'>
                          <Checkbox
                            id='include-message-boards'
                            checked={
                              formData.messageBoards.includeInLumpSum || false
                            }
                            onCheckedChange={checked =>
                              handleEquipmentInputChange(
                                'messageBoards',
                                'includeInLumpSum',
                                checked === true
                              )
                            }
                          />
                          <Label
                            htmlFor='include-message-boards'
                            className='text-sm'
                          >
                            Include in lump sum
                          </Label>
                        </div>
                      </div>

                      {/* TMA */}
                      <div>
                        <Label className='font-medium text-sm mb-2 block'>
                          TMA (
                          {editingTMACost ? (
                            <Input
                              type='number'
                              min={0}
                              step={0.01}
                              value={tmaCost}
                              autoFocus
                              onChange={e => setTMACost(e.target.value)}
                              onBlur={() => {
                                handleEquipmentInputChange(
                                  'TMA',
                                  'cost',
                                  parseFloat(tmaCost) || 0
                                )
                                setEditingTMACost(false)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  handleEquipmentInputChange(
                                    'TMA',
                                    'cost',
                                    parseFloat(tmaCost) || 0
                                  )
                                  setEditingTMACost(false)
                                }
                              }}
                              className='w-16 inline-block text-left px-1 py-0.5'
                              style={{ display: 'inline-block' }}
                            />
                          ) : (
                            <span
                              className='underline cursor-pointer text-primary mx-1'
                              onClick={() => {
                                setTMACost(String(formData.TMA.cost || 0))
                                setEditingTMACost(true)
                              }}
                            >
                              ${formData.TMA.cost || 0}
                            </span>
                          )}
                          /day)
                        </Label>
                        <Input
                          type='number'
                          min={0}
                          value={formData.TMA.quantity || ''}
                          onChange={e =>
                            handleEquipmentInputChange(
                              'TMA',
                              'quantity',
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder='0'
                        />
                        <div className='flex items-center gap-2 mt-2'>
                          <Checkbox
                            id='include-tma'
                            checked={formData.TMA.includeInLumpSum || false}
                            onCheckedChange={checked =>
                              handleEquipmentInputChange(
                                'TMA',
                                'includeInLumpSum',
                                checked === true
                              )
                            }
                          />
                          <Label htmlFor='include-tma' className='text-sm'>
                            Include in lump sum
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Summary for Custom Pricing */}
                  {flaggingCostSummary && (
                    <div className='space-y-4 rounded-lg bg-muted/50'>
                      <h4 className='font-medium'>Cost Summary</h4>

                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <Input
                            id='on-site-hours'
                            type='number'
                            min={0}
                            value={formData.onSiteJobHours || ''}
                            onChange={e =>
                              handleFormUpdate(
                                'onSiteJobHours',
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder='On Site Job Hours'
                          />
                        </div>
                        <div className='flex justify-between'>
                          <span>On Site Job Hours Cost:</span>
                          <span>
                            $
                            {flaggingCostSummary.onSiteJobHoursCost?.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }
                            ) || '0.00'}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Round Trip Travel Time Hours:</span>
                          <span>
                            {Math.ceil(
                              (safeNumber(adminData?.owTravelTimeMins) * 2) / 60
                            )}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Travel Time Cost:</span>
                          <span>
                            $
                            {flaggingCostSummary.rtTravelTimeHoursCost?.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }
                            ) || '0.00'}
                          </span>
                        </div>

                        <div className='flex justify-between'>
                          <span>Over Time Hours:</span>
                          <span>{getOvertimeHours(formData)}</span>
                        </div>
                        <div></div>
                        <div className='flex justify-between'>
                          <span>Total Hours:</span>
                          <span className='font-medium'>
                            {getTotalHours(formData)}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Total Labor Cost:</span>
                          <span className='font-medium'>
                            $
                            {flaggingCostSummary.totalLaborCost?.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }
                            ) || '0.00'}
                          </span>
                        </div>
                        <div></div>
                        <div className='flex justify-between'>
                          <span>Truck and Fuel Cost:</span>
                          <span className='font-medium'>
                            $
                            {flaggingCostSummary.totalFuelCost?.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }
                            ) || '0.00'}
                          </span>
                        </div>
                        <div></div>
                        <div>
                          <Input
                            id='additional-costs'
                            type='number'
                            min={0}
                            step={0.01}
                            value={formData.additionalEquipmentCost || ''}
                            onChange={e =>
                              handleFormUpdate(
                                'additionalEquipmentCost',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder='Additional Costs'
                            className='w-full'
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className='flex flex-col w-1/2 ml-auto justify-end gap-4 text-sm'>
                        <div className='flex justify-between font-bold'>
                          <span>Total Cost:</span>
                          <span>
                            $
                            {flaggingCostSummary.totalFlaggingCost?.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }
                            ) || '0.00'}
                          </span>
                        </div>
                        <div className='flex justify-between font-medium'>
                          <span>Total Cost Per Hour:</span>
                          <span>
                            $
                            {flaggingCostSummary.totalCostPerHour?.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }
                            ) || '0.00'}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Total Equipment Revenue:</span>
                          <span>
                            $
                            {(
                              formData.arrowBoards.quantity *
                              formData.arrowBoards.cost +
                              formData.messageBoards.quantity *
                              formData.messageBoards.cost +
                              formData.TMA.quantity * formData.TMA.cost
                            ).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DrawerFooter>
            <div className='flex justify-end space-x-3 w-full'>
              <DrawerClose asChild>
                <Button variant='outline' onClick={handleCancel}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                onClick={handleSave}
                disabled={
                  !formData ||
                  (isStandardPricing && formData.personnel === 0) ||
                  (!isStandardPricing && formData.personnel === 0)
                }
              >
                {editingIndex !== null ? 'Update Flagging' : 'Save Flagging'}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default FlaggingServicesTab
