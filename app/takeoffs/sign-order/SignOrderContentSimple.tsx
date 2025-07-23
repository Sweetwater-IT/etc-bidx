'use client'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import { useEstimate } from '@/contexts/EstimateContext'
import { exportSignListToExcel } from '@/lib/exportSignListToExcel'
import { SignOrderList } from '../new/SignOrderList'
import { SignOrderAdminInfo } from '../new/SignOrderAdminInfo'
import { toast } from 'sonner'
import { User } from '@/types/User'
import { Customer } from '@/types/Customer'
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState
} from '@/components/ui/dropzone'
import { useFileUpload } from '@/hooks/use-file-upload'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import PageHeaderWithSaving from '@/components/PageContainer/PageHeaderWithSaving'
import { fetchReferenceData, saveSignOrder } from '@/lib/api-client'
import isEqual from 'lodash/isEqual'
import EquipmentTotalsAccordion from './view/[id]/EquipmentTotalsAccordion'
import { QuoteNotes, Note } from '@/components/pages/quote-form/QuoteNotes'
import {
  defaultMPTObject,
  defaultPhaseObject
} from '@/types/default-objects/defaultMPTObject'
import { useLoading } from '@/hooks/use-loading'
import { generateUniqueId } from '@/components/pages/active-bid/signs/generate-stable-id'
import { formatDate } from '@/lib/formatUTCDate'
import SignOrderWorksheetPDF from '@/components/sheets/SignOrderWorksheetPDF'
import { AdminDataInfo, SignItem } from '@/components/sheets/SignOrderWorksheetPDF'
import SignOrderWorksheet from '@/components/sheets/SignOrderWorksheet'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { useMemo } from 'react';

export type OrderTypes = 'sale' | 'rental' | 'permanent signs'

export interface SignOrderAdminInformation {
  requestor: User | null
  customer: Customer | null
  orderDate: Date
  needDate: Date | null
  orderType: OrderTypes[]
  selectedBranch: string
  jobNumber: string
  isSubmitting: boolean
  contractNumber: string
  orderNumber?: string
  startDate?: Date
  endDate?: Date
}

interface Props {
  signOrderId?: number
}

