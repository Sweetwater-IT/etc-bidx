'use client'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef, type SetStateAction } from 'react'
import { useSignOrderBuilder } from '@/contexts/SignOrderBuilderContext'
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
import { fetchAssociatedFiles, fetchReferenceData, saveSignOrder } from '@/lib/api-client'
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
import FileViewingContainer from '@/components/file-viewing-container'
import { FileMetadata } from '@/types/FileTypes'
import { useAuth } from '@/contexts/auth-context'
import { AuthAdminApi } from '@supabase/supabase-js'
import SignOrderWorksheetPDF from '@/components/sheets/SignOrderWorksheetPDF'
import { SignItem as WorksheetSignItem } from '@/components/sheets/SignOrderWorksheetPDF'
import SignOrderWorksheet from '@/components/sheets/SignOrderWorksheet'
import { useMemo } from 'react';
import { pdf } from '@react-pdf/renderer';
import { logSignOrderDebug } from '@/lib/log-sign-order-debug';
import { PrimarySign, SecondarySign } from '@/types/MPTEquipment'

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
  contact?: any | null
}

interface Props {
  signOrderId?: number
}

interface SignOrderDraft {
  adminInfo: SignOrderAdminInformation
  signs: (PrimarySign | SecondarySign)[]
  notes: Note[]
  files: FileMetadata[]
}

const defaultAdminInfo: SignOrderAdminInformation = {
  requestor: null,
  customer: null,
  orderDate: new Date(),
  needDate: null,
  orderType: [],
  selectedBranch: 'All',
  jobNumber: '',
  isSubmitting: false,
  contractNumber: '',
  orderNumber: undefined,
  contact: null
}

