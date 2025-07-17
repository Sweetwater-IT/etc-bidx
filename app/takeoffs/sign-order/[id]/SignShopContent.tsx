'use client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { SignOrderList } from '../../new/SignOrderList'
import SignShopAdminInfo from './SignShopAdminInfo'
import { SiteHeader } from '@/components/site-header'
import { useLoading } from '@/hooks/use-loading'
import { fetchReferenceData } from '@/lib/api-client'
import {
  PrimarySign,
  SecondarySign,
  ExtendedPrimarySign,
  ExtendedSecondarySign,
  hasShopTracking
} from '@/types/MPTEquipment'
import { generateUniqueId } from '@/components/pages/active-bid/signs/generate-stable-id'
import { SignOrder } from '@/types/TSignOrder'
import { toast } from 'sonner'
import { useEstimate } from '@/contexts/EstimateContext'
import {
  defaultMPTObject,
  defaultPhaseObject
} from '@/types/default-objects/defaultMPTObject'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { exportSignOrderToExcel } from '@/lib/exportSignOrderToExcel'
import { useRouter } from 'next/navigation'
import '@/components/pages/active-bid/signs/no-spinner.css'
import { QuoteNotes, Note } from '@/components/pages/quote-form/QuoteNotes'
import SignOrderBidSummaryPDF from '@/components/sheets/SignOrderBidSummaryPDF'
import { PDFViewer } from '@react-pdf/renderer'
import { PDFDownloadLink } from '@react-pdf/renderer'
import SignOrderWorksheetPDF from '@/components/sheets/SignOrderWorksheetPDF'
import { Command, CommandGroup, CommandItem } from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

interface Props {
  id: number
}

// Interface for SignOrderWorksheetPDF props
interface SignOrderWorksheetPDFProps {
  adminData: {
    contractNumber?: string
    jobNumber?: string
    customer?: { name?: string }
    orderDate?: string | Date
    needDate?: string | Date
    branch?: string
    orderType?: string
    submitter?: string
  }
  signList: {
    designation: string
    description: string
    quantity: number
    width: number
    height: number
    sheeting: string
    substrate: string
    stiffener: string | boolean
    inStock?: number
    order?: number
    make?: number
    unitPrice?: number
    totalPrice?: number
    primarySignId?: string
  }[]
  showFinancials: boolean
}


