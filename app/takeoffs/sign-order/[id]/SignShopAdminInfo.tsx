import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { useFileUpload } from '@/hooks/use-file-upload'
import { formatDate } from '@/lib/formatUTCDate'
import { SignOrder } from '@/types/TSignOrder'
import { Check, ChevronsUpDown } from 'lucide-react'
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { FileMetadata } from '@/types/FileTypes'
import { fetchAssociatedFiles, fetchReferenceData } from '@/lib/api-client'
import { toast } from 'sonner'
import FileViewingContainer from '@/components/file-viewing-container'
import { User } from '@/types/User'
import { Customer } from '@/types/Customer'
import { RequestorSelector } from '@/components/requestor-selector'
import { CustomerSelector } from '@/components/CustomerSelector'
import { ContactSelector } from '@/components/ContactSelector'
import { useCustomers } from '@/hooks/use-customers'
import { cn } from '@/lib/utils'

const BRANCHES = [
  { value: 'All', label: 'All' },
  { value: 'Turbotville', label: 'Turbotville' },
  { value: 'Hatfield', label: 'Hatfield' },
  { value: 'Bedford', label: 'Bedford' }
]

const SHOP_STATUSES = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-process', label: 'In-Process' },
  { value: 'on-order', label: 'On Order' },
  { value: 'complete', label: 'Complete' }
]

const SHOP_ASSIGNEES = [
  'Tom Daywalt',
  'Richie Sweigert',
  'David Grooms'
]

const ORDER_TYPE_OPTIONS = [
  { value: 'sale', label: 'Sale' },
  { value: 'rental', label: 'Rental' },
  { value: 'permanent signs', label: 'Permanent' }
] as const

type OrderTypeValue = (typeof ORDER_TYPE_OPTIONS)[number]['value']

interface ContactOption {
  id: number
  name: string
  role: string
  email: string
  phone: string
}

interface DraftState {
  requestor: User | null
  selectedBranch: string
  contractNumber: string
  customer: Customer | null
  contact: ContactOption | null
  orderDate: string
  needDate: string
  startDate: string
  endDate: string
  orderTypes: OrderTypeValue[]
  assignedTo: string
  shopStatus: string
  targetDate: string
}

interface Props {
  signOrder: SignOrder
  setSignOrder: Dispatch<SetStateAction<SignOrder | undefined>>
  id: number
  files: FileMetadata[]
  setFiles: Dispatch<SetStateAction<FileMetadata[]>>
}

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
    customerNumber: customer.customerNumber || customer.customer_number || 0,
    mainPhone: customer.mainPhone || customer.main_phone || '',
    paymentTerms: customer.paymentTerms || customer.payment_terms || '',
    lastOrdered: customer.lastOrdered || null
  }
}

function getOrderTypesFromSignOrder(signOrder: SignOrder): OrderTypeValue[] {
  return [
    signOrder.sale ? 'sale' : null,
    signOrder.rental ? 'rental' : null,
    signOrder.perm_signs ? 'permanent signs' : null
  ].filter(Boolean) as OrderTypeValue[]
}

function formatDateInput(value?: string | null) {
  if (!value) return ''
  return value.includes('T') ? value.split('T')[0] : value
}

function getStatusLabel(status?: string | null) {
  return (
    SHOP_STATUSES.find(option => option.value === status)?.label ||
    status ||
    '-'
  )
}

function getReadOnlyValue(value?: string | null) {
  return value && value.trim() ? value : '-'
}

