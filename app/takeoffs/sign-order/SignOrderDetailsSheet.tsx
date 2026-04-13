'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, ArrowLeft, Check, Edit, Search } from 'lucide-react'
import { cn, formatPhoneNumber } from '@/lib/utils'
import { useState, useEffect, useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'
import { User } from '@/types/User'
import { Customer } from '@/types/Customer'
import { SignOrderAdminInformation, OrderTypes } from './SignOrderContentSimple'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { useCustomers } from '@/hooks/use-customers'
import { RequestorSelector } from '@/components/requestor-selector'
import { restorePointerEvents } from '@/lib/pointer-events-fix'
import { logSignOrderDebug } from '@/lib/log-sign-order-debug'
import { CustomerSelector } from '@/components/CustomerSelector'
import { ContactSelector } from '@/components/ContactSelector'

interface IContact {
  id: number
  name: string
  role: string
  email: string
  phone: string
}

interface Job {
  job_number: string
  branch: string
  contractNumber?: string
  contractorName?: string
  contact: IContact
}

interface SignOrderDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adminInfo: SignOrderAdminInformation
  setAdminInfo: Dispatch<SetStateAction<SignOrderAdminInformation>>
  allUsers: User[]
  customers: Customer[]
  mode: 'edit' | 'create'
  onJobCreated?: (job: Job) => void // Add this callback
  onSaved?: (
    nextAdminInfo: SignOrderAdminInformation
  ) => Promise<void> | void
}

type DrawerView =
  | 'details'
  | 'customer-selection'
  | 'customer-create'
  | 'contact-selection'
  | 'contact-create'
  | 'contact-edit'

const CONTACT_ROLE_OPTIONS = [
  'ESTIMATOR',
  'PROJECT MANAGER',
  'ADMIN',
  'FIELD / SUPERVISOR',
  'OTHER'
] as const

function normalizeCustomer(customer: any): Customer {
  const displayName =
    customer.displayName ||
    customer.display_name ||
    customer.name ||
    `Customer #${customer.id}`

  const validContacts = Array.isArray(customer.customer_contacts)
    ? customer.customer_contacts.filter((contact: any) => !contact?.is_deleted)
    : []

  return {
    id: customer.id,
    name: customer.name || displayName,
    displayName,
    emails:
      customer.emails ||
      validContacts.map((contact: any) => contact.email || ''),
    address: customer.address || '',
    phones:
      customer.phones ||
      validContacts.map((contact: any) => contact.phone || ''),
    roles:
      customer.roles ||
      validContacts.map((contact: any) => contact.role || ''),
    names:
      customer.names ||
      validContacts.map((contact: any) => contact.name || ''),
    contactIds:
      customer.contactIds ||
      validContacts.map((contact: any) => contact.id || 0),
    url: customer.url || customer.web || '',
    created: customer.created || '',
    updated: customer.updated || '',
    city: customer.city || '',
    state: customer.state || '',
    zip: customer.zip || '',
    customerNumber:
      customer.customerNumber || customer.customer_number || 0,
    mainPhone: customer.mainPhone || customer.main_phone || '',
    paymentTerms: customer.paymentTerms || customer.payment_terms || '',
    lastOrdered: customer.lastOrdered || null
  }
}

