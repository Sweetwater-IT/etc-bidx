'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Building2,
  FilePlus,
  FileText,
  FolderOpen,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Save,
  Search,
  Trash2,
  User,
  Edit,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { SimpleCustomerCreateForm } from '@/components/simple-customer-create-form'
import { formatPhoneNumber } from '@/lib/utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const CONTACT_ROLE_OPTIONS = [
  'PRIMARY CONTACT',
  'PROJECT MANAGER',
  'ESTIMATOR',
  'PUBLIC WORKS DIRECTOR',
  'ROADMASTER',
  'TOWNSHIP MANAGER',
  'BILLING',
  'ACCOUNTING',
  'OTHER',
] as const

type ContactRole = (typeof CONTACT_ROLE_OPTIONS)[number]

interface CustomerListItem {
  id: number
  name: string | null
  display_name: string | null
  main_phone: string | null
  created: string | null
  updated: string | null
  payment_terms: string | null
}

interface CustomerContactRecord {
  id: number
  contractor_id: number
  name: string | null
  phone: string | null
  email: string | null
  role: string | null
  is_deleted?: boolean | null
}

interface CustomerRecord extends CustomerListItem {
  web: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  customer_number: string | null
  would_like_to_apply_for_credit: boolean | null
  bill_to_street: string | null
  bill_to_city: string | null
  bill_to_state: string | null
  bill_to_zip: string | null
  customer_contacts: CustomerContactRecord[]
}

interface JobDocument {
  id: number
  etc_job_number: string | null
  project_name: string | null
  contract_status: string | null
  created_at: string | null
}

interface QuoteDocument {
  id: number
  quote_number: string | null
  status: string | null
  created_at: string | null
}

interface SignOrderDocument {
  id: number
  order_number: string | null
  status: string | null
  created_at: string | null
}

interface CustomerEditForm {
  name: string
  display_name: string
  customer_number: string
  main_phone: string
  web: string
  address: string
  city: string
  state: string
  zip: string
  billToSameAsMain: boolean
  bill_to_street: string
  bill_to_city: string
  bill_to_state: string
  bill_to_zip: string
  personOrderingContactId: number | null
  personOrderingName: string
  personOrderingTitle: string
  primaryContactId: number | null
  primaryContactName: string
  primaryContactPhone: string
  primaryContactEmail: string
  primaryContactSameAsPersonOrdering: boolean
  projectManagerContactId: number | null
  projectManagerName: string
  projectManagerPhone: string
  projectManagerEmail: string
  payment_terms: string
  would_like_to_apply_for_credit: boolean
}

interface LinkedDocumentSectionItem {
  id: number
  code: string
  name: string
  status: string
  href: string
}

const EMPTY_EDIT_FORM: CustomerEditForm = {
  name: '',
  display_name: '',
  customer_number: '',
  main_phone: '',
  web: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  billToSameAsMain: false,
  bill_to_street: '',
  bill_to_city: '',
  bill_to_state: '',
  bill_to_zip: '',
  personOrderingContactId: null,
  personOrderingName: '',
  personOrderingTitle: '',
  primaryContactId: null,
  primaryContactName: '',
  primaryContactPhone: '',
  primaryContactEmail: '',
  primaryContactSameAsPersonOrdering: false,
  projectManagerContactId: null,
  projectManagerName: '',
  projectManagerPhone: '',
  projectManagerEmail: '',
  payment_terms: '',
  would_like_to_apply_for_credit: false,
}

const EMPTY_CONTACT_FORM = {
  name: '',
  phone: '',
  email: '',
  role: 'PRIMARY CONTACT' as ContactRole,
}

function formatCustomerName(customer: Pick<CustomerListItem, 'name' | 'display_name' | 'id'>) {
  return customer.display_name?.trim() || customer.name?.trim() || `Customer #${customer.id}`
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  return parsed.toLocaleDateString()
}

function normalizeQuoteRows(rows: any[] | null): QuoteDocument[] {
  if (!Array.isArray(rows)) {
    return []
  }

  const normalized = rows.flatMap((row: any) => {
    if (Array.isArray(row.quotes)) {
      return row.quotes
    }

    if (row.quotes) {
      return [row.quotes]
    }

    return []
  })

  return normalized
    .filter((quote: any) => quote?.id)
    .sort((a: any, b: any) => {
      const first = a.created_at ? new Date(a.created_at).getTime() : 0
      const second = b.created_at ? new Date(b.created_at).getTime() : 0
      return second - first
    })
}

function normalizeRole(role?: string | null) {
  return role?.trim().toUpperCase() || ''
}

function getLegacyDrawerContacts(contacts: CustomerContactRecord[]) {
  const primaryContact =
    contacts.find(contact => normalizeRole(contact.role) === 'PRIMARY CONTACT') || null
  const projectManager =
    contacts.find(contact => normalizeRole(contact.role) === 'PROJECT MANAGER') || null

  const reservedIds = new Set(
    [primaryContact?.id, projectManager?.id].filter(
      (value): value is number => typeof value === 'number'
    )
  )

  const personOrdering =
    contacts.find(contact => {
      if (reservedIds.has(contact.id)) {
        return false
      }

      const role = normalizeRole(contact.role)
      return role !== 'BILLING' && role !== 'ACCOUNTING'
    }) || null

  return {
    personOrdering,
    primaryContact,
    projectManager,
  }
}