export default function SignOrderContentSimple ({
  signOrderId: initialSignOrderId
}: Props) {
  const { dispatch, adminData, mptRental, equipmentRental, flagging } = useEstimate()
  const router = useRouter()

  // Set up admin info state in the parent component
  const [adminInfo, setAdminInfo] = useState<SignOrderAdminInformation>({
    requestor: null,
    customer: null,
    orderDate: new Date(),
    needDate: null,
    orderType: [],
    selectedBranch: 'All',
    jobNumber: '',
    isSubmitting: false,
    contractNumber: '',
    orderNumber: undefined
  })
  const [adminDataInfo, setAdminDataInfo] = useState<AdminDataInfo>({
    contractNumber: '',
    jobNumber: '',
    customer: { name: '' },
    orderDate: new Date(),
    needDate: '',
    branch: '',
    orderType: '',
    submitter: ''
  })
  const [signList, setSignList] = useState<SignItem[]>([])

  const { startLoading, stopLoading } = useLoading()

  const [localFiles, setLocalFiles] = useState<File[]>([])
  const [localNotes, setLocalNotes] = useState<string>()
  const [savedNotes, setSavedNotes] = useState<string>()
  const [alreadySubmitted, setAlreadySubmitted] = useState<boolean>(false)
  const [signOrderId, setSignOrderId] = useState<number | null>(
    initialSignOrderId ?? null
  )

  // Autosave states - exactly like active bid header
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [secondCounter, setSecondCounter] = useState<number>(0)
  const saveTimeoutRef = useRef<number | null>(null)
  const [firstSave, setFirstSave] = useState<boolean>(false)

  const prevStateRef = useRef({
    adminInfo,
    mptRental
  })

  const [notes, setNotes] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)

  const isOrderInvalid = (): boolean => {
    return (
      !adminInfo.contractNumber ||
      adminInfo.contractNumber.trim() === '' ||
      !adminInfo.customer ||
      !adminInfo.requestor ||
      adminInfo.orderType.length === 0 ||
      !adminInfo.orderDate ||
      !adminInfo.needDate
    )
  }

  const fetchSignOrder = async () => {
    try {
      startLoading()
      setLoadingNotes(true)
      console.log(`Fetching sign order with ID: ${initialSignOrderId}`)
      const response = await fetch(`/api/sign-orders/${initialSignOrderId}`)
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
          users.find(u => u.name === data.data.requestor)?.branches?.name || ''
      }

      const ordersData: OrderTypes[] = []
      if (data.data.perm_signs) {
        ordersData.push('permanent signs')
      }
      if (data.data.sale) {
        ordersData.push('sale')
      }
      if (data.data.rental) {
        ordersData.push('rental')
      }

      setAdminInfo({
        contractNumber: data.data.contract_number,
        requestor: {
          name: data.data.requestor,
          email: '',
          role: ''
        },
        orderDate:
          data.data.order_date && data.data.order_date !== ''
            ? new Date(formatDate(data.data.order_date))
            : new Date(),
        needDate:
          data.data.need_date && data.data.need_date !== ''
            ? new Date(formatDate(data.data.need_date))
            : new Date(),
        jobNumber: data.data.job_number,
        startDate:
          data.data.start_date && data.data.start_date !== ''
            ? new Date(formatDate(data.data.start_date))
            : undefined,
        endDate:
          data.data.end_date && data.data.end_date !== ''
            ? new Date(formatDate(data.data.end_date))
            : undefined,
        selectedBranch: orderWithBranch.branch,
        customer: {
          id: data.data.contractor_id,
          name: data.data.contractors?.name,
          displayName: data.data.contractors?.name,
          emails: [],
          address: '',
          phones: [],
          paymentTerms: '',
          mainPhone: '',
          zip: '',
          roles: [],
          names: [],
          contactIds: [],
          url: '',
          created: '',
          updated: '',
          city: '',
          state: '',
          customerNumber: 1
        },
        isSubmitting: false,
        orderType: ordersData,
        orderNumber: data.data.order_number || undefined
      })

      if (data.data.order_status === 'SUBMITTED') {
        setAlreadySubmitted(true)
      }

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
    } catch (error) {
      toast.error('Error fetching sign order:' + error)
      console.error('Error fetching sign order:', error)
      setLoadingNotes(false)
    } finally {
      stopLoading()
    }
  }

  // Initialize MPT rental data
  useEffect(() => {
    dispatch({ type: 'ADD_MPT_RENTAL' })
    if (!initialSignOrderId) {
      dispatch({ type: 'ADD_MPT_PHASE' })
      return
    } else {
      fetchSignOrder()
    }
  }, [dispatch])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondCounter(prev => prev + 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [secondCounter])

  // Autosave effect - exactly like active bid header
  useEffect(() => {
    // Check if there were any changes
    const hasAdminInfoChanged = !isEqual(
      adminInfo,
      prevStateRef.current.adminInfo
    )
    const hasMptRentalChanged = !isEqual(
      mptRental,
      prevStateRef.current.mptRental
    )

    const hasAnyStateChanged = hasAdminInfoChanged || hasMptRentalChanged

    // Don't autosave if no changes, no contract number, or if it's never been saved
    if (isOrderInvalid() || !hasAnyStateChanged) return
    else {
      // Clear timeout if there is one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      setSignList(mptRental.phases[0].signs.map(normalizeSign));
      setAdminDataInfo({
        contractNumber: adminInfo.contractNumber,
        jobNumber: adminInfo.jobNumber,
        customer: { name: adminInfo.customer?.name },
        orderDate: adminInfo.orderDate,
        needDate: adminInfo.needDate || '',
        branch: adminInfo.selectedBranch,
        orderType: adminInfo.orderType.join(', '),
        submitter: adminInfo.requestor?.name || ''
      })
      saveTimeoutRef.current = window.setTimeout(() => {
        autosave()
      }, 5000)
    }
  }, [adminInfo, mptRental])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const autosave = async () => {
    setIsSaving(true)

    if (isOrderInvalid()) {
      return
    }

    // Update the previous state reference
    prevStateRef.current = {
      adminInfo,
      mptRental
    }

    try {
      const signOrderData = {
        id: signOrderId || undefined,
        requestor: adminInfo.requestor ? adminInfo.requestor : undefined,
        contractor_id: adminInfo.customer ? adminInfo.customer.id : undefined,
        contract_number: adminInfo.contractNumber,
        order_date: new Date(adminInfo?.orderDate).toISOString(),
        need_date: adminInfo.needDate
          ? new Date(adminInfo?.needDate).toISOString()
          : undefined,
        start_date: adminInfo.startDate
          ? new Date(adminInfo.startDate).toISOString()
          : '',
        end_date: adminInfo.endDate
          ? new Date(adminInfo.endDate).toISOString()
          : '',
        order_type: adminInfo.orderType,
        job_number: adminInfo.jobNumber,
        signs: mptRental.phases[0].signs || [],
        status: 'DRAFT' as const,
        order_number: adminInfo.orderNumber
      }

      const result = await saveSignOrder(signOrderData)

      if (result.id && !signOrderId) {
        setSignOrderId(result.id)
        setFirstSave(true)
      }

      setSecondCounter(1)

      if (!firstSave) {
        setFirstSave(true)
      }
    } catch (error) {
      toast.error('Sign order not successfully saved as draft: ' + error)
    } finally {
      setIsSaving(false)
    }
  }

  const getSaveStatusMessage = () => {
    if (isSaving && !firstSave) return 'Saving...'
    if (!firstSave) return ''

    if (secondCounter < 60) {
      return `${
        alreadySubmitted ? 'Sign order updates' : 'Draft'
      } saved ${secondCounter} second${secondCounter !== 1 ? 's' : ''} ago`
    } else if (secondCounter < 3600) {
      const minutesAgo = Math.floor(secondCounter / 60)
      return `${
        alreadySubmitted ? 'Sign order updates' : 'Draft'
      } saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`
    } else {
      const hoursAgo = Math.floor(secondCounter / 3600)
      return `${
        alreadySubmitted ? 'Sign order ' : 'Draft'
      } saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`
    }
  }

  const fileUploadProps = useFileUpload({
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10, // Allow multiple files to be uploaded
    uniqueIdentifier: 100000,
    apiEndpoint: '/api/files/sign-orders',
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx'
      ],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'application/zip': ['.zip'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    }
  })

  // Destructure needed properties
  const { files, successes, isSuccess } = fileUploadProps

  // Use useEffect to update parent component's files state when upload is successful
  useEffect(() => {
    if (isSuccess && files.length > 0) {
      const successfulFiles = files.filter(file =>
        successes.includes(file.name)
      )
      if (successfulFiles.length > 0) {
        setLocalFiles(prevFiles => {
          // Filter out duplicates
          const filteredPrevFiles = prevFiles.filter(
            prevFile =>
              !successfulFiles.some(newFile => newFile.name === prevFile.name)
          )
          return [...filteredPrevFiles, ...successfulFiles]
        })
      }
    }
  }, [isSuccess, files, successes, setLocalFiles])

  // Fetch notes for the sign order on mount (if editing an existing sign order)
  useEffect(() => {
    async function fetchNotes () {
      setLoadingNotes(true)
      try {
        if (!signOrderId) return
        const res = await fetch(`/api/sign-orders?id=${signOrderId}`)
        if (res.ok) {
          const data = await res.json()
          setNotes(Array.isArray(data.notes) ? data.notes : [])
        }
      } finally {
        setLoadingNotes(false)
      }
    }
    fetchNotes()
  }, [signOrderId])

  const handleSaveNote = async (note: Note) => {
    const updatedNotes = [...notes, note]
    setNotes(updatedNotes)
    if (signOrderId) {
      await fetch(`/api/sign-orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: signOrderId, notes: updatedNotes })
      })
    }
  }

  const handleEditNote = async (index: number, updatedNote: Note) => {
    const updatedNotes = notes.map((n, i) => (i === index ? updatedNote : n))
    setNotes(updatedNotes)
    if (signOrderId) {
      await fetch(`/api/sign-orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: signOrderId, notes: updatedNotes })
      })
    }
  }

  const handleDeleteNote = async (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index)
    setNotes(updatedNotes)
    if (signOrderId) {
      await fetch(`/api/sign-orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: signOrderId, notes: updatedNotes })
      })
    }
  }

  // Handle saving the sign order
  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    // Prevent multiple submissions
    if (adminInfo.isSubmitting) return
    if (isOrderInvalid()) return

    try {
      setAdminInfo(prev => ({ ...prev, isSubmitting: true }))

      const signOrderData = {
        id: signOrderId || undefined, // Include ID if we have one
        requestor: adminInfo.requestor ? adminInfo.requestor : undefined,
        contractor_id: adminInfo.customer ? adminInfo.customer.id : undefined,
        contract_number: adminInfo.contractNumber,
        order_date: new Date(adminInfo.orderDate).toISOString(),
        need_date: adminInfo.needDate
          ? new Date(adminInfo.needDate).toISOString()
          : undefined,
        start_date: adminInfo.startDate
          ? new Date(adminInfo.startDate).toISOString()
          : '',
        end_date: adminInfo.endDate
          ? new Date(adminInfo.endDate).toISOString()
          : '',
        order_type: adminInfo.orderType,
        job_number: adminInfo.jobNumber,
        signs: mptRental.phases[0].signs || [],
        status,
        order_number: adminInfo.orderNumber
      }

      // Submit data to the API
      const result = await saveSignOrder(signOrderData)

      // Store the ID for future updates
      if (result.id) {
        setSignOrderId(result.id)
      }
      setFirstSave(true)

      toast.success('Sign order saved successfully')
      router.push('/takeoffs/sign-order/view/' + (signOrderId || result.id))
    } catch (error) {
      console.error('Error saving sign order:', error)
      toast.error((error as string) || 'Failed to save sign order')
    } finally {
      setAdminInfo(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const pdfDoc = useMemo(
    () => <SignOrderWorksheetPDF adminData={adminDataInfo} signList={signList} showFinancials={true} />,
    [adminDataInfo, signList]
  );

  return mptRental.phases.length > 0 ? (
    <div className='flex flex-1 flex-col'>
      <PageHeaderWithSaving
        heading='Create Sign Order'
        handleSubmit={() => {
          handleSave('DRAFT')
          router.push('/takeoffs/load-sheet')
        }}
        showX
        saveButtons={
          <div className='flex items-center gap-4'>
            <div className='text-sm text-muted-foreground'>
              {getSaveStatusMessage()}
            </div>
            <div className='flex items-center gap-2'>
              <Button
                onClick={() =>
                  handleSave(alreadySubmitted ? 'SUBMITTED' : 'DRAFT')
                }
                disabled={
                  adminInfo.isSubmitting ||
                  mptRental.phases[0].signs.length === 0 ||
                  isOrderInvalid()
                }
              >
                {adminInfo.isSubmitting
                  ? 'Saving...'
                  : initialSignOrderId
                  ? 'Update order'
                  : 'Done'}
              </Button>
            </div>
          </div>
        }
      />
      <div className='flex gap-6 p-6 max-w-full'>
          {/* Left Section: expands if PDF preview is hidden */}
          <div className={`w-1/2 flex flex-col gap-6 space-y-6`}>
            {/* Main Form Column (3/4) */}
              <SignOrderAdminInfo
                adminInfo={adminInfo}
                setAdminInfo={setAdminInfo}
                showInitialAdminState={!!initialSignOrderId}
              />
              <SignOrderList />
            {/* Right Column (1/4) */}
              {/* Toggle Button for PDF Preview (floated to the right, outside preview) */}
              <EquipmentTotalsAccordion />
              <div className='border rounded-lg p-4'>
                <h2 className='mb-2 text-lg font-semibold'>Files</h2>
                <Dropzone
                  {...fileUploadProps}
                  className='p-8 cursor-pointer space-y-4'
                >
                  <DropzoneContent />
                  <DropzoneEmptyState />
                </Dropzone>
              </div>
              <QuoteNotes
                notes={notes}
                onSave={handleSaveNote}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                loading={loadingNotes}
              />
          </div>
          {/* PDF Preview Section: only render if visible */}
          <div className='w-1/2 bg-[#F4F5F7] p-6 rounded-lg'>
            <div className='flex justify-end'>
              <PDFDownloadLink
                document={pdfDoc}
                fileName="sign-order.pdf"
              >
                <Button>Download PDF</Button>
              </PDFDownloadLink>
            </div>
            <SignOrderWorksheet adminInfo={adminInfo} signList={signList} mptRental={mptRental} notes={notes} />
          </div>
      </div>
    </div>
  ) : (
    <></>
  )
}

const normalizeSign = (sign: any): SignItem => ({
  designation: sign.designation || '',
  description: sign.description || '',
  quantity: sign.quantity || 0,
  width: sign.width || 0,
  height: sign.height || 0,
  sheeting: sign.sheeting || '',
  substrate: sign.substrate || '', // ensure string, fallback to empty string
  stiffener: typeof sign.stiffener === 'string' || typeof sign.stiffener === 'boolean' ? sign.stiffener : '',
  inStock: sign.inStock ?? 0,
  order: sign.order ?? 0,
  displayStructure: sign.displayStructure || '',
  bLights: sign.bLights || 0,
  cover: sign.cover || false,
  make: sign.make ?? 0,
  unitPrice: sign.unitPrice ?? undefined,
  totalPrice: sign.totalPrice ?? undefined,
  primarySignId: sign.primarySignId ?? undefined,
});