export function SignOrderDetailsSheet({
  open,
  onOpenChange,
  adminInfo,
  setAdminInfo,
  allUsers,
  customers,
  mode,
  onJobCreated,
  onSaved
}: SignOrderDetailsSheetProps) {
  // Local state for form fields
  const [localRequestor, setLocalRequestor] = useState<User | null>(
    adminInfo.requestor
  )
  const [localCustomer, setLocalCustomer] = useState<Customer | null>(
    adminInfo.customer
  )
  const [localOrderDate, setLocalOrderDate] = useState(adminInfo.orderDate)
  const [localNeedDate, setLocalNeedDate] = useState(adminInfo.needDate)
  const [localOrderType, setLocalOrderType] = useState<OrderTypes[]>(
    adminInfo.orderType
  )
  const [localSelectedBranch, setLocalSelectedBranch] = useState(
    adminInfo.selectedBranch
  )
  const [localJobNumber, setLocalJobNumber] = useState(adminInfo.jobNumber)
  const [localContractNumber, setLocalContractNumber] = useState(
    adminInfo.contractNumber
  )
  const [localStartDate, setLocalStartDate] = useState(adminInfo.startDate)
  const [localEndDate, setLocalEndDate] = useState(adminInfo.endDate)
  const [drawerView, setDrawerView] = useState<DrawerView>('details')
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [customerOptions, setCustomerOptions] = useState<Customer[]>(customers)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [localContact, setLocalContact] = useState<any | null>(null)
  const [editingContact, setEditingContact] = useState<IContact | null>(null)
  const [contactEditorReturnView, setContactEditorReturnView] = useState<
    'details' | 'contact-selection'
  >('contact-selection')
  const [contactFormData, setContactFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: ''
  })
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const { getCustomers } = useCustomers()
  const restoreOverlayInteraction = useCallback(
    (event: string, details: Record<string, unknown> = {}) => {
      restorePointerEvents()
      window.requestAnimationFrame(() => {
        restorePointerEvents()
      })
      window.setTimeout(() => {
        restorePointerEvents()
      }, 0)
      logSignOrderDebug(event, {
        mode,
        ...details
      })
    },
    [mode]
  )

  const applyCustomerSelection = useCallback((customer: Customer | null) => {
    setLocalCustomer(customer)
    setLocalContact(null)
    setContactSearchQuery('')
  }, [])

  const customerContacts = useMemo(() => {
    if (!localCustomer || !Array.isArray(localCustomer.contactIds)) {
      return [] as IContact[]
    }

    return localCustomer.contactIds
      .map((id: number, index: number) => ({
        id,
        name: localCustomer.names?.[index] || '',
        email: localCustomer.emails?.[index] || '',
        phone: localCustomer.phones?.[index] || '',
        role: localCustomer.roles?.[index] || ''
      }))
      .filter(
        contact =>
          Boolean(contact.id) ||
          Boolean(contact.name) ||
          Boolean(contact.email) ||
          Boolean(contact.phone)
      )
  }, [localCustomer])

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) {
      return customerOptions
    }

    const query = customerSearchQuery.toLowerCase()
    return customerOptions.filter(customer =>
      [customer.name, customer.displayName, customer.mainPhone]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(query)) ||
      customer.emails?.some(email => email?.toLowerCase().includes(query))
    )
  }, [customerOptions, customerSearchQuery])

  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery.trim()) {
      return customerContacts
    }

    const query = contactSearchQuery.toLowerCase()
    return customerContacts.filter(contact =>
      [contact.name, contact.email, contact.phone, contact.role]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query))
    )
  }, [contactSearchQuery, customerContacts])

  const formatLastOrdered = useCallback((dateString: string | null | undefined) => {
    if (!dateString) {
      return '-'
    }

    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return '-'
    }
  }, [])

  // Add this smarter effect instead:
  useEffect(() => {
    if (
      localCustomer &&
      localContact &&
      Array.isArray(localCustomer.contactIds) &&
      !localCustomer.contactIds.includes(localContact.id)
    ) {
      // If the selected contact is no longer in the list, reset
      setLocalContact(null)
    }
    // Otherwise, do nothing (preserve selection)
  }, [localContact, localCustomer])

  useEffect(() => {
    setCustomerOptions(prevCustomers => {
      const mergedCustomers = new Map(
        prevCustomers.map(customer => [customer.id, customer])
      )

      customers.forEach(customer => {
        mergedCustomers.set(customer.id, customer)
      })

      return Array.from(mergedCustomers.values())
    })
  }, [customers])

  // Update local state when adminInfo changes or when sheet opens
  useEffect(() => {
    if (open) {
      setDrawerView('details')
      setCustomerSearchQuery('')
      setContactSearchQuery('')
      setNewCustomerName('')
      setEditingContact(null)
      setContactEditorReturnView('contact-selection')
      setContactFormData({
        name: '',
        role: '',
        email: '',
        phone: ''
      })

      if (mode === 'create') {
        // Reset form for new job creation
        setLocalRequestor(adminInfo.requestor)
        setLocalCustomer(null)
        setLocalContact(null)
        setLocalOrderDate(adminInfo.orderDate)
        setLocalNeedDate(adminInfo.needDate)
        setLocalOrderType(adminInfo.orderType)
        setLocalSelectedBranch(adminInfo.selectedBranch)
        setLocalJobNumber('') // Job number will be generated/auto-filled
        setLocalContractNumber('')
        setLocalStartDate(adminInfo.startDate)
        setLocalEndDate(adminInfo.endDate)
      } else {
        // Edit mode - populate with existing data
        setLocalRequestor(adminInfo.requestor)
        setLocalCustomer(adminInfo.customer)
        setLocalContact(adminInfo.contact ?? null)
        setLocalOrderDate(adminInfo.orderDate)
        setLocalNeedDate(adminInfo.needDate)
        setLocalOrderType(adminInfo.orderType)
        setLocalSelectedBranch(adminInfo.selectedBranch)
        setLocalJobNumber(adminInfo.jobNumber)
        setLocalContractNumber(adminInfo.contractNumber)
        setLocalStartDate(adminInfo.startDate)
        setLocalEndDate(adminInfo.endDate)
      }
    }
  }, [open, adminInfo, mode])

  // Update branch when requestor changes
  useEffect(() => {
    if (localRequestor && localRequestor.branches) {
      setLocalSelectedBranch(localRequestor.branches.name)
    }
  }, [localRequestor])

  useEffect(() => {
    if (localCustomer || drawerView === 'details' || drawerView === 'customer-selection' || drawerView === 'customer-create') {
      return
    }

    setDrawerView('details')
  }, [drawerView, localCustomer])

  // Remove the generateJobNumber function since we don't need it

  const handleSheetOpenChange = useCallback((nextOpen: boolean) => {
    logSignOrderDebug('details_sheet_open_changed', {
      open: nextOpen,
      mode,
      requestor: localRequestor?.name ?? null,
      customerId: localCustomer?.id ?? null
    })
    onOpenChange(nextOpen)
    if (!nextOpen) {
      restoreOverlayInteraction('details_sheet_closed', {
        customerId: localCustomer?.id ?? null
      })
    }
  }, [localCustomer?.id, localRequestor?.name, mode, onOpenChange, restoreOverlayInteraction])

  const closeSheet = useCallback(
    (reason: string, details: Record<string, unknown> = {}) => {
      restoreOverlayInteraction(reason, details)
      handleSheetOpenChange(false)
    },
    [handleSheetOpenChange, restoreOverlayInteraction]
  )

  const handleSave = async () => {
    if (isSavingDetails) {
      return
    }

    if (mode === 'create') {
      // For new sign orders, validate required fields
      if (!localCustomer) {
        logSignOrderDebug('details_sheet_save_blocked', {
          reason: 'missing_customer',
          mode
        })
        toast.error('Customer is required')
        return
      }
      if (!localSelectedBranch) {
        logSignOrderDebug('details_sheet_save_blocked', {
          reason: 'missing_branch',
          mode
        })
        toast.error('Branch is required')
        return
      }
    }

    logSignOrderDebug('details_sheet_saved', {
      mode,
      requestor: localRequestor?.name ?? null,
      customerId: localCustomer?.id ?? null,
      contractNumber: localContractNumber || null,
      jobNumber: localJobNumber || null
    })

    const nextAdminInfo: SignOrderAdminInformation = {
      ...adminInfo,
      requestor: localRequestor,
      customer: localCustomer,
      orderDate: localOrderDate,
      needDate: localNeedDate,
      orderType: localOrderType,
      selectedBranch: localSelectedBranch,
      jobNumber: localJobNumber,
      contractNumber: localContractNumber,
      startDate: localStartDate,
      endDate: localEndDate,
      contact: localContact
    }

    setIsSavingDetails(true)

    try {
      // Commit the new admin info into the page before closing.
      flushSync(() => {
        setAdminInfo(() => nextAdminInfo)
      })

      await onSaved?.(nextAdminInfo)
    } catch (error) {
      console.error('Error saving sign order details:', error)
      toast.error('Failed to save sign order details')
      return
    } finally {
      setIsSavingDetails(false)
    }

    if (mode === 'create' && onJobCreated) {
      const newJob: Job = {
        job_number: localJobNumber,
        branch: localSelectedBranch,
        contractNumber: localContractNumber,
        contractorName: localCustomer?.name,
        contact: localContact
      }
      onJobCreated(newJob)
    }

    closeSheet('details_sheet_save_closed', {
      customerId: localCustomer?.id ?? null,
      contactId: localContact?.id ?? null
    })
  }

  const handleOrderTypeChange = (orderType: OrderTypes, checked: boolean) => {
    if (checked) {
      setLocalOrderType(prev => [...prev, orderType])
    } else {
      setLocalOrderType(prev => prev.filter(type => type !== orderType))
    }
  }

  const areAllRequiredFieldsFilled = () => {
    return (
      localContractNumber &&
      localContractNumber !== '' &&
      !!localRequestor &&
      !!localCustomer &&
      !!localContact &&
      !!localNeedDate &&
      localOrderType.length > 0
    )
  }

  const isCreateMode = mode === 'create'
  const sheetTitle =
    drawerView === 'customer-selection'
      ? 'Select Customer'
      : drawerView === 'customer-create'
        ? 'Add New Customer'
        : drawerView === 'contact-selection'
          ? 'Select Contact'
          : drawerView === 'contact-create'
            ? 'Add New Contact'
            : drawerView === 'contact-edit'
              ? 'Edit Contact'
            : isCreateMode
              ? 'Create New Sign Order'
              : 'Edit Sign Order Details'

  // Add this helper function inside the component
  const fetchCustomerById = useCallback(async (id: number) => {
    const res = await fetch(`/api/contractors/${id}`)
    if (res.ok) {
      const data = await res.json()
      if (data?.customer) {
        return normalizeCustomer(data.customer)
      }
    }
    return null
  }, [])

  const returnToDetailsView = useCallback(
    (event: string, details: Record<string, unknown> = {}) => {
      setDrawerView('details')
      setCustomerSearchQuery('')
      setContactSearchQuery('')
      setNewCustomerName('')
      setEditingContact(null)
      setContactEditorReturnView('contact-selection')
      setContactFormData({
        name: '',
        role: '',
        email: '',
        phone: ''
      })
      restoreOverlayInteraction(event, details)
    },
    [restoreOverlayInteraction]
  )

  const openCustomerSelection = useCallback(() => {
    setDrawerView('customer-selection')
    setCustomerSearchQuery('')
    restoreOverlayInteraction('customer_selection_view_opened', {
      customerId: localCustomer?.id ?? null
    })
  }, [localCustomer?.id, restoreOverlayInteraction])

  const openCustomerCreate = useCallback(() => {
    setDrawerView('customer-create')
    restoreOverlayInteraction('customer_create_view_opened', {
      customerId: localCustomer?.id ?? null
    })
  }, [localCustomer?.id, restoreOverlayInteraction])

  const openContactSelection = useCallback(() => {
    if (!localCustomer) {
      toast.error('Please select a customer first')
      return
    }

    setDrawerView('contact-selection')
    setContactSearchQuery('')
    restoreOverlayInteraction('contact_selection_view_opened', {
      customerId: localCustomer.id,
      contactId: localContact?.id ?? null
    })
  }, [localContact?.id, localCustomer, restoreOverlayInteraction])

  const openContactCreate = useCallback(() => {
    if (!localCustomer) {
      toast.error('Please select a customer before adding a contact.')
      return
    }

    setDrawerView('contact-create')
    setEditingContact(null)
    setContactEditorReturnView('contact-selection')
    setContactFormData({
      name: '',
      role: '',
      email: '',
      phone: ''
    })
    restoreOverlayInteraction('contact_create_view_opened', {
      customerId: localCustomer.id
    })
  }, [localCustomer, restoreOverlayInteraction])

  const openContactEdit = useCallback(
    (contact: IContact, returnView: 'details' | 'contact-selection' = 'contact-selection') => {
      const normalizedRole = CONTACT_ROLE_OPTIONS.includes(
        (contact.role || 'OTHER') as (typeof CONTACT_ROLE_OPTIONS)[number]
      )
        ? ((contact.role || 'OTHER') as (typeof CONTACT_ROLE_OPTIONS)[number])
        : 'OTHER'

      setEditingContact(contact)
      setContactEditorReturnView(returnView)
      setDrawerView('contact-edit')
      setContactFormData({
        name: contact.name || '',
        role: normalizedRole,
        email: contact.email || '',
        phone: contact.phone || ''
      })
      restoreOverlayInteraction('contact_edit_view_opened', {
        customerId: localCustomer?.id ?? null,
        contactId: contact.id
      })
    },
    [localCustomer?.id, restoreOverlayInteraction]
  )

  const handleSelectCustomer = useCallback(
    async (customer: Customer) => {
      const hydratedCustomer = await fetchCustomerById(customer.id)
      const nextCustomer = hydratedCustomer || normalizeCustomer(customer)

      applyCustomerSelection(nextCustomer)
      returnToDetailsView('customer_selected', {
        customerId: nextCustomer.id
      })
    },
    [applyCustomerSelection, fetchCustomerById, returnToDetailsView]
  )

  const handleClearCustomerSelection = useCallback(() => {
    applyCustomerSelection(null)
    returnToDetailsView('customer_cleared')
  }, [applyCustomerSelection, returnToDetailsView])

  const handleSelectContact = useCallback(
    (contact: IContact) => {
      setLocalContact(contact)
      returnToDetailsView('contact_selected', {
        customerId: localCustomer?.id ?? null,
        contactId: contact.id
      })
    },
    [localCustomer?.id, returnToDetailsView]
  )

  const handleClearContactSelection = useCallback(() => {
    setLocalContact(null)
    returnToDetailsView('contact_cleared', {
      customerId: localCustomer?.id ?? null
    })
  }, [localCustomer?.id, returnToDetailsView])

  const handleCreateCustomer = useCallback(async () => {
    const trimmedName = newCustomerName.trim()

    if (!trimmedName) {
      return
    }

    setIsCreatingCustomer(true)

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: trimmedName,
          display_name: trimmedName
        })
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok || !result?.customer) {
        throw new Error(
          result?.error || result?.message || 'Failed to create customer'
        )
      }

      await getCustomers()
      const hydratedCustomer = await fetchCustomerById(result.customer.id)
      const nextCustomer =
        hydratedCustomer || normalizeCustomer(result.customer)

      setCustomerOptions(prevCustomers => {
        const nextCustomers = prevCustomers.filter(
          customer => customer.id !== nextCustomer.id
        )
        return [nextCustomer, ...nextCustomers]
      })

      applyCustomerSelection(nextCustomer)
      toast.success('Customer created')
      returnToDetailsView('customer_created_in_drawer', {
        customerId: nextCustomer.id
      })
    } catch (error) {
      console.error('Failed to create customer:', error)
      toast.error('Failed to create customer')
    } finally {
      setIsCreatingCustomer(false)
    }
  }, [
    applyCustomerSelection,
    fetchCustomerById,
    getCustomers,
    newCustomerName,
    returnToDetailsView
  ])

  const handleContactFieldChange = useCallback(
    (field: 'name' | 'role' | 'email' | 'phone', value: string) => {
      setContactFormData(prevFormData => ({
        ...prevFormData,
        [field]: field === 'phone' ? formatPhoneNumber(value) : value
      }))
    },
    []
  )

  const handleSubmitContact = useCallback(async () => {
    if (!localCustomer) {
      toast.error('Please select a customer before adding a contact.')
      return
    }

    if (!contactFormData.name.trim()) {
      toast.error('Name is required')
      return
    }

    setIsSubmittingContact(true)

    try {
      const response = await fetch(
        editingContact
          ? `/api/customer-contacts/${editingContact.id}`
          : '/api/customer-contacts',
        {
          method: editingContact ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contractor_id: localCustomer.id,
            name: contactFormData.name,
            role: contactFormData.role,
            email: contactFormData.email,
            phone: contactFormData.phone
          })
        }
      )

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to save contact')
      }

      const savedContact: IContact = {
        id: editingContact ? editingContact.id : result.data.id,
        name: contactFormData.name.trim(),
        role: contactFormData.role || '',
        email: contactFormData.email || '',
        phone: contactFormData.phone || ''
      }

      const existingIndex = (localCustomer.contactIds || []).findIndex(
        contactId => contactId === savedContact.id
      )

      const updatedCustomer: Customer =
        existingIndex === -1
          ? {
              ...localCustomer,
              contactIds: [...(localCustomer.contactIds || []), savedContact.id],
              names: [...(localCustomer.names || []), savedContact.name],
              emails: [...(localCustomer.emails || []), savedContact.email],
              phones: [...(localCustomer.phones || []), savedContact.phone],
              roles: [...(localCustomer.roles || []), savedContact.role]
            }
          : {
              ...localCustomer,
              names: (localCustomer.names || []).map((value, index) =>
                index === existingIndex ? savedContact.name : value
              ),
              emails: (localCustomer.emails || []).map((value, index) =>
                index === existingIndex ? savedContact.email : value
              ),
              phones: (localCustomer.phones || []).map((value, index) =>
                index === existingIndex ? savedContact.phone : value
              ),
              roles: (localCustomer.roles || []).map((value, index) =>
                index === existingIndex ? savedContact.role : value
              )
            }

      setLocalCustomer(updatedCustomer)
      setCustomerOptions(prevCustomers =>
        prevCustomers.map(customer =>
          customer.id === updatedCustomer.id ? updatedCustomer : customer
        )
      )
      setLocalContact(savedContact)
      toast.success(
        editingContact
          ? 'Contact updated successfully'
          : 'Contact created successfully'
      )
      returnToDetailsView(
        editingContact ? 'contact_updated_in_drawer' : 'contact_created_in_drawer',
        {
          customerId: updatedCustomer.id,
          contactId: savedContact.id
        }
      )
    } catch (error) {
      console.error(
        editingContact ? 'Error updating contact:' : 'Error creating contact:',
        error
      )
      toast.error(editingContact ? 'Failed to update contact' : 'Failed to create contact')
    } finally {
      setIsSubmittingContact(false)
    }
  }, [contactFormData, editingContact, localCustomer, returnToDetailsView])

  useEffect(() => {
    if (open) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      restoreOverlayInteraction('details_sheet_pointer_events_restored')
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [open, restoreOverlayInteraction])

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          className='w-[500px] sm:max-w-[600px] p-0 flex flex-col'
          onCloseAutoFocus={event => {
            event.preventDefault()
            restoreOverlayInteraction('details_sheet_close_auto_focus', {
              customerId: localCustomer?.id ?? null
            })
          }}
          onEscapeKeyDown={() => {
            restoreOverlayInteraction('details_sheet_escape_closed', {
              customerId: localCustomer?.id ?? null
            })
          }}
          onPointerDownOutside={() => {
            restoreOverlayInteraction('details_sheet_outside_closed', {
              customerId: localCustomer?.id ?? null
            })
          }}
        >
          <div className='flex flex-col gap-2 relative z-10 bg-background'>
            <SheetHeader className='p-6 pb-4'>
              <SheetTitle>{sheetTitle}</SheetTitle>
            </SheetHeader>
            <Separator className='w-full -mt-2' />
          </div>

          {drawerView === 'details' && (
            <>
              <div className='flex-1 min-h-0 overflow-y-auto px-6 py-4'>
                <div className='space-y-6'>
                  <div className='space-y-4'>
                    <h3 className='text-lg font-semibold'>Job Information</h3>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label>
                          Contract Number <span className='text-red-600'>*</span>
                        </Label>
                        <Input
                          type='text'
                          value={localContractNumber}
                          onChange={e =>
                            setLocalContractNumber(e.target.value.toUpperCase())
                          }
                          placeholder='Contract number'
                        />
                      </div>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <h3 className='text-lg font-semibold'>Order Details</h3>

                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label>
                          Requestor<span className='text-red-600'>*</span>
                        </Label>
                        <RequestorSelector
                          source='sign-order-requestor'
                          users={allUsers}
                          selectedUser={localRequestor}
                          onSelect={user => {
                            console.debug('[SignOrderDetailsSheet] requestor-updated', {
                              requestor: user.name,
                              email: user.email ?? null,
                              branch: user.branches?.name ?? null
                            })
                            logSignOrderDebug('requestor_updated', {
                              requestor: user.name,
                              email: user.email ?? null,
                              branch: user.branches?.name ?? null,
                              mode
                            })
                            setLocalRequestor(user)
                            if (user.branches?.name) {
                              setLocalSelectedBranch(user.branches.name)
                            }
                          }}
                        />
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label>
                            Customer <span className='text-red-600'>*</span>
                          </Label>
                          <CustomerSelector
                            customers={customerOptions}
                            selectedCustomer={localCustomer}
                            onSelectCustomer={async customer => {
                              if (!customer) {
                                return
                              }
                              const hydratedCustomer =
                                (await fetchCustomerById(customer.id)) || customer
                              applyCustomerSelection(hydratedCustomer)
                            }}
                            onCustomerCreated={async createdCustomer => {
                              await getCustomers()
                              const hydratedCustomer =
                                (await fetchCustomerById(createdCustomer.id)) ||
                                normalizeCustomer(createdCustomer)
                              setCustomerOptions(prevCustomers => {
                                const nextCustomers = prevCustomers.filter(
                                  customer => customer.id !== hydratedCustomer.id
                                )
                                return [hydratedCustomer, ...nextCustomers]
                              })
                              applyCustomerSelection(hydratedCustomer)
                            }}
                            createDescription='Create a customer with a company name, then it will be available in this sign order.'
                          />
                          {localCustomer && (
                            <div className='text-xs text-muted-foreground'>
                              {[localCustomer.address, localCustomer.city, localCustomer.state, localCustomer.zip]
                                .filter(Boolean)
                                .join(', ') || 'Customer selected'}
                            </div>
                          )}
                        </div>

                        <div className='space-y-2'>
                          <Label>
                            Contact <span className='text-red-600'>*</span>
                          </Label>
                          <ContactSelector
                            customer={localCustomer}
                            selectedContact={localContact}
                            onSelectContact={async contact => {
                              setLocalContact(contact)
                            }}
                            onCustomerChange={async customer => {
                              setLocalCustomer(customer)
                            }}
                            showEditButton
                          />
                          {localContact && (
                            <div className='space-y-2'>
                              <div className='space-y-1 text-xs text-muted-foreground'>
                                {localContact.email && <div>{localContact.email}</div>}
                                {localContact.phone && <div>{localContact.phone}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-2 mt-auto'>
                          <Label>Order Date</Label>
                          <Input
                            type='date'
                            placeholder='Select a date'
                            value={localOrderDate.toISOString().split('T')[0]}
                            onChange={e =>
                              setLocalOrderDate(new Date(e.target.value))
                            }
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label>
                            Need Date <span className='text-red-600'>*</span>
                          </Label>
                          <Input
                            type='date'
                            value={
                              localNeedDate
                                ? localNeedDate.toISOString().split('T')[0]
                                : ''
                            }
                            onChange={e =>
                              setLocalNeedDate(new Date(e.target.value))
                            }
                            placeholder='Select a date'
                          />
                        </div>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label>
                        Order Type <span className='text-red-600'>*</span>
                      </Label>
                      <div className='flex flex-wrap gap-4 pt-2'>
                        <div className='flex items-center space-x-2'>
                          <Checkbox
                            id='sale-checkbox-sheet'
                            checked={localOrderType.includes('sale')}
                            onCheckedChange={checked =>
                              handleOrderTypeChange('sale', checked as boolean)
                            }
                          />
                          <Label htmlFor='sale-checkbox-sheet'>Sale</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Checkbox
                            id='rental-checkbox-sheet'
                            checked={localOrderType.includes('rental')}
                            onCheckedChange={checked =>
                              handleOrderTypeChange('rental', checked as boolean)
                            }
                          />
                          <Label htmlFor='rental-checkbox-sheet'>Rental</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Checkbox
                            id='perm-signs-checkbox-sheet'
                            checked={localOrderType.includes('permanent signs')}
                            onCheckedChange={checked =>
                              handleOrderTypeChange(
                                'permanent signs',
                                checked as boolean
                              )
                            }
                          />
                          <Label htmlFor='perm-signs-checkbox-sheet'>
                            Permanent Signs
                          </Label>
                        </div>
                      </div>
                    </div>

                    {localOrderType.includes('rental') && (
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label>Start Date</Label>
                          <Input
                            type='date'
                            value={
                              localStartDate
                                ? localStartDate.toISOString().split('T')[0]
                                : new Date().toISOString().split('T')[0]
                            }
                            onChange={e =>
                              setLocalStartDate(new Date(e.target.value))
                            }
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label>End Date</Label>
                          <Input
                            type='date'
                            value={
                              localEndDate
                                ? localEndDate.toISOString().split('T')[0]
                                : new Date().toISOString().split('T')[0]
                            }
                            onChange={e =>
                              setLocalEndDate(new Date(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />
              <div className='flex flex-col gap-2 w-full'>
                {!areAllRequiredFieldsFilled() && (
                  <div className='flex items-center mt-2 px-6 text-sm gap-2 text-amber-500'>
                    <AlertCircle size={14} />
                    <span>
                      Please fill in all required fields before proceeding.
                    </span>
                  </div>
                )}
                <div className='flex justify-end p-4 px-6'>
                  <div className='flex justify-between items-center gap-2 h-full'>
                    <Button
                      variant='outline'
                      className='flex-1'
                      onClick={() =>
                        closeSheet('details_sheet_cancel_closed', {
                          customerId: localCustomer?.id ?? null,
                          contactId: localContact?.id ?? null
                        })
                      }
                      disabled={isSavingDetails}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!areAllRequiredFieldsFilled() || isSavingDetails}
                      onClick={handleSave}
                      variant='default'
                    >
                      {isSavingDetails
                        ? 'Saving...'
                        : isCreateMode
                          ? 'Create Sign Order'
                          : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {drawerView === 'customer-selection' && (
            <>
              <div className='px-6 py-4 space-y-4 border-b'>
                <div className='flex items-center justify-between gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='gap-2'
                    onClick={() =>
                      returnToDetailsView('customer_selection_back_clicked', {
                        customerId: localCustomer?.id ?? null
                      })
                    }
                  >
                    <ArrowLeft className='h-4 w-4' />
                    Back
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={openCustomerCreate}
                  >
                    Add New Customer
                  </Button>
                </div>

                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    autoFocus
                    placeholder='Search customers by name or email...'
                    value={customerSearchQuery}
                    onChange={event => setCustomerSearchQuery(event.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <div className='flex-1 min-h-0 overflow-y-auto px-6 py-4'>
                <table className='w-full'>
                  <thead className='bg-muted/50 border-b'>
                    <tr>
                      <th className='text-left px-4 py-3 font-medium text-sm'>Name</th>
                      <th className='text-left px-4 py-3 font-medium text-sm'>Last Ordered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          className='text-center py-8 text-muted-foreground'
                        >
                          {customerSearchQuery
                            ? 'No customers found matching your search.'
                            : 'No customers available.'}
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer, index) => (
                        <tr
                          key={customer.id}
                          onClick={() => void handleSelectCustomer(customer)}
                          className={cn(
                            'cursor-pointer transition-colors hover:bg-muted/50 border-b last:border-b-0',
                            index % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                            localCustomer?.id === customer.id && 'bg-primary/5'
                          )}
                        >
                          <td className='px-4 py-3'>
                            <div className='flex items-center gap-2'>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2'>
                                  <span className='font-medium text-sm truncate'>
                                    {customer.displayName || customer.name}
                                  </span>
                                  {localCustomer?.id === customer.id && (
                                    <Check className='h-4 w-4 text-primary flex-shrink-0' />
                                  )}
                                </div>
                                <div className='flex gap-4 mt-1'>
                                  {(customer.address ||
                                    customer.city ||
                                    customer.state ||
                                    customer.zip) && (
                                    <span className='text-xs text-muted-foreground truncate'>
                                      {[customer.address, customer.city, customer.state, customer.zip]
                                        .filter(Boolean)
                                        .join(', ')}
                                    </span>
                                  )}
                                  {customer.mainPhone && (
                                    <span className='text-xs text-muted-foreground'>
                                      {customer.mainPhone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-3'>
                            <span className='text-sm text-muted-foreground'>
                              {formatLastOrdered(customer.lastOrdered)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Separator />
              <div className='flex items-center justify-between p-4 px-6 gap-2'>
                <div>
                  {localCustomer && (
                    <Button
                      variant='outline'
                      onClick={handleClearCustomerSelection}
                      className='text-muted-foreground'
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
                <Button
                  variant='outline'
                  onClick={() =>
                    returnToDetailsView('customer_selection_cancelled', {
                      customerId: localCustomer?.id ?? null
                    })
                  }
                >
                  Back to Edit
                </Button>
              </div>
            </>
          )}

          {drawerView === 'customer-create' && (
            <>
              <div className='flex-1 min-h-0 overflow-y-auto px-6 py-4'>
                <div className='space-y-4'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='gap-2'
                    onClick={() =>
                      setDrawerView('customer-selection')
                    }
                  >
                    <ArrowLeft className='h-4 w-4' />
                    Back to Customers
                  </Button>

                  <div>
                    <Label>Company Name</Label>
                    <Input
                      className='mt-1.5'
                      value={newCustomerName}
                      onChange={event => setNewCustomerName(event.target.value)}
                      placeholder='Enter company name'
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleCreateCustomer()
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator />
              <div className='flex justify-end gap-2 p-4 px-6'>
                <Button
                  variant='outline'
                  onClick={() => setDrawerView('customer-selection')}
                  disabled={isCreatingCustomer}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleCreateCustomer()}
                  disabled={!newCustomerName.trim() || isCreatingCustomer}
                >
                  {isCreatingCustomer ? 'Creating...' : 'Create Customer'}
                </Button>
              </div>
            </>
          )}

          {drawerView === 'contact-selection' && (
            <>
              <div className='px-6 py-4 space-y-4 border-b'>
                <div className='flex items-center justify-between gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='gap-2'
                    onClick={() =>
                      returnToDetailsView('contact_selection_back_clicked', {
                        customerId: localCustomer?.id ?? null,
                        contactId: localContact?.id ?? null
                      })
                    }
                  >
                    <ArrowLeft className='h-4 w-4' />
                    Back
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={openContactCreate}
                  >
                    Add New Contact
                  </Button>
                </div>

                <div className='space-y-1'>
                  <div className='text-sm font-medium'>
                    {localCustomer?.displayName || localCustomer?.name}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Select a contact for this customer.
                  </div>
                </div>

                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    autoFocus
                    placeholder='Search contacts by name, email, phone, or role...'
                    value={contactSearchQuery}
                    onChange={event => setContactSearchQuery(event.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <div className='flex-1 min-h-0 overflow-y-auto px-6 py-4'>
                {filteredContacts.length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    {contactSearchQuery
                      ? 'No contacts found matching your search.'
                      : 'No contacts available for this customer yet.'}
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        className={cn(
                          'flex items-start gap-2 rounded-md border px-4 py-3 transition-colors hover:bg-muted/50',
                          localContact?.id === contact.id && 'border-primary bg-primary/5'
                        )}
                      >
                        <button
                          type='button'
                          onClick={() => handleSelectContact(contact)}
                          className='flex-1 text-left'
                        >
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-sm'>
                              {contact.name || 'Unnamed Contact'}
                            </span>
                            {localContact?.id === contact.id && (
                              <Check className='h-4 w-4 text-primary' />
                            )}
                          </div>
                          <div className='mt-1 space-y-1 text-xs text-muted-foreground'>
                            {contact.role && <div>{contact.role}</div>}
                            {contact.email && <div>{contact.email}</div>}
                            {contact.phone && <div>{contact.phone}</div>}
                          </div>
                        </button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          aria-label='Edit contact'
                          className='h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground'
                          onClick={() => openContactEdit(contact, 'contact-selection')}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />
              <div className='flex items-center justify-between p-4 px-6 gap-2'>
                <div>
                  {localContact && (
                    <Button
                      variant='outline'
                      onClick={handleClearContactSelection}
                      className='text-muted-foreground'
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
                <Button
                  variant='outline'
                  onClick={() =>
                    returnToDetailsView('contact_selection_cancelled', {
                      customerId: localCustomer?.id ?? null,
                      contactId: localContact?.id ?? null
                    })
                  }
                >
                  Back to Edit
                </Button>
              </div>
            </>
          )}

          {(drawerView === 'contact-create' || drawerView === 'contact-edit') &&
            localCustomer && (
            <>
              <div className='flex-1 min-h-0 overflow-y-auto px-6 py-4'>
                <div className='space-y-4'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='gap-2'
                    onClick={() => setDrawerView(contactEditorReturnView)}
                  >
                    <ArrowLeft className='h-4 w-4' />
                    {contactEditorReturnView === 'details'
                      ? 'Back to Details'
                      : 'Back to Contacts'}
                  </Button>

                  <div className='border rounded-md p-4 bg-muted/20 space-y-2'>
                    <h3 className='text-base font-semibold'>
                      {localCustomer.displayName || localCustomer.name}
                    </h3>
                    {(localCustomer.address ||
                      localCustomer.city ||
                      localCustomer.state ||
                      localCustomer.zip) && (
                      <div className='text-sm text-muted-foreground'>
                        {[localCustomer.address, localCustomer.city, localCustomer.state, localCustomer.zip]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
                    {localCustomer.paymentTerms && (
                      <div className='text-sm text-muted-foreground'>
                        Payment Terms: {localCustomer.paymentTerms}
                      </div>
                    )}
                    {localCustomer.url && (
                      <div className='text-sm text-muted-foreground break-all'>
                        Website: {localCustomer.url}
                      </div>
                    )}
                  </div>

                  <div className='grid gap-4'>
                    <div className='space-y-2'>
                      <Label>
                        Name <span className='text-red-600'>*</span>
                      </Label>
                      <Input
                        value={contactFormData.name}
                        onChange={event =>
                          handleContactFieldChange('name', event.target.value)
                        }
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label>Role</Label>
                      <Select
                        value={contactFormData.role}
                        onValueChange={value =>
                          handleContactFieldChange('role', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select role' />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTACT_ROLE_OPTIONS.map(role => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label>Email</Label>
                      <Input
                        type='email'
                        value={contactFormData.email}
                        onChange={event =>
                          handleContactFieldChange('email', event.target.value)
                        }
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label>Phone</Label>
                      <Input
                        value={contactFormData.phone}
                        onChange={event =>
                          handleContactFieldChange('phone', event.target.value)
                        }
                        placeholder='(123) 456-7890'
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
              <div className='flex justify-end gap-2 p-4 px-6'>
                <Button
                  variant='outline'
                  onClick={() => setDrawerView(contactEditorReturnView)}
                  disabled={isSubmittingContact}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleSubmitContact()}
                  disabled={isSubmittingContact}
                >
                  {isSubmittingContact
                    ? drawerView === 'contact-edit'
                      ? 'Saving...'
                      : 'Creating...'
                    : drawerView === 'contact-edit'
                      ? 'Save Contact'
                      : 'Create Contact'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