function mapCustomerToEditForm(customer: CustomerRecord): CustomerEditForm {
  const { personOrdering, primaryContact, projectManager } = getLegacyDrawerContacts(
    customer.customer_contacts || []
  )
  const billToSameAsMain =
    (customer.bill_to_street || '') === (customer.address || '') &&
    (customer.bill_to_city || '') === (customer.city || '') &&
    (customer.bill_to_state || '') === (customer.state || '') &&
    (customer.bill_to_zip || '') === (customer.zip || '')

  return {
    name: customer.name || '',
    display_name: customer.display_name || '',
    customer_number: customer.customer_number || '',
    main_phone: customer.main_phone || '',
    web: customer.web || '',
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    zip: customer.zip || '',
    billToSameAsMain,
    bill_to_street: customer.bill_to_street || '',
    bill_to_city: customer.bill_to_city || '',
    bill_to_state: customer.bill_to_state || '',
    bill_to_zip: customer.bill_to_zip || '',
    personOrderingContactId: personOrdering?.id ?? null,
    personOrderingName: personOrdering?.name || '',
    personOrderingTitle:
      normalizeRole(personOrdering?.role) === 'PERSON ORDERING'
        ? ''
        : personOrdering?.role || '',
    primaryContactId: primaryContact?.id ?? null,
    primaryContactName: primaryContact?.name || '',
    primaryContactPhone: primaryContact?.phone || '',
    primaryContactEmail: primaryContact?.email || '',
    primaryContactSameAsPersonOrdering:
      !!primaryContact?.name &&
      !!personOrdering?.name &&
      primaryContact.name.trim().toLowerCase() ===
        personOrdering.name.trim().toLowerCase(),
    projectManagerContactId: projectManager?.id ?? null,
    projectManagerName: projectManager?.name || '',
    projectManagerPhone: projectManager?.phone || '',
    projectManagerEmail: projectManager?.email || '',
    payment_terms: customer.payment_terms || '',
    would_like_to_apply_for_credit: !!customer.would_like_to_apply_for_credit,
  }
}