const SignShopAdminInfo = ({
  signOrder,
  setSignOrder,
  id,
  files,
  setFiles
}: Props) => {
  const [editing, setEditing] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [orderTypePopoverOpen, setOrderTypePopoverOpen] = useState(false)
  const { customers, getCustomers } = useCustomers()
  const [draft, setDraft] = useState<DraftState>({
    requestor: null,
    selectedBranch: '',
    contractNumber: '',
    customer: null,
    contact: null,
    orderDate: '',
    needDate: '',
    startDate: '',
    endDate: '',
    orderTypes: [],
    assignedTo: '',
    shopStatus: 'not-started',
    targetDate: ''
  })

  const fileUploadProps = useFileUpload({
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 10,
    uniqueIdentifier: id ?? '',
    apiEndpoint: '/api/files/sign-orders',
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx'
      ],
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

  const { successes, isSuccess, errors: fileErrors } = fileUploadProps

  const buildDraftFromSignOrder = (
    order: SignOrder,
    users: User[] = allUsers
  ): DraftState => {
    const matchedRequestor =
      users.find(user => user.name === order.requestor) || null

    return {
      requestor: matchedRequestor,
      selectedBranch:
        matchedRequestor?.branches?.name || order.branch || '',
      contractNumber: order.contract_number || '',
      customer: order.contractor_id
        ? normalizeCustomer({
            id: order.contractor_id,
            name: order.contractors?.name || '',
            display_name: order.contractors?.name || '',
            customer_contacts: order.contact
              ? [
                  {
                    id: order.contact.id,
                    name: order.contact.name,
                    email: order.contact.email,
                    phone: order.contact.phone,
                    role: order.contact.role
                  }
                ]
              : []
          })
        : null,
      contact: order.contact || null,
      orderDate: formatDateInput(order.order_date),
      needDate: formatDateInput(order.need_date),
      startDate: formatDateInput(order.start_date),
      endDate: formatDateInput(order.end_date),
      orderTypes: getOrderTypesFromSignOrder(order),
      assignedTo: order.assigned_to || '',
      shopStatus: order.shop_status || 'not-started',
      targetDate: formatDateInput(order.target_date)
    }
  }

  const contactSummary = useMemo(() => {
    if (!draft.customer || !Array.isArray(draft.customer.contactIds)) {
      return []
    }

    return draft.customer.contactIds.map((contactId, index) => ({
      id: contactId,
      name: draft.customer?.names?.[index] || '',
      email: draft.customer?.emails?.[index] || '',
      phone: draft.customer?.phones?.[index] || '',
      role: draft.customer?.roles?.[index] || ''
    }))
  }, [draft.customer])

  useEffect(() => {
    if (!fileErrors || fileErrors.length === 0) return
    if (fileErrors.some(err => err.name === 'identifier')) {
      toast.error(
        'Sign order needs to be saved as draft in order to being associating files. Please add admin data, then click upload files again.'
      )
    }
  }, [fileErrors])

  const fetchFiles = () => {
    if (!id) return
    fetchAssociatedFiles(id, 'sign-orders?sign_order_id', setFiles)
  }

  useEffect(() => {
    fetchFiles()
  }, [id])

  useEffect(() => {
    if (isSuccess && files.length > 0) {
      fetchFiles()
    }
  }, [isSuccess, files, successes, setFiles])

  useEffect(() => {
    let cancelled = false

    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const users = await fetchReferenceData('users')
        if (!cancelled) {
          setAllUsers(users)
          setDraft(current =>
            current.requestor
              ? current
              : {
                  ...current,
                  ...buildDraftFromSignOrder(signOrder, users)
                }
          )
        }
      } catch (error) {
        console.error('Failed to load sign order users:', error)
      } finally {
        if (!cancelled) {
          setIsLoadingUsers(false)
        }
      }
    }

    void loadUsers()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!editing) {
      setDraft(buildDraftFromSignOrder(signOrder))
    }
  }, [editing, signOrder])

  useEffect(() => {
    if (
      draft.customer &&
      draft.contact &&
      !draft.customer.contactIds.includes(draft.contact.id)
    ) {
      setDraft(current => ({
        ...current,
        contact: null
      }))
    }
  }, [draft.contact, draft.customer])

  const fetchCustomerById = async (customerId: number) => {
    const response = await fetch(`/api/contractors/${customerId}`)
    if (!response.ok) {
      return null
    }

    const result = await response.json().catch(() => null)
    if (!result?.customer) {
      return null
    }

    return normalizeCustomer(result.customer)
  }

  const beginEditing = () => {
    setDraft(buildDraftFromSignOrder(signOrder))
    setEditing(true)
  }

  const cancelEditing = () => {
    setDraft(buildDraftFromSignOrder(signOrder))
    setEditing(false)
    setOrderTypePopoverOpen(false)
  }

  const applyCustomerSelection = (customer: Customer | null) => {
    setDraft(current => ({
      ...current,
      customer,
      contact: null
    }))
  }

  const toggleOrderType = (value: OrderTypeValue) => {
    setDraft(current => ({
      ...current,
      orderTypes: current.orderTypes.includes(value)
        ? current.orderTypes.filter(type => type !== value)
        : [...current.orderTypes, value]
    }))
  }

  const saveInlineEdits = () => {
    if (!draft.requestor) {
      toast.error('Requestor is required')
      return
    }
    if (!draft.customer) {
      toast.error('Customer is required')
      return
    }
    if (!draft.contractNumber.trim()) {
      toast.error('Contract number is required')
      return
    }
    if (!draft.needDate) {
      toast.error('Need date is required')
      return
    }
    if (draft.orderTypes.length === 0) {
      toast.error('Select at least one order type')
      return
    }

    const selectedCustomer = draft.customer

    setSignOrder(previous =>
      previous
        ? {
            ...previous,
            requestor: draft.requestor?.name || '',
            branch: draft.selectedBranch,
            contract_number: draft.contractNumber.trim().toUpperCase(),
            contractor_id: selectedCustomer.id,
            contractors: {
              name: selectedCustomer.displayName || selectedCustomer.name
            },
            contact_id: draft.contact?.id ?? null,
            contact: draft.contact,
            order_date: draft.orderDate,
            need_date: draft.needDate,
            start_date: draft.orderTypes.includes('rental')
              ? draft.startDate || ''
              : '',
            end_date: draft.orderTypes.includes('rental')
              ? draft.endDate || ''
              : '',
            sale: draft.orderTypes.includes('sale'),
            rental: draft.orderTypes.includes('rental'),
            perm_signs: draft.orderTypes.includes('permanent signs'),
            assigned_to: draft.assignedTo || undefined,
            shop_status: draft.shopStatus,
            target_date: draft.targetDate || undefined
          }
        : previous
    )

    setEditing(false)
    setCustomerPopoverOpen(false)
    setContactPopoverOpen(false)
    setOrderTypePopoverOpen(false)
    toast.success('Admin info updated')
  }

  const orderTypeLabel =
    draft.orderTypes.length > 0
      ? ORDER_TYPE_OPTIONS.filter(option =>
          draft.orderTypes.includes(option.value)
        )
          .map(option => option.label)
          .join(', ')
      : 'Select order type'

  return (
    <>
      <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
          <div className='lg:col-span-2 bg-white p-8 rounded-md shadow-sm border border-gray-100'>
            <div className='flex items-start justify-between gap-4 mb-4'>
              <h2 className='text-xl font-semibold'>Customer Information</h2>
              {editing ? (
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button onClick={saveInlineEdits}>Apply Changes</Button>
                </div>
              ) : (
                <Button variant='outline' onClick={beginEditing}>
                  Edit
                </Button>
              )}
            </div>

            {!editing ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <div className='text-sm text-muted-foreground'>Job Number</div>
                  <div className='text-base mt-1'>{getReadOnlyValue(signOrder.job_number)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Contract Number</div>
                  <div className='text-base mt-1'>{getReadOnlyValue(signOrder.contract_number)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Requestor</div>
                  <div className='text-base mt-1'>{getReadOnlyValue(signOrder.requestor)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Branch</div>
                  <div className='text-base mt-1'>{getReadOnlyValue(signOrder.branch)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Customer</div>
                  <div className='text-base mt-1'>{getReadOnlyValue(signOrder.contractors?.name)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Contact</div>
                  <div className='text-base mt-1'>{getReadOnlyValue(signOrder.contact?.name)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Contact Phone</div>
                  <div className='text-base mt-1'>{getReadOnlyValue(signOrder.contact?.phone)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Contact Email</div>
                  <div className='text-base mt-1'>{getReadOnlyValue(signOrder.contact?.email)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Need Date</div>
                  <div className='text-base mt-1'>
                    {signOrder.need_date ? formatDate(signOrder.need_date) : '-'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Order Date</div>
                  <div className='text-base mt-1'>
                    {signOrder.order_date ? formatDate(signOrder.order_date) : '-'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Order Type</div>
                  <div className='text-base mt-1'>
                    {[signOrder.sale && 'Sale', signOrder.rental && 'Rental', signOrder.perm_signs && 'Permanent']
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Assigned To</div>
                  <div className='text-base mt-1'>{getReadOnlyValue(signOrder.assigned_to)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Shop Status</div>
                  <div className='text-base mt-1'>{getStatusLabel(signOrder.shop_status)}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Target Date</div>
                  <div className='text-base mt-1'>
                    {signOrder.target_date ? formatDate(signOrder.target_date) : '-'}
                  </div>
                </div>
              </div>
            ) : (
              <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Job Number</Label>
                    <Input value={signOrder.job_number || ''} readOnly className='bg-muted' />
                  </div>
                  <div className='space-y-2'>
                    <Label>
                      Contract Number <span className='text-red-600'>*</span>
                    </Label>
                    <Input
                      value={draft.contractNumber}
                      onChange={event =>
                        setDraft(current => ({
                          ...current,
                          contractNumber: event.target.value.toUpperCase()
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>
                      Requestor <span className='text-red-600'>*</span>
                    </Label>
                    <RequestorSelector
                      source='sign-shop-inline-requestor'
                      users={allUsers}
                      selectedUser={draft.requestor}
                      onSelect={user =>
                        setDraft(current => ({
                          ...current,
                          requestor: user,
                          selectedBranch: user.branches?.name || current.selectedBranch
                        }))
                      }
                      disabled={isLoadingUsers}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Branch</Label>
                    <Select
                      value={draft.selectedBranch}
                      onValueChange={value =>
                        setDraft(current => ({
                          ...current,
                          selectedBranch: value
                        }))
                      }
                      disabled={!!draft.requestor?.branches?.name}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select branch' />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCHES.map(branch => (
                          <SelectItem key={branch.value} value={branch.value}>
                            {branch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {draft.requestor?.branches?.name && (
                      <p className='text-xs text-muted-foreground'>
                        Branch follows the selected requestor.
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label>
                      Customer <span className='text-red-600'>*</span>
                    </Label>
                    <CustomerSelector
                      customers={customers}
                      selectedCustomer={draft.customer}
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
                        applyCustomerSelection(hydratedCustomer)
                      }}
                      createDescription='Create a customer with a company name, then it will be available in this sign order.'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Contact</Label>
                    <ContactSelector
                      customer={draft.customer}
                      selectedContact={draft.contact}
                      onSelectContact={async contact => {
                        setDraft(current => ({
                          ...current,
                          contact
                        }))
                      }}
                      onCustomerChange={async customer => {
                        setDraft(current => ({
                          ...current,
                          customer
                        }))
                      }}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Contact Phone</Label>
                    <Input value={draft.contact?.phone || ''} readOnly className='bg-muted' />
                  </div>
                  <div className='space-y-2'>
                    <Label>Contact Email</Label>
                    <Input value={draft.contact?.email || ''} readOnly className='bg-muted' />
                  </div>
                  <div className='space-y-2'>
                    <Label>Order Date</Label>
                    <Input
                      type='date'
                      value={draft.orderDate}
                      onChange={event =>
                        setDraft(current => ({
                          ...current,
                          orderDate: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>
                      Need Date <span className='text-red-600'>*</span>
                    </Label>
                    <Input
                      type='date'
                      value={draft.needDate}
                      onChange={event =>
                        setDraft(current => ({
                          ...current,
                          needDate: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>
                      Order Type <span className='text-red-600'>*</span>
                    </Label>
                    <Popover open={orderTypePopoverOpen} onOpenChange={setOrderTypePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant='outline' className='w-full justify-between font-normal'>
                          <span className='truncate'>{orderTypeLabel}</span>
                          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align='start'
                        className='w-[var(--radix-popover-trigger-width)] p-0'
                      >
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {ORDER_TYPE_OPTIONS.map(option => (
                                <CommandItem
                                  key={option.value}
                                  value={option.label}
                                  onSelect={() => toggleOrderType(option.value)}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      draft.orderTypes.includes(option.value)
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  {option.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className='space-y-2'>
                    <Label>Assigned To</Label>
                    <Select
                      value={draft.assignedTo || '__unassigned__'}
                      onValueChange={value =>
                        setDraft(current => ({
                          ...current,
                          assignedTo: value === '__unassigned__' ? '' : value
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select assignee' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='__unassigned__'>Unassigned</SelectItem>
                        {SHOP_ASSIGNEES.map(assignee => (
                          <SelectItem key={assignee} value={assignee}>
                            {assignee}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Shop Status</Label>
                    <Select
                      value={draft.shopStatus}
                      onValueChange={value =>
                        setDraft(current => ({
                          ...current,
                          shopStatus: value
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select shop status' />
                      </SelectTrigger>
                      <SelectContent>
                        {SHOP_STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Target Date</Label>
                    <Input
                      type='date'
                      value={draft.targetDate}
                      onChange={event =>
                        setDraft(current => ({
                          ...current,
                          targetDate: event.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                {draft.orderTypes.includes('rental') && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Start Date</Label>
                      <Input
                        type='date'
                        value={draft.startDate}
                        onChange={event =>
                          setDraft(current => ({
                            ...current,
                            startDate: event.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>End Date</Label>
                      <Input
                        type='date'
                        value={draft.endDate}
                        onChange={event =>
                          setDraft(current => ({
                            ...current,
                            endDate: event.target.value
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className='flex flex-col gap-y-4'>
            <Dropzone className='grow' {...fileUploadProps}>
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
            <FileViewingContainer files={files} onFilesChange={fetchFiles} />
          </div>
        </div>
      </div>
    </>
  )
}

export default SignShopAdminInfo
