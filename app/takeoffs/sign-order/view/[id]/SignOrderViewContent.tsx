'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { SiteHeader } from '@/components/site-header'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import EquipmentTotalsAccordion from './EquipmentTotalsAccordion'
import { useEstimate } from '@/contexts/EstimateContext'

interface SignOrder {
  id: number
  requestor: string
  contractor_id: number
  contractors?: { name: string }
  branch?: string
  order_date: string
  need_date: string
  start_date: string
  end_date: string
  job_number: string
  contract_number: string
  sale: boolean
  rental: boolean
  perm_signs: boolean
  status: string
  shop_status?: string
  assigned_to?: string
  signs?: any // The JSONB field containing sign data
}

interface SignItem {
  id: number
  designation: string
  description: string
  width: number
  height: number
  quantity: number
  sheeting: string
  structure: string
  bLights: number
  covers: number
  dimensions?: string // Computed field for display
}

// Helper function to determine branch based on ID (temporary solution)
const determineBranch = (id: number): string => {
  if (id < 100) return 'Hatfield'
  if (id < 200) return 'Turbotville'
  if (id < 300) return 'Bedford'
  return 'Archived'
}

export default function SignOrderViewContent() {
  const params = useParams()
  const router = useRouter()
  const { dispatch } = useEstimate()
  const [signOrder, setSignOrder] = useState<SignOrder | null>(null)
  const [signItems, setSignItems] = useState<SignItem[]>([])
  const [loading, setLoading] = useState(true)
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined)
  const [needDate, setNeedDate] = useState<Date | undefined>(undefined)

  // Order type checkboxes state
  const [isSale, setIsSale] = useState(false)
  const [isRental, setIsRental] = useState(false)
  const [isPermanent, setIsPermanent] = useState(false)

  const SIGN_COLUMNS = [
    {
      key: 'designation',
      title: 'Designation',
      sortable: false
    },
    {
      key: 'description',
      title: 'Description',
      sortable: false
    },
    {
      key: 'dimensions',
      title: 'Dimensions',
      sortable: false
    },
    {
      key: 'quantity',
      title: 'Quantity',
      sortable: false
    },
    {
      key: 'sheeting',
      title: 'Sheeting',
      sortable: false
    },
    {
      key: 'structure',
      title: 'Structure',
      sortable: false
    },
    {
      key: 'bLights',
      title: 'B Lights',
      sortable: false
    },
    {
      key: 'covers',
      title: 'Covers',
      sortable: false
    }
  ]

  useEffect(() => {
    // Initialize MPT rental data structure
    dispatch({ type: 'ADD_MPT_RENTAL' })
    dispatch({ type: 'ADD_MPT_PHASE' })
  }, [dispatch])

  useEffect(() => {
    const fetchSignOrder = async () => {
      try {
        if (!params || !params.id) {
          console.error('No sign order ID provided')
          return
        }

        console.log(`Fetching sign order with ID: ${params.id}`)
        const response = await fetch(`/api/sign-orders/${params.id}`)
        const data = await response.json()

        if (!response.ok) {
          console.error('API response not OK:', response.status, data)
          throw new Error(
            `Failed to fetch sign order: ${data.message || response.statusText}`
          )
        }

        console.log('Sign order data:', data)
        if (!data.success || !data.data) {
          console.error('Invalid API response format:', data)
          throw new Error('Invalid API response format')
        }

        // Add branch information based on ID ranges (temporary solution)
        const orderWithBranch = {
          ...data.data,
          branch: determineBranch(data.data.id)
        }

        setSignOrder(orderWithBranch)

        // Set dates if available
        if (data.data.order_date) {
          setOrderDate(new Date(data.data.order_date))
        }
        if (data.data.need_date) {
          setNeedDate(new Date(data.data.need_date))
        }

        // Set order type checkboxes based on data
        if (data.data.sale) setIsSale(true)
        if (data.data.rental) setIsRental(true)
        if (data.data.perm_signs) setIsPermanent(true)

        // Process signs data from the JSONB field
        if (data.data.signs) {
          try {
            const signsData = data.data.signs
            
            // Convert the signs data to the format expected by EstimateContext
            const signsArray = Array.isArray(signsData) ? signsData : Object.values(signsData)
            
            // Dispatch signs to the EstimateContext
            if (signsArray.length > 0) {
              // Format signs for the context
              const formattedSigns = signsArray.map((sign: any) => {
                // Debug log to see the sign structure
                console.log('Original sign data:', sign)
                
                // Map structure values - handle "N/A" and other variations
                let associatedStructure = 'none';
                const displayStructure = 'LOOSE';
                
                if (sign.structure && sign.structure !== 'N/A') {
                  // Check if it's already an associatedStructure value
                  if (['fourFootTypeIII', 'hStand', 'post', 'none'].includes(sign.structure)) {
                    associatedStructure = sign.structure;
                  }
                  // Otherwise keep as 'none' for loose signs
                }
                
                const formattedSign = {
                  ...sign,
                  // Ensure required fields exist
                  associatedStructure: sign.associatedStructure || associatedStructure,
                  displayStructure: sign.displayStructure || displayStructure,
                  bLights: Number(sign.bLights) || 0,
                  cover: sign.covers > 0 || sign.cover || false,
                  quantity: Number(sign.quantity) || 1,
                  width: Number(sign.width) || 0,
                  height: Number(sign.height) || 0
                }
                
                console.log('Formatted sign:', formattedSign)
                return formattedSign
              })
              
              // Use batch update to set all signs at once
              // Small delay to ensure context is ready
              setTimeout(() => {
                dispatch({
                  type: 'ADD_BATCH_MPT_SIGNS',
                  payload: {
                    phaseNumber: 0,
                    signs: formattedSigns
                  }
                })
              }, 100)
            }

            const signItemsArray: SignItem[] = Object.entries(signsData).map(
              ([id, signData]: [string, any], index) => {
                return {
                  id: index + 1,
                  designation: signData.designation || 'N/A',
                  description: signData.description || 'N/A',
                  width: signData.width || 0,
                  height: signData.height || 0,
                  quantity: signData.quantity || 1,
                  sheeting: signData.sheeting || 'N/A',
                  structure: signData.structure || 'N/A',
                  bLights: Number(signData.bLights) || 0,
                  covers: Number(signData.covers) || 0,
                  dimensions: `${signData.width || 0}" x ${signData.height || 0}"`
                }
              }
            )

            setSignItems(signItemsArray)
            console.log('Loaded sign items from database:', signItemsArray)
          } catch (error) {
            console.error('Error parsing signs data:', error)
            setSignItems([])
          }
        } else {
          console.log('No signs data found in the sign order')
          setSignItems([])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching sign order:', error)
        setLoading(false)
      }
    }

    if (params && params.id) {
      fetchSignOrder()
    }
  }, [params, dispatch])

  const handleExport = () => {
    alert('Export functionality not implemented yet')
  }

  const handleEditOrder = () => {
    // Navigate to the sign shop page for editing
    router.push(`/takeoffs/sign-order/edit/${params?.id}`)
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        Loading...
      </div>
    )
  }

  if (!signOrder) {
    return (
      <div className='flex justify-center items-center h-screen'>
        Sign order not found
      </div>
    )
  }

  return (
    <>
      <SiteHeader>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold mt-2 ml-0'>
            View Sign Order
          </h1>
          <div className='flex gap-2'>
            <Button
              onClick={handleEditOrder}
              className='bg-primary text-white hover:bg-primary/90'
            >
              Edit
            </Button>
            <Button variant='outline' onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>
      </SiteHeader>
      <div className='flex flex-1 flex-col'>
        <div className='@container/main flex flex-1 flex-col gap-2'>
          <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6'>
            {/* Customer Info and Upload Files in same row */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              {/* Customer Information - Takes 2/3 of the row */}
              <div className='lg:col-span-2 bg-white p-8 rounded-md shadow-sm border border-gray-100'>
                <h2 className='text-xl font-semibold mb-4'>
                  Customer Information
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Job Number
                    </div>
                    <div className='text-base mt-1'>
                      {signOrder.job_number || '-'}
                    </div>
                  </div>

                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Contract Number
                    </div>
                    <div className='text-base mt-1'>
                      {signOrder.contract_number || '-'}
                    </div>
                  </div>

                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Requestor
                    </div>
                    <div className='text-base mt-1'>
                      {signOrder.requestor || '-'}
                    </div>
                  </div>

                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Branch
                    </div>
                    <div className='text-base mt-1'>
                      {signOrder.branch || '-'}
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Customer
                    </div>
                    <div className='text-base mt-1'>
                      {signOrder.contractors?.name || '-'}
                    </div>
                  </div>

                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Need Date
                    </div>
                    <div className='text-base mt-1'>
                      {needDate ? format(needDate, 'MM/dd/yyyy') : '-'}
                    </div>
                  </div>

                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Order Date
                    </div>
                    <div className='text-base mt-1'>
                      {orderDate ? format(orderDate, 'MM/dd/yyyy') : '-'}
                    </div>
                  </div>

                  <div>
                    <div className='text-sm text-muted-foreground'>
                      Order Type
                    </div>
                    <div className='text-base mt-1'>
                      {[isSale && 'Sale', isRental && 'Rental', isPermanent && 'Permanent Signs']
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Totals - Takes 1/3 of the row */}
              <EquipmentTotalsAccordion key={signItems.length}/>
            </div>

            {/* Sign Details Table - Full width below */}
            <div className='grid grid-cols-1 gap-8'>
              <div className='bg-white p-8 rounded-md shadow-sm border border-gray-100'>
                <h2 className='text-xl font-semibold mb-4'>
                  Sign Details
                </h2>
                <DataTable
                  data={signItems.length === 0 
                    ? [{
                        designation: '-',
                        description: '-',
                        dimensions: '-',
                        quantity: '-',
                        sheeting: '-',
                        structure: '-',
                        bLights: '-',
                        covers: '-'
                      } as any]
                    : signItems
                  }
                  columns={SIGN_COLUMNS}
                  hideDropdown
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}