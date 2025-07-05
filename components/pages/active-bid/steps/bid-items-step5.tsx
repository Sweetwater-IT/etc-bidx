'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Loader, Edit, Calendar as CalendarIcon } from 'lucide-react'
import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useEstimate } from '@/contexts/EstimateContext'
import {
  EquipmentType,
  DynamicEquipmentInfo,
  CustomLightAndDrumItem,
  Phase,
  SheetingType,
  labelMapping,
  signList,
  lightAndDrumList,
  standardEquipmentList
} from '@/types/MPTEquipment'
import { safeNumber } from '@/lib/safe-number'
import {
  calculateLightDailyRateCosts,
  getAssociatedSignEquipment
} from '@/lib/mptRentalHelperFunctions'
import { createActiveBid, fetchReferenceData } from '@/lib/api-client'
import EquipmentRentalTab from '@/components/BidItems/equipment-rental-tab'
import SaleItemsStep from './sale-items-step'
import FlaggingServicesTab from '@/components/BidItems/flagging-tab'
import ServiceWorkTab from '@/components/BidItems/service-work-tab'
import PermanentSignsSummaryStep from '@/components/BidItems/permanent-signs-tab'
import { formatDecimal } from '@/lib/formatDecimals'
import { handleNextDigits } from '@/lib/handleNextDigits'
import EmptyContainer from '@/components/BidItems/empty-container'
import MutcdSignsStep3 from './mutcd-signs-step3'
import PhaseActionButtons from './phase-action-buttons'
import PhaseInfoTable from './phase-info-table'

// Default values for payback calculations and truck/fuel data
const DEFAULT_PAYBACK_PERIOD = 5 // 5 years
const DEFAULT_MPG_PER_TRUCK = 8
const DEFAULT_DISPATCH_FEE = 75
const DEFAULT_ANNUAL_UTILIZATION = 0.75
const DEFAULT_TARGET_MOIC = 2

//the key is an EquipmentType, the value is the EmergencyFields minus emergency in front
const emergencyFieldKeyMap: Record<string, string> = {
  BLights: 'BLites',
  ACLights: 'ACLites',
  sharps: 'Sharps',
  HIVP: 'HIVerticalPanels',
  TypeXIVP: 'TypeXIVerticalPanels'
}

const formatLabel = (key: string) => {
  return (
    labelMapping[key] ||
    key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  )
}

// Calculate days between dates (abstracted function)
const calculateDays = (start: Date, end: Date): number => {
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) // Include both start and end date
  return diffDays
}

interface PhaseDrawerData {
  name: string
  startDate: Date | null
  endDate: Date | null
  personnel: number
  days: number
  numberTrucks: number
  additionalRatedHours: number
  additionalNonRatedHours: number
  maintenanceTrips: number
}