const SignShopContent = ({ id }: Props) => {
  const { mptRental, dispatch } = useEstimate()
  const router = useRouter()

  const [signOrder, setSignOrder] = useState<SignOrder>()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  // const [shopSigns, setShopSigns] = useState<(ExtendedPrimarySign | ExtendedSecondarySign)[]>([])

  const { isLoading, startLoading, stopLoading } = useLoading()

  // Remove worksheet dropdown state
  const [openPdfDialog, setOpenPdfDialog] = useState(false)

  // Get signs with shop tracking from context
  const getShopSigns = (): (ExtendedPrimarySign | ExtendedSecondarySign)[] => {
    if (mptRental.phases.length === 0) return []
    else
      return mptRental.phases[0].signs.map(sign => {
        // Ensure all signs have shop tracking properties
        if (!hasShopTracking(sign)) {
          return {
            ...sign,
            make: 0,
            order: 0,
            inStock: 0
          } as ExtendedPrimarySign | ExtendedSecondarySign
        }
        return sign as ExtendedPrimarySign | ExtendedSecondarySign
      })
  }

  // Function to map signOrder and mptRental to SignOrderWorksheetPDF props
  const mapSignOrderToWorksheetProps = (signOrder: SignOrder | undefined, mptRental: any): SignOrderWorksheetPDFProps => {
    return {
      adminData: {
        contractNumber: signOrder?.contract_number || '-',
        jobNumber: signOrder?.job_number || '-',
        customer: { name: signOrder?.contractors?.name || '-' }, // Updated to use contractors.name
        orderDate: signOrder?.order_date ? new Date(signOrder.order_date) : undefined,
        needDate: signOrder?.need_date ? new Date(signOrder.need_date) : undefined, // Prefer need_date over target_date
        branch: signOrder?.branch || '-',
        orderType: signOrder?.sale ? 'Sale' : signOrder?.rental ? 'Rental' : signOrder?.perm_signs ? 'Permanent Signs' : '-', // Map order type
        submitter: signOrder?.requestor || signOrder?.assigned_to || '-'
      },
      signList: getShopSigns().map(sign => ({
        designation: sign.designation || '-',
        description: sign.description || '-',
        quantity: sign.quantity || 0,
        width: sign.width || 0,
        height: sign.height || 0,
        sheeting: sign.sheeting || '-',
        substrate: sign.substrate || '-',
        stiffener: 'stiffener' in sign ? sign.stiffener : false,
        inStock: (sign as ExtendedPrimarySign).inStock || 0,
        order: (sign as ExtendedPrimarySign).order || 0,
        make: (sign as ExtendedPrimarySign).make || 0,
        unitPrice: (sign as ExtendedPrimarySign).unitPrice || undefined,
        totalPrice: (sign as ExtendedPrimarySign).totalPrice || undefined,
        primarySignId: (sign as ExtendedPrimarySign).primarySignId || undefined
      })),
      showFinancials: false
    }
  }

  // Function to show confirmation dialog before saving changes
  const handleSaveChanges = () => {
    if (!signOrder) return
    setShowConfirmDialog(true)
  }

  const handleExport = () => {
    if (!signOrder) return
    exportSignOrderToExcel(
      signOrder,
      mptRental.phases[0].signs as (
        | ExtendedPrimarySign
        | ExtendedSecondarySign
      )[]
    )
  }

  const confirmSaveChanges = async () => {
    if (!signOrder) return

    try {
      startLoading()

      // Convert the sign items array to the expected signs object format
      const signsObject = mptRental.phases[0].signs.reduce((acc, item) => {
        acc[item.id.toString()] = {
          designation: item.designation,
          description: item.description,
          width: item.width,
          height: item.height,
          quantity: item.quantity,
          sheeting: item.sheeting,
          stiffener: 'stiffener' in item ? item.stiffener : undefined,
          inStock: (item as ExtendedPrimarySign).inStock,
          order: (item as ExtendedPrimarySign).order,
          make: (item as ExtendedPrimarySign).make,
          substrate: item.substrate,
          cover: 'cover' in item ? item.cover : undefined
        }
        return acc
      }, {})

      // Update the sign order in the database
      const response = await fetch(`/api/sign-orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signs: signsObject,
          shop_status: signOrder.shop_status || 'not-started',
          assigned_to: signOrder.assigned_to,
          target_date: signOrder.target_date
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to update sign order')
      }

      stopLoading()
      setShowConfirmDialog(false)

      // Show success message
      toast.success('Changes saved successfully!')

      // Redirect to view page
      router.push(`/takeoffs/sign-order/view/${id}`)
    } catch (error: any) {
      console.error('Error updating sign order:', error)
      stopLoading()
      setShowConfirmDialog(false)
      toast.error(
        `Failed to save changes: ${error?.message || 'Unknown error'}`
      )
    }
  }

  // Helper function to update shop tracking values
  const updateShopTracking = (
    signId: string,
    field: 'make' | 'order' | 'inStock',
    value: number
  ) => {
    dispatch({
      type: 'UPDATE_SIGN_SHOP_TRACKING',
      payload: {
        phaseNumber: 0,
        signId,
        field,
        value
      }
    })
  }

  // Helper function to increment/decrement values
  const adjustShopValue = (
    signId: string,
    field: 'make' | 'order' | 'inStock',
    delta: number
  ) => {
    const signs = getShopSigns()
    const sign = signs.find(s => s.id === signId)
    if (sign) {
      const currentValue = sign[field] || 0
      const newValue = Math.max(0, currentValue + delta)
      updateShopTracking(signId, field, newValue)
    }
  }

  useEffect(() => {
    dispatch({ type: 'ADD_MPT_RENTAL' })
    dispatch({ type: 'ADD_MPT_PHASE' })
  }, [dispatch])

  useEffect(() => {
    const fetchSignOrder = async () => {
      try {
        startLoading()
        setLoadingNotes(true)
        console.log(`Fetching sign order with ID: ${id}`)
        const response = await fetch(`/api/sign-orders/${id}`)
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

        const users = await fetchReferenceData('users')

        const orderWithBranch = {
          ...data.data,
          branch:
            users.find(u => u.name === data.data.requestor)?.branches?.name ||
            ''
        }

        setSignOrder(orderWithBranch)

        // Extract sign items from the signs JSON field
        if (data.data.signs) {
          try {
            // Convert the signs object to an array and prepare for shop tracking
            const signItemsArray = Object.values(data.data.signs)
              .filter((s: any) => s && typeof s === 'object')
              .map((s: any) => ({
                ...s,
                id: s.id ? s.id : generateUniqueId(),
                bLights: s.bLights || 0
              }))

            // const signsDataForShop = Object.values(data.data.signs)
            //   .filter((s: any) => s && typeof s === 'object')
            //   .map((s: any) => ({
            //     id: s.id ? s.id : generateUniqueId(),
            //     make: 'make' in s ? s.make : 0,
            //     inStock: 'inStock' in s ? s.inStock : 0,
            //     order: 'order' in s ? s.order : 0
            //   }))

            // setShopSigns(signItemsArray.map(s => {
            //   const associatedShopSign = signsDataForShop.find(shopSign => shopSign.id === s.id);
            //   if (associatedShopSign) {
            //     return {
            //       ...s,
            //       make: associatedShopSign.make,
            //       inStock: associatedShopSign.inStock,
            //       order: associatedShopSign.order
            //     }
            //   } else return {
            //     ...s,
            //     make: 0,
            //     inStock: 0,
            //     order: 0
            //   }
            // }))

            // First copy the MPT rental with regular signs
            dispatch({
              type: 'COPY_MPT_RENTAL',
              payload: {
                ...defaultMPTObject,
                phases: [{ ...defaultPhaseObject, signs: signItemsArray }]
              }
            })
          } catch (error) {
            toast.error('Error parsing signs data:' + error)
            console.error('Error parsing signs data:', error)
          }
        } else {
          console.log('No signs data found in the sign order')
        }

        // Extract notes from the sign order
        setNotes(Array.isArray(data.data?.notes) ? data.data.notes : [])
        setLoadingNotes(false)
      } catch (error) {
        toast.error('Error fetching sign order:' + error)
        console.error('Error fetching sign order:', error)
        setLoadingNotes(false)
      } finally {
        stopLoading()
      }
    }

    if (id) {
      fetchSignOrder()
    }
  }, [id])

  // Handle adding new signs - ensure they have shop tracking
  const handleAddNewSign = () => {
    const defaultSign: ExtendedPrimarySign = {
      id: generateUniqueId(),
      isCustom: false,
      designation: '',
      description: '',
      width: 0,
      height: 0,
      quantity: 0,
      sheeting: 'DG',
      displayStructure: 'LOOSE',
      associatedStructure: 'none',
      stiffener: false,
      inStock: 0,
      order: 0,
      make: 0,
      bLights: 0,
      cover: false,
      substrate: 'Plastic'
    }

    dispatch({
      type: 'ADD_MPT_SIGN',
      payload: {
        phaseNumber: 0,
        sign: defaultSign
      }
    })
  }

  // Handler to save a new note
  const handleSaveNote = async (newNote: Note) => {
    const updatedNotes = [...notes, newNote]
    setNotes(updatedNotes)
    await fetch(`/api/sign-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: updatedNotes })
    })
  }

  // Add these handlers for edit and delete
  const handleEditNote = async (index: number, updatedNote: Note) => {
    const updatedNotes = notes.map((n, i) => (i === index ? updatedNote : n))
    setNotes(updatedNotes)
    await fetch(`/api/sign-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: updatedNotes })
    })
  }

  const handleDeleteNote = async (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index)
    setNotes(updatedNotes)
    await fetch(`/api/sign-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: updatedNotes })
    })
  }

  const mapSignOrderToBidSummaryProps = (signOrder, mptRental) => {
    // Map signOrder fields to the expected adminData structure for the PDF
    return {
      adminData: {
        contractNumber:
          signOrder?.contract_number || signOrder?.contractNumber || '-',
        estimator: signOrder?.requestor || '-',
        county: { name: signOrder?.branch || '-' },
        srRoute: '-',
        location: '-',
        startDate: signOrder?.order_date
          ? new Date(signOrder.order_date)
          : undefined,
        endDate: signOrder?.need_date
          ? new Date(signOrder.need_date)
          : undefined
        // Add more mappings as needed
      },
      mptRental: {
        ...defaultMPTObject,
        phases: [
          {
            ...((mptRental?.phases && mptRental.phases[0]) || {}),
            signs: mptRental?.phases?.[0]?.signs || []
          }
        ]
      }
    }
  }

  return (
    <>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            {signOrder && (
              <div className='space-y-4 mt-2'>
                <div>
                  Confirm you want to assign this order to{' '}
                  <span>{signOrder.assigned_to}</span>
                </div>
                {mptRental.phases.length > 0 && (
                  <div className='space-y-2'>
                    <p className='font-medium'>
                      And confirm the following quantities:
                    </p>
                    <div className='max-h-60 overflow-y-auto'>
                      <table className='w-full text-sm'>
                        <thead>
                          <tr className='border-b'>
                            <th className='text-left py-2'>Designation</th>
                            <th className='text-center py-2'>In stock</th>
                            <th className='text-center py-2'>Order</th>
                            <th className='text-center py-2'>Make</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mptRental.phases[0].signs.map(item => (
                            <tr key={item.id} className='border-b'>
                              <td className='py-2'>{item.designation}</td>
                              <td className='text-center py-2'>
                                {(item as ExtendedPrimarySign).inStock || 0}
                              </td>
                              <td className='text-center py-2'>
                                {(item as ExtendedPrimarySign).order || 0}
                              </td>
                              <td className='text-center py-2'>
                                {(item as ExtendedPrimarySign).make || 0}
                              </td>
                            </tr>
                          ))}
                          {mptRental.phases[0].signs.every(
                            item =>
                              ((item as ExtendedPrimarySign).order === 0 ||
                                (item as ExtendedPrimarySign).order ===
                                  undefined) &&
                              ((item as ExtendedPrimarySign).make === 0 ||
                                (item as ExtendedPrimarySign).make ===
                                  undefined)
                          ) && (
                            <tr>
                              <td
                                colSpan={4}
                                className='text-center py-2 text-gray-500'
                              >
                                No items to order or make
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmSaveChanges} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Yes, Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Worksheet PDF Dialog */}
      {openPdfDialog && (
        <Dialog open={openPdfDialog} onOpenChange={setOpenPdfDialog}>
          <DialogContent className='max-w-4xl h-fit w-fit'>
            <DialogTitle>Sign Order Worksheet</DialogTitle>
            <div className='mt-4'>
              <PDFViewer height={600} width={800}>
                <SignOrderBidSummaryPDF
                  {...mapSignOrderToBidSummaryProps(signOrder, mptRental)}
                  equipmentRental={[]}
                  flagging={undefined}
                />
              </PDFViewer>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <SiteHeader>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold mt-2 ml-0'>
            Sign Shop Order Tracker
          </h1>
          <div className='flex gap-2'>
            <Button
              onClick={handleSaveChanges}
              className='bg-black text-white hover:bg-gray-900'
            >
              Save Changes
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              className='bg-primary text-white hover:bg-primary/90'
            >
              Send to Production
            </Button>
            <Button variant='outline' onClick={handleExport}>
              Export
            </Button>
            <PDFDownloadLink
              document={<SignOrderWorksheetPDF {...mapSignOrderToWorksheetProps(signOrder, mptRental)} />}
              fileName={`SignOrderWorksheet_${id}.pdf`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              onClick={() => {
                if (!signOrder) {
                  toast.error('No sign order data available')
                }
              }}
            >
              {({ loading }) => (loading || !signOrder ? 'Loading...' : 'Download PDF')}
            </PDFDownloadLink>
          </div>
        </div>
      </SiteHeader>
      {!isLoading && signOrder && (
        <div className='w-full flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-2'>
            <SignShopAdminInfo
              signOrder={signOrder}
              setSignOrder={setSignOrder}
              id={id}
            />
            <div className='w-full bg-white p-8 rounded-md shadow-sm border border-gray-100 mb-8'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>Sign order</h2>
                <div className='flex gap-2'>
                  <Button
                    onClick={handleAddNewSign}
                    className='bg-primary text-white hover:bg-primary/90'
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Add New Sign
                  </Button>
                </div>
              </div>
              {mptRental.phases.length > 0 && (
                <div className='max-w-full overflow-x-auto'>
                  <SignOrderList
                    currentPhase={0}
                    onlyTable={true}
                    shopMode={true}
                    updateShopTracking={updateShopTracking}
                    adjustShopValue={adjustShopValue}
                  />
                </div>
              )}
            </div>
            <div className='w-full mt-4'>
              <QuoteNotes
                notes={notes}
                onSave={handleSaveNote}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                loading={loadingNotes}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default SignShopContent
