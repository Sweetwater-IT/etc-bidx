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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CustomerModal } from '@/components/CustomerModal'
import { CustomerContactModal } from '@/components/CustomerContactModal'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

interface LinkedDocumentSectionItem {
  id: number
  code: string
  name: string
  status: string
  href: string
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

  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<CustomerContactRecord | null>(null)
  const [editContactDialogOpen, setEditContactDialogOpen] = useState(false)
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

      if (editing) {
        setEditing(false)
      }

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
  }, [editing])

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
    setEditing(true)
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

  const openEditContactDialog = (contact: CustomerContactRecord) => {
    setEditingContact(contact)
    setEditContactDialogOpen(true)
  }

  const closeEditContactDialog = () => {
    setEditContactDialogOpen(false)
    setEditingContact(null)
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
    <div className='flex h-full min-h-0 flex-col overflow-hidden bg-[#F9FAFB]'>
      <header className='shrink-0 border-b bg-card'>
        <div className='mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6'>
          <div className='flex items-center gap-2.5'>
            <div className='rounded bg-primary p-1.5'>
            <Building2 className='h-5 w-5 text-primary-foreground' />
          </div>
          <div>
            <h1 className='text-lg font-bold leading-none tracking-tight'>Customers</h1>
            <p className='mt-0.5 text-xs text-muted-foreground'>
              {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Button onClick={() => setNewDialogOpen(true)} className='gap-2'>
          <Plus className='h-4 w-4' />
          New Customer
        </Button>
        </div>
      </header>

      <div className='@container/main flex flex-1 min-h-0 flex-col overflow-auto'>
        <div className='mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-12 gap-4 px-6 py-6'>
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
      </div>

      <CustomerModal
        open={editing}
        onOpenChange={setEditing}
        mode='edit'
        customerId={selectedId ?? undefined}
        initialData={selectedCustomer}
        onSuccess={async () => {
          if (!selectedId) {
            return
          }

          toast.success('Customer updated')
          await Promise.all([fetchCustomers(), fetchCustomerDetails(selectedId)])
        }}
      />

      <CustomerModal
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        mode='create'
        createVariant='simple'
        title='New Customer'
        onSuccess={async customer => {
          toast.success('Customer created')
          await fetchCustomers()

          if (customer?.id) {
            setSelectedId(customer.id)
          }
        }}
      />

      {selectedCustomer ? (
        <CustomerContactModal
          customerId={selectedCustomer.id}
          isOpen={contactDialogOpen}
          onClose={() => setContactDialogOpen(false)}
          onSuccess={async () => {
            if (!selectedId) {
              return
            }

            toast.success('Contact added')
            await fetchCustomerDetails(selectedId)
          }}
          customer={{
            name: selectedCustomer.name || '',
            displayName:
              selectedCustomer.display_name || selectedCustomer.name || '',
            address: selectedCustomer.address || '',
            city: selectedCustomer.city || '',
            state: selectedCustomer.state || '',
            zip: selectedCustomer.zip || '',
            paymentTerms: selectedCustomer.payment_terms || '',
            url: selectedCustomer.web || '',
          }}
        />
      ) : null}

      {selectedCustomer && editingContact ? (
        <CustomerContactModal
          customerId={selectedCustomer.id}
          isOpen={editContactDialogOpen}
          onClose={closeEditContactDialog}
          onSuccess={async () => {
            if (!selectedId) {
              return
            }

            toast.success('Contact updated')
            closeEditContactDialog()
            await fetchCustomerDetails(selectedId)
          }}
          contactToEdit={{
            id: editingContact.id,
            name: editingContact.name || '',
            role: editingContact.role || '',
            email: editingContact.email || '',
            phone: editingContact.phone || '',
          }}
          customer={{
            name: selectedCustomer.name || '',
            displayName:
              selectedCustomer.display_name || selectedCustomer.name || '',
            address: selectedCustomer.address || '',
            city: selectedCustomer.city || '',
            state: selectedCustomer.state || '',
            zip: selectedCustomer.zip || '',
            paymentTerms: selectedCustomer.payment_terms || '',
            url: selectedCustomer.web || '',
          }}
        />
      ) : null}

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