const BidItemsStep5 = ({
  currentPhase,
  setCurrentPhase
}: {
  currentPhase: number
  setCurrentPhase: React.Dispatch<React.SetStateAction<number>>
}) => {
  const { mptRental, adminData, dispatch } = useEstimate()
  const [startDateOpen, setStartDateOpen] = useState<boolean>(false)
  const [endDateOpen, setEndDateOpen] = useState<boolean>(false)
  const [sandbagQuantity, setSandbagQuantity] = useState<number>(0)
  const [newCustomItem, setNewCustomItem] = useState<
    Omit<CustomLightAndDrumItem, 'id'>
  >({
    quantity: 0,
    cost: 0,
    usefulLife: 0
  })
  const [itemName, setItemName] = useState('')
  const [digits, setDigits] = useState<Record<string, string>>({})

  // Phase drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingPhaseIndex, setEditingPhaseIndex] = useState<number | null>(
    null
  )
  const [phaseFormData, setPhaseFormData] = useState<PhaseDrawerData | null>(
    null
  )

  const [activeTab, setActiveTab] = useState('mpt')

  const handleRateChange = (
    formattedValue: string,
    fieldKey: string,
    equipmentKey: string
  ) => {
    const numValue = Number(formattedValue)
    dispatch({
      type: 'UPDATE_ADMIN_DATA',
      payload: {
        key: 'emergencyFields',
        value: {
          ...adminData?.emergencyFields,
          [fieldKey]: numValue
        }
      }
    })
  }

  useEffect(() => {
    if (adminData?.emergencyFields) {
      const newDigits: Record<string, string> = {}
      lightAndDrumList.forEach(equipmentKey => {
        const emergencyKey = emergencyFieldKeyMap[equipmentKey] || equipmentKey
        const fieldKey = `emergency${emergencyKey}`
        const currentValue = adminData.emergencyFields[fieldKey] || 0
        newDigits[equipmentKey] = Math.round(currentValue * 100)
          .toString()
          .padStart(3, '0')
      })
      setDigits(newDigits)
    }
  }, [adminData?.emergencyFields])

  // Helper function to get digits for specific equipment
  const getDigitsForEquipment = (equipmentKey: string): string => {
    return digits[equipmentKey] || '000'
  }

  const updateDigitsForEquipment = (
    equipmentKey: string,
    newDigits: string
  ) => {
    setDigits(prev => ({
      ...prev,
      [equipmentKey]: newDigits
    }))
  }

  // Phase management functions
  const handleAddPhase = () => {
    setPhaseFormData({
      name: '',
      startDate: null,
      endDate: null,
      personnel: 0,
      days: 0,
      numberTrucks: 0,
      additionalRatedHours: 0,
      additionalNonRatedHours: 0,
      maintenanceTrips: 0
    })
    setEditingPhaseIndex(null)
    setDrawerOpen(true)
  }

  const handleEditPhase = (phaseIndex: number) => {
    const phase = mptRental.phases[phaseIndex]
    setPhaseFormData({
      name: phase.name,
      startDate: phase.startDate,
      endDate: phase.endDate,
      personnel: phase.personnel,
      days: phase.days,
      numberTrucks: phase.numberTrucks,
      additionalRatedHours: phase.additionalRatedHours,
      additionalNonRatedHours: phase.additionalNonRatedHours,
      maintenanceTrips: phase.maintenanceTrips
    })
    setEditingPhaseIndex(phaseIndex)
    setDrawerOpen(true)
  }

  const handleDeletePhase = (phaseIndex: number) => {
    if (mptRental.phases.length > 1) {
      dispatch({ type: 'DELETE_MPT_PHASE', payload: phaseIndex })
      if (currentPhase >= phaseIndex && currentPhase > 0) {
        setCurrentPhase(currentPhase - 1)
      }
    }
  }

  const handlePhaseFormUpdate = (field: keyof PhaseDrawerData, value: any) => {
    if (phaseFormData) {
      setPhaseFormData({ ...phaseFormData, [field]: value })
    }
  }

  const handleDateChange = (
    value: Date | undefined,
    name: 'startDate' | 'endDate'
  ) => {
    if (!value || !phaseFormData) return

    const updatedFormData = { ...phaseFormData, [name]: value }

    if (updatedFormData.startDate && updatedFormData.endDate) {
      const days = calculateDays(
        updatedFormData.startDate,
        updatedFormData.endDate
      )
      updatedFormData.days = days
    }

    setPhaseFormData(updatedFormData)
    if (name === 'startDate') {
      setStartDateOpen(false)
    } else {
      setEndDateOpen(false)
    }
  }

  const setEndDateFromDays = (days: number) => {
    if (!phaseFormData?.startDate) return

    const startDate = phaseFormData.startDate
    const newEndDate = new Date(
      startDate.getTime() + days * 24 * 60 * 60 * 1000
    )

    setPhaseFormData({
      ...phaseFormData,
      endDate: newEndDate,
      days: days
    })
  }

  const handleUseAdminDates = (useAdminDates: boolean) => {
    if (!phaseFormData) return

    if (useAdminDates && (!adminData.startDate || !adminData.endDate)) {
      toast.error('Project start and end dates are not set')
      return
    } else if (useAdminDates) {
      const days = calculateDays(adminData.startDate!, adminData.endDate!)
      setPhaseFormData({
        ...phaseFormData,
        startDate: adminData.startDate!,
        endDate: adminData.endDate!,
        days: days
      })
    }
  }

  const handleSavePhase = () => {
    if (!phaseFormData) return

    if (editingPhaseIndex !== null) {
      // Update existing phase
      dispatch({
        type: 'UPDATE_PHASE_NAME',
        payload: {
          value: phaseFormData.name.toUpperCase(),
          phase: editingPhaseIndex
        }
      })

      if (phaseFormData.startDate) {
        dispatch({
          type: 'UPDATE_MPT_PHASE_START_END',
          payload: {
            key: 'startDate',
            value: phaseFormData.startDate,
            phase: editingPhaseIndex
          }
        })
      }

      if (phaseFormData.endDate) {
        dispatch({
          type: 'UPDATE_MPT_PHASE_START_END',
          payload: {
            key: 'endDate',
            value: phaseFormData.endDate,
            phase: editingPhaseIndex
          }
        })
      }

      dispatch({
        type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
        payload: {
          key: 'days',
          value: phaseFormData.days,
          phase: editingPhaseIndex
        }
      })

      dispatch({
        type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
        payload: {
          key: 'personnel',
          value: phaseFormData.personnel,
          phase: editingPhaseIndex
        }
      })

      dispatch({
        type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
        payload: {
          key: 'numberTrucks',
          value: phaseFormData.numberTrucks,
          phase: editingPhaseIndex
        }
      })

      dispatch({
        type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
        payload: {
          key: 'additionalRatedHours',
          value: phaseFormData.additionalRatedHours,
          phase: editingPhaseIndex
        }
      })

      dispatch({
        type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
        payload: {
          key: 'additionalNonRatedHours',
          value: phaseFormData.additionalNonRatedHours,
          phase: editingPhaseIndex
        }
      })

      dispatch({
        type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
        payload: {
          key: 'maintenanceTrips',
          value: phaseFormData.maintenanceTrips,
          phase: editingPhaseIndex
        }
      })
    } else {
      // Add new phase
      if (
        mptRental.phases.length === 1 &&
        mptRental.phases[0].name === '' &&
        !mptRental.phases[0].startDate
      ) {
        // This is the first phase being edited from default, update directly
        dispatch({
          type: 'UPDATE_PHASE_NAME',
          payload: { value: phaseFormData.name.toUpperCase(), phase: 0 }
        })

        if (phaseFormData.startDate) {
          dispatch({
            type: 'UPDATE_MPT_PHASE_START_END',
            payload: {
              key: 'startDate',
              value: phaseFormData.startDate,
              phase: 0
            }
          })
        }

        if (phaseFormData.endDate) {
          dispatch({
            type: 'UPDATE_MPT_PHASE_START_END',
            payload: { key: 'endDate', value: phaseFormData.endDate, phase: 0 }
          })
        }

        dispatch({
          type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
          payload: { key: 'days', value: phaseFormData.days, phase: 0 }
        })

        dispatch({
          type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
          payload: {
            key: 'personnel',
            value: phaseFormData.personnel,
            phase: 0
          }
        })

        dispatch({
          type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
          payload: {
            key: 'numberTrucks',
            value: phaseFormData.numberTrucks,
            phase: 0
          }
        })

        dispatch({
          type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
          payload: {
            key: 'additionalRatedHours',
            value: phaseFormData.additionalRatedHours,
            phase: 0
          }
        })

        dispatch({
          type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
          payload: {
            key: 'additionalNonRatedHours',
            value: phaseFormData.additionalNonRatedHours,
            phase: 0
          }
        })

        dispatch({
          type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
          payload: {
            key: 'maintenanceTrips',
            value: phaseFormData.maintenanceTrips,
            phase: 0
          }
        })

        setCurrentPhase(0)
      } else {
        // Add a new phase
        dispatch({ type: 'ADD_MPT_PHASE' })
        const newPhaseIndex = mptRental.phases.length

        // Update the new phase with form data
        setTimeout(() => {
          dispatch({
            type: 'UPDATE_PHASE_NAME',
            payload: {
              value: phaseFormData.name.toUpperCase(),
              phase: newPhaseIndex
            }
          })

          if (phaseFormData.startDate) {
            dispatch({
              type: 'UPDATE_MPT_PHASE_START_END',
              payload: {
                key: 'startDate',
                value: phaseFormData.startDate,
                phase: newPhaseIndex
              }
            })
          }

          if (phaseFormData.endDate) {
            dispatch({
              type: 'UPDATE_MPT_PHASE_START_END',
              payload: {
                key: 'endDate',
                value: phaseFormData.endDate,
                phase: newPhaseIndex
              }
            })
          }

          dispatch({
            type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
            payload: {
              key: 'days',
              value: phaseFormData.days,
              phase: newPhaseIndex
            }
          })

          dispatch({
            type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
            payload: {
              key: 'personnel',
              value: phaseFormData.personnel,
              phase: newPhaseIndex
            }
          })

          dispatch({
            type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
            payload: {
              key: 'numberTrucks',
              value: phaseFormData.numberTrucks,
              phase: newPhaseIndex
            }
          })

          dispatch({
            type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
            payload: {
              key: 'additionalRatedHours',
              value: phaseFormData.additionalRatedHours,
              phase: newPhaseIndex
            }
          })

          dispatch({
            type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
            payload: {
              key: 'additionalNonRatedHours',
              value: phaseFormData.additionalNonRatedHours,
              phase: newPhaseIndex
            }
          })

          dispatch({
            type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR',
            payload: {
              key: 'maintenanceTrips',
              value: phaseFormData.maintenanceTrips,
              phase: newPhaseIndex
            }
          })
        }, 0)

        setCurrentPhase(newPhaseIndex)
      }
    }

    handleCancelPhase()
  }

  const handleCancelPhase = () => {
    setDrawerOpen(false)
    setPhaseFormData(null)
    setEditingPhaseIndex(null)
  }

  // Fetch equipment data
  useEffect(() => {
    const initializeEquipmentData = async () => {
      try {
        // Set default values for truck and fuel costs
        dispatch({
          type: 'UPDATE_TRUCK_AND_FUEL_COSTS',
          payload: { key: 'mpgPerTruck', value: DEFAULT_MPG_PER_TRUCK }
        })

        dispatch({
          type: 'UPDATE_TRUCK_AND_FUEL_COSTS',
          payload: { key: 'dispatchFee', value: DEFAULT_DISPATCH_FEE }
        })

        // Set default values for payback calculations
        dispatch({
          type: 'UPDATE_PAYBACK_CALCULATIONS',
          payload: { key: 'targetMOIC', value: DEFAULT_TARGET_MOIC }
        })

        dispatch({
          type: 'UPDATE_PAYBACK_CALCULATIONS',
          payload: { key: 'paybackPeriod', value: DEFAULT_PAYBACK_PERIOD }
        })

        dispatch({
          type: 'UPDATE_PAYBACK_CALCULATIONS',
          payload: {
            key: 'annualUtilization',
            value: DEFAULT_ANNUAL_UTILIZATION
          }
        })

        // Fetch equipment data from API
        const equipmentData = await fetchReferenceData('mpt equipment')

        if (Array.isArray(equipmentData)) {
          // Process regular equipment data
          equipmentData.forEach(item => {
            if (!item) return

            // Find matching equipment type
            const equipmentType = getEquipmentTypeFromName(item.name)
            if (!equipmentType) return

            // Update price
            dispatch({
              type: 'UPDATE_STATIC_EQUIPMENT_INFO',
              payload: {
                type: equipmentType,
                property: 'price',
                value: parseFloat(item.price) || 0
              }
            })

            // Update useful life
            dispatch({
              type: 'UPDATE_STATIC_EQUIPMENT_INFO',
              payload: {
                type: equipmentType,
                property: 'usefulLife',
                value: item.depreciation_rate_useful_life || 365
              }
            })

            // Update payback period (using default if not available)
            dispatch({
              type: 'UPDATE_STATIC_EQUIPMENT_INFO',
              payload: {
                type: equipmentType,
                property: 'paybackPeriod',
                value: item.payback_period || DEFAULT_PAYBACK_PERIOD
              }
            })

            // Update discount rate if available
            if (item.discount_rate !== undefined) {
              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: equipmentType,
                  property: 'discountRate',
                  value: parseFloat(item.discount_rate) || 0
                }
              })
            }
          })

          // Process sign data separately
          signList.forEach(sign => {
            const matchedItem = equipmentData.find(
              (item: any) => item.name === sign.dbName
            )
            if (matchedItem) {
              const price = parseFloat(matchedItem.price)

              // Update price
              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'price',
                  value: price
                }
              })

              // Update useful life
              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'usefulLife',
                  value: matchedItem.depreciation_rate_useful_life || 365
                }
              })

              // Update payback period
              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'paybackPeriod',
                  value: matchedItem.payback_period || DEFAULT_PAYBACK_PERIOD
                }
              })

              // Update discount rate if available
              if (matchedItem.discount_rate) {
                dispatch({
                  type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                  payload: {
                    type: sign.key,
                    property: 'discountRate',
                    value: parseFloat(matchedItem.discount_rate) || 0
                  }
                })
              }
            } else {
              console.warn(
                `No matching sign data found for database name: ${sign.dbName}`
              )

              // Set default values for signs if not found
              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'price',
                  value: getDefaultSignPrice(sign.key)
                }
              })

              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'usefulLife',
                  value: 365 // 1 year default
                }
              })

              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'paybackPeriod',
                  value: DEFAULT_PAYBACK_PERIOD
                }
              })
            }
          })
        }
      } catch (error) {
        console.error('Error initializing equipment data:', error)

        // Set default values for all equipment types in case of error
        ;[...standardEquipmentList, ...lightAndDrumList].forEach(
          equipmentType => {
            // Set default price (placeholder)
            dispatch({
              type: 'UPDATE_STATIC_EQUIPMENT_INFO',
              payload: {
                type: equipmentType,
                property: 'price',
                value: getDefaultPrice(equipmentType)
              }
            })

            // Set default useful life (365 days = 1 year)
            dispatch({
              type: 'UPDATE_STATIC_EQUIPMENT_INFO',
              payload: {
                type: equipmentType,
                property: 'usefulLife',
                value: 365
              }
            })

            // Set default payback period
            dispatch({
              type: 'UPDATE_STATIC_EQUIPMENT_INFO',
              payload: {
                type: equipmentType,
                property: 'paybackPeriod',
                value: DEFAULT_PAYBACK_PERIOD
              }
            })
          }
        )

        // Set default values for signs
        signList.forEach(sign => {
          dispatch({
            type: 'UPDATE_STATIC_EQUIPMENT_INFO',
            payload: {
              type: sign.key,
              property: 'price',
              value: getDefaultSignPrice(sign.key)
            }
          })

          dispatch({
            type: 'UPDATE_STATIC_EQUIPMENT_INFO',
            payload: {
              type: sign.key,
              property: 'usefulLife',
              value: 365
            }
          })

          dispatch({
            type: 'UPDATE_STATIC_EQUIPMENT_INFO',
            payload: {
              type: sign.key,
              property: 'paybackPeriod',
              value: DEFAULT_PAYBACK_PERIOD
            }
          })
        })
      }
    }

    initializeEquipmentData()
  }, [dispatch])

  // Helper function to map API item name to equipment type
  const getEquipmentTypeFromName = (name: string): EquipmentType | null => {
    // Map database names to equipment types
    const nameToType: Record<string, EquipmentType> = {
      "4' Ft Type III": 'fourFootTypeIII',
      'H Stands': 'hStand',
      'Posts 12ft': 'post',
      '6 Ft Wings': 'sixFootWings',
      'SL Metal Stands': 'metalStands',
      Covers: 'covers',
      'Sand Bag': 'sandbag',
      'HI Vertical Panels': 'HIVP',
      'Type XI Vertical Panels': 'TypeXIVP',
      'B-Lites': 'BLights',
      'A/C-Lites': 'ACLights',
      Sharps: 'sharps'
    }

    return nameToType[name] || null
  }

  // Helper function to get default price for equipment type (fallback values)
  const getDefaultPrice = (equipmentType: EquipmentType): number => {
    const defaultPrices: Record<string, number> = {
      fourFootTypeIII: 200,
      hStand: 150,
      post: 100,
      sixFootWings: 180,
      metalStands: 120,
      covers: 50,
      sandbag: 10,
      HIVP: 80,
      TypeXIVP: 90,
      BLights: 70,
      ACLights: 120,
      sharps: 60
    }

    return defaultPrices[equipmentType] || 100
  }

  // Helper function to get default price for sign sheeting types
  const getDefaultSignPrice = (sheetingType: SheetingType): number => {
    const defaultSignPrices: Record<SheetingType, number> = {
      HI: 150,
      DG: 120,
      Special: 200
    }

    return defaultSignPrices[sheetingType] || 150
  }

  // Calculate sandbag quantity based on equipment
  useEffect(() => {
    if (mptRental?.phases && mptRental.phases[currentPhase]) {
      const phase = mptRental.phases[currentPhase]
      const hStandQuantity = phase.standardEquipment.hStand?.quantity || 0
      const fourFootTypeIIIQuantity =
        phase.standardEquipment.fourFootTypeIII?.quantity || 0
      const sixFootWingsQuantity =
        phase.standardEquipment.sixFootWings?.quantity || 0

      const calculatedSandbagQuantity =
        hStandQuantity * 6 +
        fourFootTypeIIIQuantity * 10 +
        sixFootWingsQuantity * 4

      dispatch({
        type: 'ADD_MPT_ITEM_NOT_SIGN',
        payload: {
          phaseNumber: currentPhase,
          equipmentType: 'sandbag',
          equipmentProperty: 'quantity',
          value: calculatedSandbagQuantity
        }
      })

      setSandbagQuantity(calculatedSandbagQuantity)
    }
  }, [
    mptRental?.phases?.[currentPhase]?.standardEquipment?.fourFootTypeIII
      ?.quantity,
    mptRental?.phases?.[currentPhase]?.standardEquipment?.hStand?.quantity,
    mptRental?.phases?.[currentPhase]?.standardEquipment?.sixFootWings
      ?.quantity,
    dispatch,
    currentPhase
  ])

  // Handle equipment input changes
  const handleStandardInputChange = (
    value: number,
    equipmentKey: EquipmentType,
    property: keyof DynamicEquipmentInfo
  ) => {
    dispatch({
      type: 'ADD_MPT_ITEM_NOT_SIGN',
      payload: {
        phaseNumber: currentPhase,
        equipmentType: equipmentKey,
        equipmentProperty: property,
        value: safeNumber(value)
      }
    })
  }

  // Handle custom item input changes
  const handleNewItemInputChange = (
    field: keyof Omit<CustomLightAndDrumItem, 'id'>,
    value: number
  ) => {
    setNewCustomItem(prev => ({
      ...prev,
      [field]: safeNumber(value)
    }))
  }

  // Add custom item to the list
  const handleAddCustomItem = () => {
    if (itemName && newCustomItem.quantity > 0 && newCustomItem.cost > 0) {
      dispatch({
        type: 'ADD_LIGHT_AND_DRUM_CUSTOM_ITEM',
        payload: {
          phaseNumber: currentPhase,
          item: {
            id: itemName,
            ...newCustomItem
          }
        }
      })
      setNewCustomItem({
        quantity: 0,
        cost: 0,
        usefulLife: 0
      })
      setItemName('')
    }
  }

  // Handle emergency job toggle
  const handleEmergencyJobChange = (checked: boolean) => {
    dispatch({
      type: 'UPDATE_ADMIN_DATA',
      payload: {
        key: 'emergencyJob',
        value: checked
      }
    })
  }

  const getEquipmentQuantity = (
    equipmentKey: EquipmentType
  ): number | undefined => {
    if (!mptRental?.phases || !mptRental.phases[currentPhase]) return undefined
    return safeNumber(
      mptRental.phases[currentPhase].standardEquipment[equipmentKey]?.quantity
    )
  }

  // Get minimum allowed quantity for an equipment type
  const getMinQuantity = (equipmentKey: EquipmentType): number | undefined => {
    if (!mptRental?.phases || !mptRental.phases[currentPhase]) return undefined

    const associatedEquipment = getAssociatedSignEquipment(
      mptRental.phases[currentPhase]
    )

    switch (equipmentKey) {
      case 'covers':
        return associatedEquipment.covers
      case 'fourFootTypeIII':
        return associatedEquipment.fourFootTypeIII
      case 'hStand':
        return associatedEquipment.hStand
      case 'post':
        return associatedEquipment.post
      case 'BLights':
        return associatedEquipment.BLights
      default:
        return 0
    }
  }

  return (
    <div>
      <div className='flex border-b border-gray-200 mb-6'>
        <button
          className={cn(
            'px-4 py-2 font-semibold text-base focus:outline-none',
            activeTab === 'mpt'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-500'
          )}
          onClick={() => setActiveTab('mpt')}
          type='button'
        >
          MPT
        </button>
        <button
          className={cn(
            'px-4 py-2 font-semibold text-base focus:outline-none',
            activeTab === 'equipment'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-500'
          )}
          onClick={() => setActiveTab('equipment')}
          type='button'
        >
          Equipment Rental
        </button>
        <button
          className={cn(
            'px-4 py-2 font-semibold text-base focus:outline-none',
            activeTab === 'permanent'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-500'
          )}
          onClick={() => setActiveTab('permanent')}
          type='button'
        >
          Permanent Signs
        </button>
      </div>
      {activeTab === 'mpt' && (
        <div className='bg-white rounded-b-lg p-6'>
          <div className='mt-2 mb-6 ml-12'>
            <div className='flex items-center justify-between pb-2 border-b mb-6'>
              <h3 className='text-xl text-black font-semibold'>MPT</h3>
              <Button onClick={handleAddPhase}>
                <Plus className='mr-2 h-4 w-4' />
                Add Phase
              </Button>
            </div>
            {mptRental.phases.length === 0 ? (
              <EmptyContainer
                topText='No phases configured yet'
                subtext='When you add phases, they will appear here as tabs.'
              />
            ) : (
              <div>
                {mptRental.phases.map((phase, index) => (
                  <div key={index}>
                    <div className='flex justify-end'>
                      <PhaseActionButtons
                        onDelete={handleDeletePhase}
                        onEdit={handleEditPhase}
                        totalPhases={mptRental.phases.length}
                        phaseIndex={index}
                      />
                    </div>
                    <PhaseInfoTable phase={phase} index={index} />
                    <MutcdSignsStep3 currentPhase={currentPhase} />
                    <div>
                      <div className='flex items-center my-8'>
                        <div className='flex-grow border-t border-black'></div>
                        <h3 className='mx-4 text-base font-semibold whitespace-nowrap'>
                          MPT Equipment
                        </h3>
                        <div className='flex-grow border-t border-black'></div>
                      </div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                        {standardEquipmentList.map(equipmentKey =>
                          equipmentKey === 'sandbag' ? (
                            <div key={equipmentKey} className='p-2 rounded-md'>
                              <div className='font-medium mb-2'>
                                {formatLabel(equipmentKey)}
                              </div>
                              <div className='text-muted-foreground'>
                                Quantity:{' '}
                                {phase.standardEquipment.sandbag?.quantity || 0}
                              </div>
                            </div>
                          ) : (
                            <div key={equipmentKey} className='rounded-md'>
                              <div className='font-medium mb-2'>
                                {formatLabel(equipmentKey)}
                              </div>
                              <div className='flex flex-col gap-2'>
                                <Label
                                  htmlFor={`quantity-${equipmentKey}-${index}`}
                                  className='flex text-muted-foreground'
                                >
                                  Quantity:
                                </Label>
                                <Input
                                  id={`quantity-${equipmentKey}-${index}`}
                                  type='number'
                                  min={getMinQuantity(equipmentKey)}
                                  value={
                                    phase.standardEquipment[equipmentKey]
                                      ?.quantity || ''
                                  }
                                  onChange={e =>
                                    handleStandardInputChange(
                                      parseFloat(e.target.value) || 0,
                                      equipmentKey,
                                      'quantity'
                                    )
                                  }
                                  className='w-full'
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <Separator className='my-6' />
                    <div>
                      <div className='flex items-center my-8'>
                        <div className='flex-grow border-t border-black'></div>
                        <h3 className='mx-4 text-base font-semibold whitespace-nowrap'>
                          Light and Drum Rental
                        </h3>
                        <div className='flex-grow border-t border-black'></div>
                      </div>
                      <div className='grid grid-cols-2 md:grid-cols-3'>
                        {lightAndDrumList.map(equipmentKey => (
                          <div key={equipmentKey} className='p-2 rounded-md'>
                            <div className='font-medium mb-2'>
                              {formatLabel(equipmentKey)}
                            </div>
                            <div className='flex flex-col gap-2 mb-2'>
                              <Label
                                htmlFor={`quantity-light-${equipmentKey}-${index}`}
                                className='text-muted-foreground'
                              >
                                Quantity:
                              </Label>
                              <Input
                                id={`quantity-light-${equipmentKey}-${index}`}
                                type='number'
                                min={getMinQuantity(equipmentKey)}
                                value={
                                  phase.standardEquipment[equipmentKey]
                                    ?.quantity || ''
                                }
                                onChange={e =>
                                  handleStandardInputChange(
                                    parseFloat(e.target.value) || 0,
                                    equipmentKey,
                                    'quantity'
                                  )
                                }
                                className='w-full'
                              />
                            </div>
                            {adminData?.emergencyJob && (
                              <div className='flex flex-col w-1/3 gap-2 mt-2'>
                                <Label
                                  htmlFor={`emergency-${equipmentKey}-${index}`}
                                  className='text-muted-foreground'
                                >
                                  Emergency Rate:
                                </Label>
                                <Input
                                  id={`emergency-${equipmentKey}-${index}`}
                                  inputMode='decimal'
                                  pattern='^\\d*(\\.\\d{0,2})?$'
                                  className='w-full'
                                  value={`$ ${formatDecimal(
                                    getDigitsForEquipment(equipmentKey)
                                  )}`}
                                  onChange={e => {
                                    const ev = e.nativeEvent as InputEvent
                                    const { inputType } = ev
                                    const data = (ev.data || '').replace(
                                      /\$/g,
                                      ''
                                    )

                                    const currentDigits =
                                      getDigitsForEquipment(equipmentKey)
                                    const nextDigits = handleNextDigits(
                                      currentDigits,
                                      inputType,
                                      data
                                    )
                                    updateDigitsForEquipment(
                                      equipmentKey,
                                      nextDigits
                                    )

                                    const formatted = (
                                      parseInt(nextDigits, 10) / 100
                                    ).toFixed(2)
                                    const emergencyKey =
                                      emergencyFieldKeyMap[equipmentKey] ||
                                      equipmentKey
                                    const fieldKey = `emergency${emergencyKey}`
                                    handleRateChange(
                                      formatted,
                                      fieldKey,
                                      equipmentKey
                                    )
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator className='my-6' />
                    <div>
                      <h3 className='text-base font-semibold mb-4'>
                        Custom Equipment
                      </h3>
                      <div className='grid grid-cols-12 gap-4 mb-4'>
                        <div className='col-span-3'>
                          <Label className='mb-2' htmlFor='itemName'>
                            Item Name
                          </Label>
                          <Input
                            id='itemName'
                            value={itemName}
                            onChange={e => setItemName(e.target.value)}
                            placeholder='Enter item name'
                          />
                        </div>
                        <div className='col-span-3'>
                          <Label className='mb-2' htmlFor='quantity'>
                            Quantity
                          </Label>
                          <Input
                            id='quantity'
                            type='number'
                            min={0}
                            value={newCustomItem.quantity || ''}
                            onChange={e =>
                              handleNewItemInputChange(
                                'quantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder=''
                          />
                        </div>
                        <div className='col-span-3'>
                          <Label className='mb-2' htmlFor='cost'>
                            Cost
                          </Label>
                          <Input
                            id='cost'
                            type='number'
                            min={0}
                            step={0.01}
                            value={newCustomItem.cost || ''}
                            onChange={e =>
                              handleNewItemInputChange(
                                'cost',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder=''
                          />
                        </div>
                        <div className='col-span-3'>
                          <Label className='mb-2' htmlFor='usefulLife'>
                            Useful Life (days)
                          </Label>
                          <Input
                            id='usefulLife'
                            type='number'
                            min={0}
                            value={newCustomItem.usefulLife || ''}
                            onChange={e =>
                              handleNewItemInputChange(
                                'usefulLife',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder=''
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleAddCustomItem}
                        className='mt-2'
                        disabled={
                          !itemName ||
                          newCustomItem.quantity <= 0 ||
                          newCustomItem.cost <= 0
                        }
                        aria-disabled={
                          !itemName ||
                          newCustomItem.quantity <= 0 ||
                          newCustomItem.cost <= 0
                        }
                      >
                        <Plus className='mr-2 h-4 w-4' /> Add Custom Item
                      </Button>
                    </div>
                    {phase.customLightAndDrumItems?.length > 0 && (
                      <div className='mt-6'>
                        <h3 className='text-base font-semibold mb-4'>
                          Custom Items
                        </h3>
                        <div className='grid grid-cols-12 gap-4 mb-4'>
                          <div className='col-span-2 font-medium'>
                            Item Name
                          </div>
                          <div className='col-span-3 font-medium'>Quantity</div>
                          <div className='col-span-3 font-medium'>Cost</div>
                          <div className='col-span-2 font-medium'>
                            Useful Life
                          </div>
                          <div className='col-span-2 font-medium'>
                            Daily Price
                          </div>
                        </div>
                        <div className='space-y-4'>
                          {phase.customLightAndDrumItems.map(item => (
                            <div
                              key={item.id}
                              className='grid grid-cols-12 gap-4 items-center'
                            >
                              <div className='col-span-2'>{item.id}</div>
                              <div className='col-span-3'>
                                <Input
                                  type='number'
                                  min={0}
                                  value={item.quantity}
                                  onChange={e =>
                                    dispatch({
                                      type: 'UPDATE_LIGHT_AND_DRUM_CUSTOM_ITEM',
                                      payload: {
                                        phaseNumber: index,
                                        id: item.id,
                                        key: 'quantity',
                                        value: parseFloat(e.target.value) || 0
                                      }
                                    })
                                  }
                                />
                              </div>
                              <div className='col-span-3'>
                                <Input
                                  type='number'
                                  min={0}
                                  step={0.01}
                                  value={item.cost}
                                  onChange={e =>
                                    dispatch({
                                      type: 'UPDATE_LIGHT_AND_DRUM_CUSTOM_ITEM',
                                      payload: {
                                        phaseNumber: index,
                                        id: item.id,
                                        key: 'cost',
                                        value: parseFloat(e.target.value) || 0
                                      }
                                    })
                                  }
                                />
                              </div>
                              <div className='col-span-2'>
                                <Input
                                  type='number'
                                  min={0}
                                  value={item.usefulLife}
                                  onChange={e =>
                                    dispatch({
                                      type: 'UPDATE_LIGHT_AND_DRUM_CUSTOM_ITEM',
                                      payload: {
                                        phaseNumber: index,
                                        id: item.id,
                                        key: 'usefulLife',
                                        value: parseFloat(e.target.value) || 0
                                      }
                                    })
                                  }
                                />
                              </div>
                              <div className='col-span-2'>
                                $
                                {calculateLightDailyRateCosts(
                                  mptRental,
                                  item.cost
                                ).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'equipment' && (
        <div className='bg-white rounded-b-lg p-6'>
          <EquipmentRentalTab />
        </div>
      )}
      {activeTab === 'permanent' && (
        <div className='bg-white rounded-b-lg p-6'>
          <PermanentSignsSummaryStep />
        </div>
      )}

      {/* Phase Drawer */}
      <Drawer open={drawerOpen} direction='right' onOpenChange={setDrawerOpen}>
        <DrawerContent className='min-w-lg'>
          <div className='flex flex-col gap-2 relative z-10 bg-background'>
            <DrawerHeader>
              <DrawerTitle>
                {editingPhaseIndex !== null
                  ? `Edit Phase ${editingPhaseIndex + 1}`
                  : 'Add Phase'}
              </DrawerTitle>
            </DrawerHeader>
            <Separator className='w-full -mt-2' />
          </div>

          {phaseFormData && (
            <div className='px-4 space-y-6 mt-4 overflow-y-auto h-full'>
              <div className='space-y-4'>
                <h4 className='font-medium'>Phase Information</h4>

                <div className='flex items-center gap-x-2'>
                  <Checkbox
                    checked={
                      phaseFormData.startDate === adminData.startDate &&
                      phaseFormData.endDate === adminData.endDate
                    }
                    aria-label='Use same start and end dates as admin data'
                    onCheckedChange={handleUseAdminDates}
                  />
                  <div className='text-muted-foreground text-sm'>
                    Use same start and end dates as admin data
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4'>
                  <div>
                    <Label className='mb-2' htmlFor='phase-name'>
                      Phase Name (Optional)
                    </Label>
                    <Input
                      id='phase-name'
                      value={phaseFormData.name}
                      onChange={e =>
                        handlePhaseFormUpdate('name', e.target.value)
                      }
                      placeholder={`Phase ${
                        (editingPhaseIndex ?? mptRental.phases.length) + 1
                      }`}
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='startDate'>Start Date</Label>
                      <Popover
                        open={startDateOpen}
                        onOpenChange={setStartDateOpen}
                        modal={true}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className='w-full justify-start text-left font-normal'
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {phaseFormData.startDate ? (
                              format(phaseFormData.startDate, 'PPP')
                            ) : (
                              <span>Select start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0'>
                          <Calendar
                            mode='single'
                            selected={phaseFormData.startDate ?? undefined}
                            onSelect={date =>
                              handleDateChange(date, 'startDate')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='endDate'>End Date</Label>
                      <Popover
                        open={endDateOpen}
                        onOpenChange={setEndDateOpen}
                        modal={true}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className='w-full justify-start text-left font-normal'
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {phaseFormData.endDate ? (
                              format(phaseFormData.endDate, 'PPP')
                            ) : (
                              <span>Select end date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0'>
                          <Calendar
                            mode='single'
                            selected={phaseFormData.endDate ?? undefined}
                            onSelect={date => handleDateChange(date, 'endDate')}
                            initialFocus
                            disabled={date =>
                              phaseFormData.startDate
                                ? date < phaseFormData.startDate
                                : false
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {phaseFormData.startDate && (
                    <div className='bg-muted p-4 rounded-md'>
                      <div className='flex flex-col gap-4'>
                        <div className='text-sm font-medium'>
                          Set end date as number of days out from start date:
                        </div>
                        <div className='flex items-center gap-3'>
                          <Badge
                            className='px-3 py-1 cursor-pointer hover:bg-primary'
                            onClick={() => setEndDateFromDays(30)}
                          >
                            30
                          </Badge>
                          <Badge
                            className='px-3 py-1 cursor-pointer hover:bg-primary'
                            onClick={() => setEndDateFromDays(60)}
                          >
                            60
                          </Badge>
                          <Badge
                            className='px-3 py-1 cursor-pointer hover:bg-primary'
                            onClick={() => setEndDateFromDays(90)}
                          >
                            90
                          </Badge>
                          <div className='flex items-center gap-2'>
                            <Input
                              className='w-20'
                              onChange={e =>
                                setEndDateFromDays(
                                  safeNumber(parseInt(e.target.value))
                                )
                              }
                              placeholder='Days'
                              type='number'
                              min='1'
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <h4 className='font-medium'>Trip and Labor</h4>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='mb-2' htmlFor='personnel'>
                      Number of Personnel
                    </Label>
                    <Input
                      id='personnel'
                      type='number'
                      min={0}
                      value={phaseFormData.personnel || ''}
                      onChange={e =>
                        handlePhaseFormUpdate(
                          'personnel',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className='mb-2' htmlFor='trucks'>
                      Number of Trucks
                    </Label>
                    <Input
                      id='trucks'
                      type='number'
                      min={0}
                      value={phaseFormData.numberTrucks || ''}
                      onChange={e =>
                        handlePhaseFormUpdate(
                          'numberTrucks',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4'>
                  <div>
                    <Label className='mb-2' htmlFor='maintenance-trips'>
                      Additional Trips
                    </Label>
                    <Input
                      id='maintenance-trips'
                      type='number'
                      min={0}
                      value={phaseFormData.maintenanceTrips || ''}
                      onChange={e =>
                        handlePhaseFormUpdate(
                          'maintenanceTrips',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className='mb-2' htmlFor='rated-hours'>
                      Additional Rated Hours
                    </Label>
                    <Input
                      id='rated-hours'
                      type='number'
                      min={0}
                      step={0.1}
                      value={phaseFormData.additionalRatedHours || ''}
                      onChange={e =>
                        handlePhaseFormUpdate(
                          'additionalRatedHours',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className='mb-2' htmlFor='non-rated-hours'>
                      Additional Non-Rated Hours
                    </Label>
                    <Input
                      id='non-rated-hours'
                      type='number'
                      min={0}
                      step={0.1}
                      value={phaseFormData.additionalNonRatedHours || ''}
                      onChange={e =>
                        handlePhaseFormUpdate(
                          'additionalNonRatedHours',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DrawerFooter>
            <div className='flex justify-end space-x-3 w-full'>
              <DrawerClose asChild>
                <Button variant='outline' onClick={handleCancelPhase}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button onClick={handleSavePhase} disabled={!phaseFormData}>
                {editingPhaseIndex !== null ? 'Update Phase' : 'Save Phase'}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default BidItemsStep5