export default function SignOrderContentSimple({
  signOrderId: initialSignOrderId
}: Props) {
  const { dispatch, mptRental } = useSignOrderBuilder()
  const router = useRouter()

  const [draft, setDraft] = useState<SignOrderDraft>({
    adminInfo: defaultAdminInfo,
    signs: [],
    notes: [],
    files: []
  })
  const adminInfo = draft.adminInfo
  const signList = useMemo(
    () => draft.signs.map(normalizeSign),
    [draft.signs]
  )

  const { startLoading, stopLoading } = useLoading()
  const { user } = useAuth()
  const [alreadySubmitted, setAlreadySubmitted] = useState<boolean>(false)
  const [signOrderId, setSignOrderId] = useState<number | null>(
    initialSignOrderId ?? null
  )

  // Autosave states - exactly like active bid header
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [secondCounter, setSecondCounter] = useState<number>(0)
  const saveTimeoutRef = useRef<number | null>(null)
  const [firstSave, setFirstSave] = useState<boolean>(false)

  const prevDraftRef = useRef<SignOrderDraft>(draft)

  const [loadingNotes, setLoadingNotes] = useState(false)
  const signCount = draft.signs.length

  const setAdminInfo = (
    updater:
      | SignOrderAdminInformation
      | ((prev: SignOrderAdminInformation) => SignOrderAdminInformation)
  ) => {
    setDraft(prev => ({
      ...prev,
      adminInfo:
        typeof updater === 'function'
          ? (updater as (prev: SignOrderAdminInformation) => SignOrderAdminInformation)(prev.adminInfo)
          : updater
    }))
  }

  const setDraftFiles = (updater: SetStateAction<FileMetadata[]>) => {
    setDraft(prev => ({
      ...prev,
      files:
        typeof updater === 'function'
          ? (updater as (prev: FileMetadata[]) => FileMetadata[])(prev.files)
          : updater
    }))
  }

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

  const fetchSignOrder = async (requestedId?: number | null) => {
    const resolvedId = requestedId ?? signOrderId ?? initialSignOrderId ?? null
    if (!resolvedId) {
      return
    }

    try {
      startLoading()
      setLoadingNotes(true)
      console.log(`Fetching sign order with ID: ${resolvedId}`)
      const response = await fetch(`/api/sign-orders/${resolvedId}`)
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
      const matchedRequestor =
        users.find((u: User) => u.name === data.data.requestor) || null

      let hydratedCustomer: Customer | null = null
      if (data.data.contractor_id) {
        try {
          const customerResponse = await fetch(
            `/api/contractors/${data.data.contractor_id}`
          )
          const customerResult = await customerResponse.json()

          if (customerResponse.ok && customerResult?.customer) {
            const customer = customerResult.customer
            hydratedCustomer = {
              id: customer.id,
              name: customer.name,
              displayName: customer.display_name || customer.displayName || customer.name,
              emails: customer.emails || [],
              address: customer.address || '',
              phones: customer.phones || [],
              paymentTerms: customer.payment_terms || customer.paymentTerms || '',
              mainPhone: customer.main_phone || customer.mainPhone || '',
              zip: customer.zip || '',
              roles: customer.roles || [],
              names: customer.names || [],
              contactIds: customer.contactIds || [],
              url: customer.web || customer.url || '',
              created: customer.created || '',
              updated: customer.updated || '',
              city: customer.city || '',
              state: customer.state || '',
              customerNumber:
                customer.customer_number || customer.customerNumber || 1,
              lastOrdered: customer.lastOrdered || null
            }
          }
        } catch (customerError) {
          console.error('Error hydrating sign order customer:', customerError)
        }
      }

      const orderWithBranch = {
        ...data.data,
        branch: matchedRequestor?.branches?.name || ''
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
        requestor: matchedRequestor || {
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
        customer:
          hydratedCustomer ||
          (data.data.contractor_id
            ? {
                id: data.data.contractor_id,
                name: data.data.contractors?.name || '',
                displayName: data.data.contractors?.name || '',
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
                customerNumber: 1,
                lastOrdered: null
              }
            : null),
        isSubmitting: false,
        orderType: ordersData,
        orderNumber: data.data.order_number || undefined,
        contact: data.data.contact || null
      })

      if (data.data.order_status === 'SUBMITTED') {
        setAlreadySubmitted(true)
      }

      setDraft(prev => ({
        ...prev,
        notes: Array.isArray(data.data.notes) ? data.data.notes : []
      }))

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

          setDraft(prev => ({
            ...prev,
            signs: signItemsArray as (PrimarySign | SecondarySign)[]
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
        setDraft(prev => ({
          ...prev,
          signs: []
        }))
      }
    } catch (error) {
      toast.error('Error fetching sign order:' + error)
      console.error('Error fetching sign order:', error)
      setLoadingNotes(false)
    } finally {
      stopLoading()
    }
  }

  const handleAdminInfoSaved = async (
    nextAdminInfo: SignOrderAdminInformation
  ) => {
    if (!initialSignOrderId && !signOrderId) {
      return
    }

    const currentId = signOrderId || initialSignOrderId
    if (!currentId) {
      return
    }

    const signOrderData = {
      id: currentId,
      requestor: nextAdminInfo.requestor ? nextAdminInfo.requestor : undefined,
      contractor_id: nextAdminInfo.customer ? nextAdminInfo.customer.id : undefined,
      contract_number: nextAdminInfo.contractNumber,
      order_date: new Date(nextAdminInfo.orderDate).toISOString(),
      need_date: nextAdminInfo.needDate
        ? new Date(nextAdminInfo.needDate).toISOString()
        : undefined,
      start_date: nextAdminInfo.startDate
        ? new Date(nextAdminInfo.startDate).toISOString()
        : '',
      end_date: nextAdminInfo.endDate
        ? new Date(nextAdminInfo.endDate).toISOString()
        : '',
      order_type: nextAdminInfo.orderType,
      job_number: nextAdminInfo.jobNumber,
      signs: draft.signs || [],
      status: alreadySubmitted ? ('SUBMITTED' as const) : ('DRAFT' as const),
      order_number: nextAdminInfo.orderNumber,
      contact: nextAdminInfo.contact
    }

    const result = await saveSignOrder(signOrderData)
    const nextId = result.id || currentId
    if (result.id && !signOrderId) {
      setSignOrderId(result.id)
    }

    await fetchSignOrder(nextId)
  }

  // Initialize MPT rental data
  useEffect(() => {
    dispatch({ type: 'ADD_MPT_RENTAL' })
    logSignOrderDebug('page_loaded', {
      mode: initialSignOrderId ? 'edit' : 'create',
      signOrderId: initialSignOrderId ?? null
    })
    if (!initialSignOrderId) {
      dispatch({ type: 'ADD_MPT_PHASE' })
      return
    } else {
      fetchSignOrder(initialSignOrderId)
    }
  }, [dispatch])

  useEffect(() => {
    const nextSigns = (mptRental.phases[0]?.signs || []) as (PrimarySign | SecondarySign)[]
    setDraft(prev =>
      isEqual(prev.signs, nextSigns)
        ? prev
        : {
            ...prev,
            signs: nextSigns
          }
    )
  }, [mptRental])

  useEffect(() => {
    logSignOrderDebug('sign_count_changed', {
      signCount,
      jobNumber: adminInfo.jobNumber || null,
      contractNumber: adminInfo.contractNumber || null
    })
  }, [adminInfo.contractNumber, adminInfo.jobNumber, signCount])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondCounter(prev => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Autosave effect - exactly like active bid header
  useEffect(() => {
    // Don't autosave if no changes, no contract number, or if it's never been saved
    if (isOrderInvalid() || isEqual(draft, prevDraftRef.current)) return
    else {
      // Clear timeout if there is one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        autosave()
      }, 5000)
    }
  }, [draft])

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
    prevDraftRef.current = draft

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
        signs: draft.signs || [],
        status: 'DRAFT' as const,
        order_number: adminInfo.orderNumber,
        contact: adminInfo.contact
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
      return `${alreadySubmitted ? 'Sign order updates' : 'Draft'
        } saved ${secondCounter} second${secondCounter !== 1 ? 's' : ''} ago`
    } else if (secondCounter < 3600) {
      const minutesAgo = Math.floor(secondCounter / 60)
      return `${alreadySubmitted ? 'Sign order updates' : 'Draft'
        } saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`
    } else {
      const hoursAgo = Math.floor(secondCounter / 3600)
      return `${alreadySubmitted ? 'Sign order ' : 'Draft'
        } saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`
    }
  }

  const fileUploadProps = useFileUpload({
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10, // Allow multiple files to be uploaded
    uniqueIdentifier: signOrderId ?? '',
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
  const { files, successes, isSuccess, errors: fileErrors } = fileUploadProps;

  useEffect(() => {
    if (!fileErrors || fileErrors.length === 0) return;
    if (fileErrors.some(err => err.name === 'identifier')) {
      toast.error('Sign order needs to be saved as draft in order to being associating files. Please add admin data, then click upload files again.')
    }
  }, [fileErrors])

  const fetchFiles = () => {
    if (!signOrderId) return
    fetchAssociatedFiles(signOrderId, 'sign-orders', setDraftFiles)
  }

  useEffect(() => {
    fetchFiles();
  }, [signOrderId])

  useEffect(() => {
    if (isSuccess && files.length > 0) {
      fetchFiles();
    }
  }, [isSuccess, files, successes])

  const handleSaveNote = async (note: Note) => {
    const updatedNotes = [...draft.notes, note];
    if (signOrderId) {
      const resp = await fetch(`/api/sign-orders/addNotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sign_id: signOrderId,
          text: note.text,
          user_email: user.email,
          timestamp: note.timestamp
        })
      });
      const data = await resp.json();

      if (data.ok && data.data) {
        setDraft(prev => ({
          ...prev,
          notes: [
            ...prev.notes,
            { ...data.data, timestamp: new Date(data.data.created_at).getTime() }
          ]
        }))
      }

    }
  }

  const handleEditNote = async (index: number, updatedNote: Note) => {
    const noteToEdit = draft.notes[index];
    if (!noteToEdit) return;

    const resp = await fetch(`/api/sign-orders/addNotes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteToEdit.id, text: updatedNote.text })
    });
    const data = await resp.json();

    if (data.ok && data.data) {
      setDraft(prev => ({
        ...prev,
        notes: prev.notes.map(n =>
          n.id === noteToEdit.id
            ? { ...data.data, timestamp: new Date(data.data.created_at).getTime() }
            : n
        )
      }))
    } else {
      console.error('Error updating note:', data.error || data.message);
    }
  }

  const handleDeleteNote = async (index: number) => {
    const noteToDelete = draft.notes[index];
    if (!noteToDelete) return;

    const resp = await fetch(`/api/sign-orders/addNotes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteToDelete.id })
    });
    const data = await resp.json();

    if (data.ok) {
      setDraft(prev => ({
        ...prev,
        notes: prev.notes.filter(n => n.id !== noteToDelete.id)
      }))
    } else {
      console.error('Error deleting note:', data.error || data.message);
    }
  }

  // Handle saving the sign order
  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    // Prevent multiple submissions
    if (adminInfo.isSubmitting) return
    if (isOrderInvalid()) return

    try {
      logSignOrderDebug('sign_order_save_requested', {
        status,
        signCount,
        signOrderId,
        requestor: adminInfo.requestor?.name ?? null,
        contractNumber: adminInfo.contractNumber || null
      })
      setAdminInfo(prev => ({ ...prev, isSubmitting: true }))

      const signOrderData = {
        id: signOrderId || undefined, // Include ID if we have one
        requestor: adminInfo.requestor ? adminInfo.requestor : undefined,
        contractor_id: adminInfo.customer ? adminInfo.customer.id : undefined,
        contract_number: adminInfo.contractNumber,
        order_date: adminInfo.orderDate
          ? new Date(adminInfo.orderDate).toISOString()
          : '',
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
        signs: draft.signs || [],
        status,
        order_number: adminInfo.orderNumber,
        contact: adminInfo.contact
      }

      const result = await saveSignOrder(signOrderData)

      if (result.id) {
        setSignOrderId(result.id)
      }
      setFirstSave(true)
      logSignOrderDebug('sign_order_save_succeeded', {
        status,
        signCount,
        signOrderId: result.id ?? signOrderId ?? null
      })

      toast.success('Sign order saved successfully')
      router.push('/takeoffs/sign-order/view/' + (signOrderId || result.id))
    } catch (error) {
      console.error('Error saving sign order:', error)
      logSignOrderDebug('sign_order_save_failed', {
        status,
        signCount,
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error((error as string) || 'Failed to save sign order')
    } finally {
      setAdminInfo(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const pdfElement = (
        <SignOrderWorksheetPDF
          adminInfo={adminInfo || {
            ...defaultAdminInfo,
            startDate: undefined,
            endDate: undefined
          }}
          signList={signList || []}
          mptRental={mptRental}
          notes={draft.notes || []}
        />
      );

      const blob = await pdf(pdfElement).toBlob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'sign-order.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };

  return mptRental.phases.length > 0 ? (
    <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
      <PageHeaderWithSaving
        heading="Create Sign Order"
        handleSubmit={() => {
          handleSave("DRAFT");
          router.push("/takeoffs/load-sheet");
        }}
        showX
        saveButtons={
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {getSaveStatusMessage()}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  handleSave(alreadySubmitted ? "SUBMITTED" : "DRAFT")
                }
                disabled={
                  adminInfo.isSubmitting ||
                  draft.signs.length === 0 ||
                  isOrderInvalid()
                }
              >
                {adminInfo.isSubmitting
                  ? "Saving..."
                  : initialSignOrderId
                    ? "Update order"
                    : "Done"}
              </Button>
            </div>
          </div>
        }
      />
      <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 p-6 xl:grid-cols-[minmax(0,3fr)_minmax(320px,1fr)]">
        {/* Main Form Column (3/4) */}
        <div className="min-w-0 space-y-6">
          <SignOrderAdminInfo
            adminInfo={adminInfo}
            setAdminInfo={setAdminInfo}
            showInitialAdminState={!!initialSignOrderId}
            onImport={(signs) => dispatch({ type: 'COPY_MPT_RENTAL', payload: { ...mptRental, phases: [{ ...mptRental.phases[0], signs }] } })}
            onDetailsSaved={handleAdminInfoSaved}
          />
          <SignOrderList needJobNumber={true} jobNumber={adminInfo?.jobNumber} />
        </div>
        {/* Right Column (1/4) */}
        <div className="min-w-0 space-y-6">
          <EquipmentTotalsAccordion />
          <div className="border rounded-lg p-4">
            <h2 className="mb-2 text-lg font-semibold">Files</h2>
            <Dropzone
              {...fileUploadProps}
              className="p-8 cursor-pointer space-y-4 mb-4"
            >
            <DropzoneContent />
              <DropzoneEmptyState />
            </Dropzone>
            <FileViewingContainer
              files={draft.files}
              onFilesChange={files =>
                setDraft(prev => ({
                  ...prev,
                  files
                }))
              }
            />
          </div>
          <QuoteNotes
            notes={draft.notes}
            onSave={handleSaveNote}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
          />
          <div className="bg-[#F4F5F7] p-6 rounded-lg">
            <div className="flex justify-end">
              <Button onClick={handleDownloadPdf}>
                Download PDF
              </Button>
            </div>
            <div className="min-h-[1000px] overflow-y-auto bg-white p-6 mt-4 max-w-[900px]">
              <SignOrderWorksheet
                adminInfo={adminInfo}
                signList={signList}
                mptRental={mptRental}
                notes={draft.notes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
}

const normalizeSign = (sign: any): WorksheetSignItem => ({
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