const CustomersContent = () => {
  const router = useRouter()

  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null)
  const [contacts, setContacts] = useState<CustomerContactRecord[]>([])
  const [linkedJobs, setLinkedJobs] = useState<JobDocument[]>([])
  const [linkedQuotes, setLinkedQuotes] = useState<QuoteDocument[]>([])
  const [linkedSignOrders, setLinkedSignOrders] = useState<SignOrderDocument[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  const [newDialogOpen, setNewDialogOpen] = useState(false)

  const [editing, setEditing] = useState(false)
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [editForm, setEditForm] = useState<CustomerEditForm>(EMPTY_EDIT_FORM)

  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [creatingContact, setCreatingContact] = useState(false)
  const [newContact, setNewContact] = useState({ ...EMPTY_CONTACT_FORM })
  const [editingContact, setEditingContact] = useState<CustomerContactRecord | null>(null)
  const [editContactDialogOpen, setEditContactDialogOpen] = useState(false)
  const [savingEditedContact, setSavingEditedContact] = useState(false)
  const [editContactForm, setEditContactForm] = useState({ ...EMPTY_CONTACT_FORM })
  const [deleteCustomerConfirm, setDeleteCustomerConfirm] = useState(false)
  const [deleteContactConfirm, setDeleteContactConfirm] = useState<number | null>(null)
  const [deletingContact, setDeletingContact] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('contractors')
        .select('id, name, display_name, main_phone, created, updated, payment_terms')
        .eq('is_deleted', false)
        .order('name')

      if (error) {
        throw error
      }

      setCustomers((data as CustomerListItem[]) || [])
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCustomerDetails = useCallback(async (customerId: number) => {
    setDetailLoading(true)

    try {
      const customerResponse = await fetch(`/api/contractors/${customerId}`)

      const customerResult = await customerResponse.json().catch(() => null)

      if (!customerResponse.ok || !customerResult?.ok || !customerResult?.customer) {
        throw new Error(customerResult?.error || 'Failed to load customer')
      }

      const customer = customerResult.customer as CustomerRecord
      const activeContacts = (customer.customer_contacts || [])
        .filter(contact => !contact.is_deleted)
        .sort((first, second) =>
          (first.name || '').localeCompare(second.name || '')
        )

      setSelectedCustomer({
        ...customer,
        customer_contacts: activeContacts,
      })
      setContacts(activeContacts)

      const [jobsResult, quotesResult, signOrdersResult] = await Promise.allSettled([
        supabase
          .from('jobs_l')
          .select('id, etc_job_number, project_name, contract_status, created_at')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false }),
        supabase
          .from('quotes_customers')
          .select('quote_id, quotes(id, quote_number, status, created_at)')
          .eq('contractor_id', customerId),
        supabase
          .from('sign_orders')
          .select('id, order_number, status, created_at')
          .eq('contractor_id', customerId)
          .order('created_at', { ascending: false }),
      ])

      if (jobsResult.status === 'fulfilled') {
        if (jobsResult.value.error) {
          console.warn('[Customers] failed to load linked jobs', {
            customerId,
            message: jobsResult.value.error.message,
          })
          setLinkedJobs([])
        } else {
          setLinkedJobs((jobsResult.value.data as JobDocument[]) || [])
        }
      } else {
        console.warn('[Customers] jobs query rejected', {
          customerId,
          reason: jobsResult.reason,
        })
        setLinkedJobs([])
      }

      if (quotesResult.status === 'fulfilled') {
        if (quotesResult.value.error) {
          console.warn('[Customers] failed to load linked quotes', {
            customerId,
            message: quotesResult.value.error.message,
          })
          setLinkedQuotes([])
        } else {
          setLinkedQuotes(normalizeQuoteRows(quotesResult.value.data as any[]))
        }
      } else {
        console.warn('[Customers] quotes query rejected', {
          customerId,
          reason: quotesResult.reason,
        })
        setLinkedQuotes([])
      }

      if (signOrdersResult.status === 'fulfilled') {
        if (signOrdersResult.value.error) {
          console.warn('[Customers] failed to load linked sign orders', {
            customerId,
            message: signOrdersResult.value.error.message,
          })
          setLinkedSignOrders([])
        } else {
          setLinkedSignOrders((signOrdersResult.value.data as SignOrderDocument[]) || [])
        }
      } else {
        console.warn('[Customers] sign orders query rejected', {
          customerId,
          reason: signOrdersResult.reason,
        })
        setLinkedSignOrders([])
      }
    } catch (error) {
      console.error('Failed to fetch customer details:', error)
      toast.error('Failed to load customer details')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    if (!selectedId) {
      setSelectedCustomer(null)
      setContacts([])
      setLinkedJobs([])
      setLinkedQuotes([])
      setLinkedSignOrders([])
      setEditing(false)
      return
    }

    fetchCustomerDetails(selectedId)
  }, [fetchCustomerDetails, selectedId])

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return customers
    }

    return customers.filter(customer => {
      const name = customer.name?.toLowerCase() || ''
      const displayName = customer.display_name?.toLowerCase() || ''
      const phone = customer.main_phone?.toLowerCase() || ''
      return (
        name.includes(query) ||
        displayName.includes(query) ||
        phone.includes(query)
      )
    })
  }, [customers, search])

  const documentSections = useMemo(() => {
    const jobs: LinkedDocumentSectionItem[] = linkedJobs.map(job => ({
      id: job.id,
      code: job.etc_job_number || `Job ${job.id}`,
      name: job.project_name || 'Untitled job',
      status: job.contract_status || 'Unknown',
      href: `/jobs/${job.id}`,
    }))

    const quotes: LinkedDocumentSectionItem[] = linkedQuotes.map(quote => ({
      id: quote.id,
      code: quote.quote_number || `Quote ${quote.id}`,
      name: 'Quote / Proposal',
      status: quote.status || 'Unknown',
      href: `/quotes/view/${quote.id}`,
    }))

    const signOrders: LinkedDocumentSectionItem[] = linkedSignOrders.map(order => ({
      id: order.id,
      code: order.order_number || `Sign Order ${order.id}`,
      name: 'Sign Order',
      status: order.status || 'Unknown',
      href: `/takeoffs/sign-order/view/${order.id}`,
    }))

    return { jobs, quotes, signOrders }
  }, [linkedJobs, linkedQuotes, linkedSignOrders])

  const startEditing = () => {
    if (!selectedCustomer) {
      return
    }

    setEditForm(mapCustomerToEditForm(selectedCustomer))
    setEditing(true)
  }

  const saveLegacyContact = useCallback(
    async ({
      contactId,
      name,
      role,
      email,
      phone,
    }: {
      contactId: number | null
      name: string
      role: string
      email?: string
      phone?: string
    }) => {
      if (!selectedId) {
        return
      }

      const trimmedName = name.trim()
      const trimmedRole = role.trim()
      const trimmedEmail = email?.trim() || null
      const trimmedPhone = phone?.trim() || null
      const hasValues = !!trimmedName || !!trimmedEmail || !!trimmedPhone

      if (!hasValues) {
        if (contactId) {
          const deleteResponse = await fetch(`/api/customer-contacts/${contactId}`, {
            method: 'DELETE',
          })

          if (!deleteResponse.ok) {
            const errorResult = await deleteResponse.json().catch(() => null)
            throw new Error(errorResult?.error || 'Failed to remove customer contact')
          }
        }

        return
      }

      const payload = {
        contractor_id: selectedId,
        name: trimmedName || null,
        role: trimmedRole || null,
        email: trimmedEmail,
        phone: trimmedPhone,
      }

      if (contactId) {
        const updateResponse = await fetch(`/api/customer-contacts/${contactId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!updateResponse.ok) {
          const errorResult = await updateResponse.json().catch(() => null)
          throw new Error(errorResult?.error || 'Failed to update customer contact')
        }

        return
      }

      const createResponse = await fetch('/api/customer-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const createResult = await createResponse.json().catch(() => null)

      if (!createResponse.ok || !createResult?.success) {
        throw new Error(createResult?.error || 'Failed to create customer contact')
      }
    },
    [selectedId]
  )

  const handleSaveCustomer = async () => {
    if (!selectedId) {
      return
    }

    const resolvedBillToStreet = editForm.billToSameAsMain
      ? editForm.address
      : editForm.bill_to_street
    const resolvedBillToCity = editForm.billToSameAsMain
      ? editForm.city
      : editForm.bill_to_city
    const resolvedBillToState = editForm.billToSameAsMain
      ? editForm.state
      : editForm.bill_to_state
    const resolvedBillToZip = editForm.billToSameAsMain
      ? editForm.zip
      : editForm.bill_to_zip
    const resolvedPrimaryContactName = editForm.primaryContactSameAsPersonOrdering
      ? editForm.personOrderingName
      : editForm.primaryContactName

    if (editForm.primaryContactSameAsPersonOrdering && !editForm.personOrderingName.trim()) {
      toast.error('Add a person ordering name before using same as person ordering')
      return
    }

    setSavingCustomer(true)

    try {
      const response = await fetch(`/api/contractors/${selectedId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          display_name: editForm.display_name,
          customer_number: editForm.customer_number,
          main_phone: editForm.main_phone,
          web: editForm.web,
          address: editForm.address,
          city: editForm.city,
          state: editForm.state,
          zip: editForm.zip,
          bill_to_street: resolvedBillToStreet,
          bill_to_city: resolvedBillToCity,
          bill_to_state: resolvedBillToState,
          bill_to_zip: resolvedBillToZip,
          payment_terms: editForm.payment_terms,
          would_like_to_apply_for_credit: editForm.would_like_to_apply_for_credit,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to update customer')
      }

      await Promise.all([
        saveLegacyContact({
          contactId: editForm.personOrderingContactId,
          name: editForm.personOrderingName,
          role: editForm.personOrderingTitle || 'PERSON ORDERING',
        }),
        saveLegacyContact({
          contactId: editForm.primaryContactId,
          name: resolvedPrimaryContactName,
          role: 'PRIMARY CONTACT',
          phone: editForm.primaryContactPhone,
          email: editForm.primaryContactEmail,
        }),
        saveLegacyContact({
          contactId: editForm.projectManagerContactId,
          name: editForm.projectManagerName,
          role: 'PROJECT MANAGER',
          phone: editForm.projectManagerPhone,
          email: editForm.projectManagerEmail,
        }),
      ])

      toast.success('Customer updated')
      setEditing(false)
      await Promise.all([fetchCustomers(), fetchCustomerDetails(selectedId)])
    } catch (error) {
      console.error('Failed to update customer:', error)
      toast.error('Failed to save customer')
    } finally {
      setSavingCustomer(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!selectedId) {
      return
    }

    setDeletingCustomer(true)

    try {
      const response = await fetch(`/api/contractors/${selectedId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to delete customer')
      }

      toast.success('Customer deleted')
      setDeleteCustomerConfirm(false)
      setSelectedId(null)
      setSelectedCustomer(null)
      await fetchCustomers()
    } catch (error) {
      console.error('Failed to delete customer:', error)
      toast.error('Failed to delete customer')
    } finally {
      setDeletingCustomer(false)
    }
  }

  const handleAddContact = async () => {
    if (!selectedId || !newContact.name.trim()) {
      return
    }

    setCreatingContact(true)

    try {
      const response = await fetch('/api/customer-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractor_id: selectedId,
          name: newContact.name.trim(),
          phone: newContact.phone.trim() || null,
          email: newContact.email.trim() || null,
          role: newContact.role,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add contact')
      }

      toast.success('Contact added')
      setContactDialogOpen(false)
      setNewContact({ ...EMPTY_CONTACT_FORM })
      await fetchCustomerDetails(selectedId)
    } catch (error) {
      console.error('Failed to add contact:', error)
      toast.error('Failed to add contact')
    } finally {
      setCreatingContact(false)
    }
  }

  const openEditContactDialog = (contact: CustomerContactRecord) => {
    const normalizedRole = CONTACT_ROLE_OPTIONS.includes(
      (contact.role || 'OTHER') as ContactRole
    )
      ? ((contact.role || 'OTHER') as ContactRole)
      : 'OTHER'

    setEditingContact(contact)
    setEditContactForm({
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      role: normalizedRole,
    })
    setEditContactDialogOpen(true)
  }

  const closeEditContactDialog = () => {
    setEditContactDialogOpen(false)
    setEditingContact(null)
    setEditContactForm({ ...EMPTY_CONTACT_FORM })
  }

  const handleSaveEditedContact = async () => {
    if (!selectedId || !editingContact || !editContactForm.name.trim()) {
      return
    }

    setSavingEditedContact(true)

    try {
      const response = await fetch(`/api/customer-contacts/${editingContact.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractor_id: selectedId,
          name: editContactForm.name.trim(),
          phone: editContactForm.phone.trim() || null,
          email: editContactForm.email.trim() || null,
          role: editContactForm.role,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to update contact')
      }

      toast.success('Contact updated')
      closeEditContactDialog()
      await fetchCustomerDetails(selectedId)
    } catch (error) {
      console.error('Failed to update contact:', error)
      toast.error('Failed to update contact')
    } finally {
      setSavingEditedContact(false)
    }
  }

  const handleDeleteContact = async (contactId: number) => {
    setDeletingContact(true)

    try {
      const response = await fetch(`/api/customer-contacts/${contactId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove contact')
      }

      if (selectedId) {
        await fetchCustomerDetails(selectedId)
      }

      setDeleteContactConfirm(null)
      toast.success('Contact removed')
    } catch (error) {
      console.error('Failed to remove contact:', error)
      toast.error('Failed to remove contact')
    } finally {
      setDeletingContact(false)
    }
  }

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6'>
      <div className='flex items-center justify-between rounded-lg border bg-card px-5 py-4'>
        <div className='flex items-center gap-3'>
          <div className='rounded bg-primary p-2'>
            <Building2 className='h-5 w-5 text-primary-foreground' />
          </div>
          <div>
            <h1 className='text-lg font-bold tracking-tight'>Customers</h1>
            <p className='text-xs text-muted-foreground'>
              {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Button onClick={() => setNewDialogOpen(true)} className='gap-2'>
          <Plus className='h-4 w-4' />
          New Customer
        </Button>
      </div>

      <div className='grid min-h-0 flex-1 grid-cols-12 gap-4 overflow-hidden'>
        <div className='col-span-3 flex min-h-0 flex-col rounded-lg border bg-card'>
          <div className='shrink-0 border-b p-3'>
            <div className='relative'>
              <Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder='Search customers...'
                className='h-9 pl-8 text-sm'
              />
            </div>
          </div>

          <div className='flex-1 overflow-y-auto'>
            {loading ? (
              <div className='p-4 text-center text-sm text-muted-foreground'>
                Loading customers...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className='p-8 text-center'>
                <Building2 className='mx-auto mb-2 h-8 w-8 text-muted-foreground/30' />
                <p className='text-sm text-muted-foreground'>No customers found</p>
              </div>
            ) : (
              <div className='space-y-1.5 p-2'>
                {filteredCustomers.map(customer => {
                  const isSelected = selectedId === customer.id
                  return (
                    <button
                      key={customer.id}
                      type='button'
                      onClick={() => {
                        setSelectedId(customer.id)
                        setEditing(false)
                      }}
                      className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'border-primary/20 bg-primary/10'
                          : 'border-transparent hover:bg-muted/50'
                      }`}
                    >
                      <p className='truncate text-sm font-semibold'>
                        {formatCustomerName(customer)}
                      </p>
                      {customer.name && customer.display_name && customer.name !== customer.display_name ? (
                        <p className='truncate text-[11px] text-muted-foreground'>
                          {customer.name}
                        </p>
                      ) : null}
                      <p className='mt-0.5 text-[10px] text-muted-foreground'>
                        {customer.main_phone || 'No phone'}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className='col-span-5 flex min-h-0 flex-col rounded-lg border bg-card'>
          {!selectedId ? (
            <div className='flex flex-1 items-center justify-center'>
              <div className='text-center'>
                <Building2 className='mx-auto mb-3 h-10 w-10 text-muted-foreground/20' />
                <p className='text-sm text-muted-foreground'>
                  Select a customer to view details
                </p>
              </div>
            </div>
          ) : detailLoading || !selectedCustomer ? (
            <div className='flex flex-1 items-center justify-center'>
              <p className='text-sm text-muted-foreground'>Loading details...</p>
            </div>
          ) : (
            <>
              <div className='flex items-center justify-between border-b px-4 py-3'>
                <h2 className='text-sm font-bold'>Customer Details</h2>
                <div className='flex items-center gap-1.5'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 gap-1 text-xs'
                    onClick={startEditing}
                  >
                    <Edit className='h-3 w-3' />
                    Edit
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-7 gap-1 text-xs text-destructive hover:text-destructive'
                    onClick={() => setDeleteCustomerConfirm(true)}
                  >
                    <Trash2 className='h-3 w-3' />
                  </Button>
                </div>
              </div>

              <div className='flex-1 overflow-y-auto'>
                <div className='space-y-5 p-4'>
                  <div className='space-y-3'>
                    <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                      Company
                    </h3>

                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <Building2 className='h-4 w-4 shrink-0 text-primary' />
                        <div>
                          <p className='text-sm font-semibold'>
                            {formatCustomerName(selectedCustomer)}
                          </p>
                          {selectedCustomer.name &&
                          selectedCustomer.display_name &&
                          selectedCustomer.name !== selectedCustomer.display_name ? (
                            <p className='text-xs text-muted-foreground'>
                              {selectedCustomer.name}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className='flex items-center gap-2 text-sm'>
                        <Phone className='h-3.5 w-3.5 text-muted-foreground' />
                        {selectedCustomer.main_phone || (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </div>

                      <div className='flex items-center gap-2 text-sm'>
                        <Globe className='h-3.5 w-3.5 text-muted-foreground' />
                        {selectedCustomer.web ? (
                          <a
                            href={
                              selectedCustomer.web.startsWith('http')
                                ? selectedCustomer.web
                                : `https://${selectedCustomer.web}`
                            }
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-primary underline'
                          >
                            {selectedCustomer.web}
                          </a>
                        ) : (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </div>

                      <div className='flex items-center gap-2 text-sm'>
                        <Receipt className='h-3.5 w-3.5 text-muted-foreground' />
                        {selectedCustomer.payment_terms || (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </div>

                      <div className='grid grid-cols-2 gap-3 pt-1 text-xs'>
                        <DetailRow
                          label='Customer Number'
                          value={selectedCustomer.customer_number}
                        />
                        <DetailRow
                          label='Apply For Credit'
                          value={
                            selectedCustomer.would_like_to_apply_for_credit
                              ? 'Yes'
                              : 'No'
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <h3 className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                        <MapPin className='h-3 w-3' />
                        Main Address
                      </h3>

                      <AddressBlock
                        street={selectedCustomer.address}
                        city={selectedCustomer.city}
                        state={selectedCustomer.state}
                        zip={selectedCustomer.zip}
                      />
                    </div>

                    <div className='space-y-2'>
                      <h3 className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                        <Receipt className='h-3 w-3' />
                        Bill To
                      </h3>

                      <AddressBlock
                        street={selectedCustomer.bill_to_street}
                        city={selectedCustomer.bill_to_city}
                        state={selectedCustomer.bill_to_state}
                        zip={selectedCustomer.bill_to_zip}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className='space-y-3'>
                    <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                      Associated Documents
                    </h3>

                    {documentSections.jobs.length === 0 &&
                    documentSections.quotes.length === 0 &&
                    documentSections.signOrders.length === 0 ? (
                      <p className='text-xs text-muted-foreground'>
                        No linked jobs, quotes, or sign orders yet.
                      </p>
                    ) : (
                      <div className='space-y-3'>
                        {documentSections.jobs.length > 0 ? (
                          <DocumentSection
                            icon={FolderOpen}
                            label='Jobs'
                            items={documentSections.jobs}
                            onOpen={href => router.push(href)}
                          />
                        ) : null}
                        {documentSections.quotes.length > 0 ? (
                          <DocumentSection
                            icon={FilePlus}
                            label='Quotes / Proposals'
                            items={documentSections.quotes}
                            onOpen={href => router.push(href)}
                          />
                        ) : null}
                        {documentSections.signOrders.length > 0 ? (
                          <DocumentSection
                            icon={FileText}
                            label='Sign Orders'
                            items={documentSections.signOrders}
                            onOpen={href => router.push(href)}
                          />
                        ) : null}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className='grid grid-cols-2 gap-4 text-xs text-muted-foreground'>
                    <div>
                      <span className='font-medium text-foreground'>Created:</span>{' '}
                      {formatDate(selectedCustomer.created)}
                    </div>
                    <div>
                      <span className='font-medium text-foreground'>Updated:</span>{' '}
                      {formatDate(selectedCustomer.updated)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className='col-span-4 flex min-h-0 flex-col rounded-lg border bg-card'>
          <div className='flex items-center justify-between border-b px-4 py-3'>
            <h2 className='text-sm font-bold'>Contacts</h2>
            {selectedCustomer ? (
              <Button
                variant='outline'
                size='sm'
                className='h-7 gap-1 text-xs'
                onClick={() => setContactDialogOpen(true)}
              >
                <Plus className='h-3 w-3' />
                Add Contact
              </Button>
            ) : null}
          </div>

          <div className='flex-1 overflow-y-auto'>
            {!selectedCustomer ? (
              <div className='flex items-center justify-center p-8'>
                <p className='text-sm text-muted-foreground'>
                  Select a customer first
                </p>
              </div>
            ) : contacts.length === 0 ? (
              <div className='p-8 text-center'>
                <User className='mx-auto mb-2 h-8 w-8 text-muted-foreground/20' />
                <p className='text-sm text-muted-foreground'>No contacts yet</p>
              </div>
            ) : (
              <div className='space-y-2 p-3'>
                {contacts.map(contact => (
                  <div
                    key={contact.id}
                    className='group rounded-lg border border-border/60 bg-card p-3'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold'>
                          {contact.name || 'Unnamed Contact'}
                        </p>
                        <div className='mt-1 flex items-center gap-2'>
                          <Badge variant='outline' className='h-5 text-[10px] font-medium'>
                            {contact.role || 'No role'}
                          </Badge>
                        </div>
                      </div>

                      <div className='flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6 text-muted-foreground hover:text-foreground'
                          onClick={() => openEditContactDialog(contact)}
                        >
                          <Edit className='h-3 w-3' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6 text-muted-foreground hover:text-destructive'
                          onClick={() => setDeleteContactConfirm(contact.id)}
                        >
                          <Trash2 className='h-3 w-3' />
                        </Button>
                      </div>
                    </div>

                    <div className='mt-2 space-y-1'>
                      {contact.phone ? (
                        <div className='flex items-center gap-1.5 text-xs'>
                          <Phone className='h-3 w-3 text-muted-foreground' />
                          {contact.phone}
                        </div>
                      ) : null}

                      {contact.email ? (
                        <div className='flex items-center gap-1.5 text-xs'>
                          <Mail className='h-3 w-3 text-muted-foreground' />
                          <a
                            href={`mailto:${contact.email}`}
                            className='text-primary hover:underline'
                          >
                            {contact.email}
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className='max-h-[90vh] max-w-4xl overflow-hidden'>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>

          <div className='max-h-[calc(90vh-9rem)] overflow-y-auto pr-4'>
            <div className='space-y-6 py-2'>
              <div className='space-y-3'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Company Information
                </h3>
                <div className='grid grid-cols-2 gap-3'>
                  <LabeledInput
                    label='Company Legal Name'
                    value={editForm.name}
                    onChange={value =>
                      setEditForm(current => ({ ...current, name: value }))
                    }
                  />
                  <LabeledInput
                    label='Display Name'
                    value={editForm.display_name}
                    onChange={value =>
                      setEditForm(current => ({ ...current, display_name: value }))
                    }
                  />
                  <LabeledInput
                    label='Customer Number'
                    value={editForm.customer_number}
                    onChange={value =>
                      setEditForm(current => ({ ...current, customer_number: value }))
                    }
                  />
                  <LabeledInput
                    label='Website URL'
                    value={editForm.web}
                    onChange={value =>
                      setEditForm(current => ({ ...current, web: value }))
                    }
                  />
                  <LabeledInput
                    label='Main Phone'
                    value={editForm.main_phone}
                    onChange={value =>
                      setEditForm(current => ({ ...current, main_phone: value }))
                    }
                  />
                  <LabeledInput
                    label='Payment Terms'
                    value={editForm.payment_terms}
                    onChange={value =>
                      setEditForm(current => ({
                        ...current,
                        payment_terms: value,
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className='space-y-3'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Main Address
                </h3>
                <div className='space-y-2'>
                  <LabeledInput
                    label='Street Address'
                    value={editForm.address}
                    onChange={value =>
                      setEditForm(current => ({
                        ...current,
                        address: value,
                        bill_to_street: current.billToSameAsMain
                          ? value
                          : current.bill_to_street,
                      }))
                    }
                  />
                  <div className='grid grid-cols-3 gap-2'>
                    <LabeledInput
                      label='City'
                      value={editForm.city}
                      onChange={value =>
                        setEditForm(current => ({
                          ...current,
                          city: value,
                          bill_to_city: current.billToSameAsMain
                            ? value
                            : current.bill_to_city,
                        }))
                      }
                    />
                    <LabeledInput
                      label='State'
                      value={editForm.state}
                      onChange={value =>
                        setEditForm(current => ({
                          ...current,
                          state: value,
                          bill_to_state: current.billToSameAsMain
                            ? value
                            : current.bill_to_state,
                        }))
                      }
                    />
                    <LabeledInput
                      label='ZIP'
                      value={editForm.zip}
                      onChange={value =>
                        setEditForm(current => ({
                          ...current,
                          zip: value,
                          bill_to_zip: current.billToSameAsMain
                            ? value
                            : current.bill_to_zip,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className='space-y-3'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Bill To Address
                </h3>
                <div className='flex items-center gap-2'>
                  <Checkbox
                    id='bill-to-same-as-main'
                    checked={editForm.billToSameAsMain}
                    onCheckedChange={checked => {
                      const nextChecked = checked === true
                      setEditForm(current => ({
                        ...current,
                        billToSameAsMain: nextChecked,
                        bill_to_street: nextChecked
                          ? current.address
                          : current.bill_to_street,
                        bill_to_city: nextChecked ? current.city : current.bill_to_city,
                        bill_to_state: nextChecked
                          ? current.state
                          : current.bill_to_state,
                        bill_to_zip: nextChecked ? current.zip : current.bill_to_zip,
                      }))
                    }}
                  />
                  <label
                    htmlFor='bill-to-same-as-main'
                    className='text-sm text-foreground'
                  >
                    Same as main address
                  </label>
                </div>
                <div className='space-y-2'>
                  <LabeledInput
                    label='Street Address'
                    value={editForm.bill_to_street}
                    disabled={editForm.billToSameAsMain}
                    onChange={value =>
                      setEditForm(current => ({
                        ...current,
                        bill_to_street: value,
                      }))
                    }
                  />
                  <div className='grid grid-cols-3 gap-2'>
                    <LabeledInput
                      label='City'
                      value={editForm.bill_to_city}
                      disabled={editForm.billToSameAsMain}
                      onChange={value =>
                        setEditForm(current => ({ ...current, bill_to_city: value }))
                      }
                    />
                    <LabeledInput
                      label='State'
                      value={editForm.bill_to_state}
                      disabled={editForm.billToSameAsMain}
                      onChange={value =>
                        setEditForm(current => ({
                          ...current,
                          bill_to_state: value,
                        }))
                      }
                    />
                    <LabeledInput
                      label='ZIP'
                      value={editForm.bill_to_zip}
                      disabled={editForm.billToSameAsMain}
                      onChange={value =>
                        setEditForm(current => ({ ...current, bill_to_zip: value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className='space-y-3'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Person Ordering
                </h3>
                <div className='grid grid-cols-2 gap-3'>
                  <LabeledInput
                    label='Name'
                    value={editForm.personOrderingName}
                    onChange={value =>
                      setEditForm(current => ({
                        ...current,
                        personOrderingName: value,
                        primaryContactName: current.primaryContactSameAsPersonOrdering
                          ? value
                          : current.primaryContactName,
                      }))
                    }
                  />
                  <LabeledInput
                    label='Title'
                    value={editForm.personOrderingTitle}
                    onChange={value =>
                      setEditForm(current => ({ ...current, personOrderingTitle: value }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className='space-y-3'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Primary Contact
                </h3>
                <div className='flex items-center gap-2'>
                  <Checkbox
                    id='primary-same-as-ordering'
                    checked={editForm.primaryContactSameAsPersonOrdering}
                    onCheckedChange={checked => {
                      const nextChecked = checked === true
                      setEditForm(current => ({
                        ...current,
                        primaryContactSameAsPersonOrdering: nextChecked,
                        primaryContactName: nextChecked
                          ? current.personOrderingName
                          : current.primaryContactName,
                      }))
                    }}
                  />
                  <label
                    htmlFor='primary-same-as-ordering'
                    className='text-sm text-foreground'
                  >
                    Same as person ordering
                  </label>
                </div>
                <div className='grid grid-cols-3 gap-3'>
                  <LabeledInput
                    label='Name'
                    value={editForm.primaryContactName}
                    disabled={editForm.primaryContactSameAsPersonOrdering}
                    onChange={value =>
                      setEditForm(current => ({ ...current, primaryContactName: value }))
                    }
                  />
                  <LabeledInput
                    label='Phone'
                    value={editForm.primaryContactPhone}
                    onChange={value =>
                      setEditForm(current => ({
                        ...current,
                        primaryContactPhone: value,
                      }))
                    }
                  />
                  <LabeledInput
                    label='Email'
                    value={editForm.primaryContactEmail}
                    onChange={value =>
                      setEditForm(current => ({
                        ...current,
                        primaryContactEmail: value,
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className='space-y-3'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Project Manager
                </h3>
                <div className='grid grid-cols-3 gap-3'>
                  <LabeledInput
                    label='Name'
                    value={editForm.projectManagerName}
                    onChange={value =>
                      setEditForm(current => ({ ...current, projectManagerName: value }))
                    }
                  />
                  <LabeledInput
                    label='Phone'
                    value={editForm.projectManagerPhone}
                    onChange={value =>
                      setEditForm(current => ({
                        ...current,
                        projectManagerPhone: value,
                      }))
                    }
                  />
                  <LabeledInput
                    label='Email'
                    value={editForm.projectManagerEmail}
                    onChange={value =>
                      setEditForm(current => ({
                        ...current,
                        projectManagerEmail: value,
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className='flex items-center gap-2'>
                <Checkbox
                  id='customer-credit-application'
                  checked={editForm.would_like_to_apply_for_credit}
                  onCheckedChange={checked =>
                    setEditForm(current => ({
                      ...current,
                      would_like_to_apply_for_credit: checked === true,
                    }))
                  }
                />
                <label
                  htmlFor='customer-credit-application'
                  className='text-sm text-foreground'
                >
                  Customer would like to apply for credit
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomer} disabled={savingCustomer}>
              <Save className='mr-2 h-4 w-4' />
              {savingCustomer ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
          </DialogHeader>
          <SimpleCustomerCreateForm
            onCancel={() => setNewDialogOpen(false)}
            onCreated={async customer => {
              setNewDialogOpen(false)
              await fetchCustomers()

              if (customer.id) {
                setSelectedId(customer.id)
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>

          <div className='space-y-3 py-2'>
            <div>
              <label className='text-sm font-medium'>Name</label>
              <Input
                className='mt-1'
                value={newContact.name}
                onChange={event =>
                  setNewContact(current => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-sm font-medium'>Phone</label>
                <Input
                  className='mt-1'
                  value={newContact.phone}
                  onChange={event =>
                    setNewContact(current => ({
                      ...current,
                      phone: formatPhoneNumber(event.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Email</label>
                <Input
                  className='mt-1'
                  value={newContact.email}
                  onChange={event =>
                    setNewContact(current => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className='text-sm font-medium'>Role</label>
              <Select
                value={newContact.role}
                onValueChange={value =>
                  setNewContact(current => ({
                    ...current,
                    role: value as ContactRole,
                  }))
                }
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue />
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
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddContact}
              disabled={!newContact.name.trim() || creatingContact}
            >
              {creatingContact ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editContactDialogOpen}
        onOpenChange={open => {
          if (!open) {
            closeEditContactDialog()
          }
        }}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>

          <div className='space-y-3 py-2'>
            <div>
              <label className='text-sm font-medium'>Name</label>
              <Input
                className='mt-1'
                value={editContactForm.name}
                onChange={event =>
                  setEditContactForm(current => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-sm font-medium'>Phone</label>
                <Input
                  className='mt-1'
                  value={editContactForm.phone}
                  onChange={event =>
                    setEditContactForm(current => ({
                      ...current,
                      phone: formatPhoneNumber(event.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Email</label>
                <Input
                  className='mt-1'
                  value={editContactForm.email}
                  onChange={event =>
                    setEditContactForm(current => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className='text-sm font-medium'>Role</label>
              <Select
                value={editContactForm.role}
                onValueChange={value =>
                  setEditContactForm(current => ({
                    ...current,
                    role: value as ContactRole,
                  }))
                }
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue />
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
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={closeEditContactDialog}
              disabled={savingEditedContact}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditedContact}
              disabled={!editContactForm.name.trim() || savingEditedContact}
            >
              {savingEditedContact ? 'Saving...' : 'Save Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteCustomerConfirm}
        onOpenChange={setDeleteCustomerConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the customer and soft-delete all associated
              contacts. This action cannot be undone from the UI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={event => {
                event.preventDefault()
                void handleDeleteCustomer()
              }}
            >
              {deletingCustomer ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteContactConfirm !== null}
        onOpenChange={open => {
          if (!open) {
            setDeleteContactConfirm(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Contact</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the contact from the customer. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={event => {
                event.preventDefault()
                if (deleteContactConfirm !== null) {
                  void handleDeleteContact(deleteContactConfirm)
                }
              }}
            >
              {deletingContact ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function LabeledInput({
  label,
  value,
  disabled = false,
  onChange,
}: {
  label: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className='text-[11px] font-medium text-muted-foreground'>
        {label}
      </label>
      <Input
        className='mt-1 h-8 text-sm'
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className='space-y-1'>
      <p className='text-[11px] font-medium uppercase tracking-wider text-muted-foreground'>
        {label}
      </p>
      <p className='text-sm text-foreground'>
        {value || <span className='text-muted-foreground'>-</span>}
      </p>
    </div>
  )
}

function AddressBlock({
  street,
  city,
  state,
  zip,
}: {
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
}) {
  const hasLocation = city || state || zip

  return (
    <div className='space-y-0.5 text-sm'>
      <p>{street || <span className='text-muted-foreground'>No address</span>}</p>
      {hasLocation ? (
        <p>
          {[city, state].filter(Boolean).join(', ')} {zip || ''}
        </p>
      ) : null}
    </div>
  )
}

function DocumentSection({
  icon: Icon,
  label,
  items,
  onOpen,
}: {
  icon: typeof FolderOpen
  label: string
  items: LinkedDocumentSectionItem[]
  onOpen: (href: string) => void
}) {
  return (
    <div>
      <div className='mb-1.5 flex items-center gap-1.5'>
        <Icon className='h-3.5 w-3.5 text-muted-foreground' />
        <span className='text-xs font-semibold text-muted-foreground'>
          {label}
        </span>
        <Badge variant='secondary' className='ml-auto h-4 px-1.5 text-[10px]'>
          {items.length}
        </Badge>
      </div>

      <div className='space-y-1'>
        {items.map(item => (
          <button
            key={`${label}-${item.id}`}
            type='button'
            className='w-full rounded-md border border-transparent px-2.5 py-1.5 text-left text-xs transition-colors hover:border-border/50 hover:bg-muted/50'
            onClick={() => onOpen(item.href)}
          >
            <span className='font-mono font-semibold text-primary'>
              {item.code}
            </span>
            <span className='ml-2 text-foreground'>{item.name}</span>
            <span className='ml-2 text-muted-foreground'>({item.status})</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default CustomersContent
