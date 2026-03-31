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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { AlertCircle, Check, ChevronsUpDown } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { IconBulb } from '@tabler/icons-react'
import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'
import { User } from '@/types/User'
import { Customer } from '@/types/Customer'
import { SignOrderAdminInformation, OrderTypes } from './SignOrderContentSimple'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { useCustomers } from '@/hooks/use-customers'
import { CustomerProvider } from '@/contexts/customer-context'
import { CustomerContactForm } from '@/components/customer-contact-form'
import { CustomerSelectionModal } from '@/components/CustomerSelectionModal'
import { RequestorSelector } from '@/components/requestor-selector'
import { restorePointerEvents } from '@/lib/pointer-events-fix'
import { logSignOrderDebug } from '@/lib/log-sign-order-debug'
import { SimpleCustomerCreateDialog } from '@/components/simple-customer-create-dialog'

const BRANCHES = [
  { value: 'All', label: 'All' },
  { value: 'Turbotville', label: 'Turbotville' },
  { value: 'Hatfield', label: 'Hatfield' },
  { value: 'Bedford', label: 'Bedford' }
]

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

  // Customer modal state
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [simpleCustomerDialogOpen, setSimpleCustomerDialogOpen] = useState(false)
  const { getCustomers } = useCustomers()

  // Add state for selected contact
  const [localContact, setLocalContact] = useState<any | null>(null)

  // Add state for contact popover open/close
  const [openCustomerContact, setOpenCustomerContact] = useState(false)

  // Add state for contact creation dialog
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
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
    setOpenCustomerContact(false)
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
  }, [localCustomer])

  // Update local state when adminInfo changes or when sheet opens
  useEffect(() => {
    if (open) {
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
      !!localNeedDate &&
      localOrderType.length > 0
    )
  }

  const isCreateMode = mode === 'create'

  // Add this helper function inside the component
  async function fetchCustomerById(id: number) {
    const res = await fetch(`/api/contractors/${id}`)
    if (res.ok) {
      const data = await res.json()
      if (data?.customer) {
        return normalizeCustomer(data.customer)
      }
    }
    return null
  }

  useEffect(() => {
    if (open) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      restoreOverlayInteraction('details_sheet_pointer_events_restored')
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [open, restoreOverlayInteraction])

  useEffect(() => {
    if (
      open ||
      customerModalOpen ||
      contactDialogOpen ||
      openCustomerContact
    ) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      restoreOverlayInteraction('customer_overlay_chain_cleared', {
        customerId: localCustomer?.id ?? null,
        contactId: localContact?.id ?? null
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [
    contactDialogOpen,
    customerModalOpen,
    localContact?.id,
    localCustomer?.id,
    open,
    openCustomerContact,
    restoreOverlayInteraction
  ])

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          className='w-[500px] sm:max-w-[600px] p-0'
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
              <SheetTitle>
                {isCreateMode
                  ? 'Create New Sign Order'
                  : 'Edit Sign Order Details'}
              </SheetTitle>
            </SheetHeader>
            <Separator className='w-full -mt-2' />
          </div>

          <div className='mt-4 space-y-6 px-6 h-full overflow-y-auto'>
            {/* Job Information Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Job Information</h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* <div className="space-y-2">
                  <Label>Job Number</Label>
                  <Input
                    type="text"
                    value={localJobNumber}
                    onChange={(e) => setLocalJobNumber(e.target.value)}
                    placeholder="Job number"
                    disabled={mode === 'create'}
                  />
                </div> */}

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

            {/* Order Details Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Order Details</h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Requestor */}
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

                {/* Branch */}
                {/* <div className="space-y-2">
                  <Label>Branch {isCreateMode && <span className="text-red-500">*</span>}</Label>
                  <Select 
                    value={localSelectedBranch} 
                    onValueChange={setLocalSelectedBranch}
                    disabled={!isCreateMode && !!localRequestor?.branches}
                  >
                    <SelectTrigger className={!isCreateMode && localRequestor?.branches ? "bg-muted" : ""}>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCHES.map(branch => (
                        <SelectItem key={branch.value} value={branch.value}>
                          {branch.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}

                {/* Customer */}
                <div className='space-y-2'>
                  <Label>
                    Customer <span className='text-red-600'>*</span>
                  </Label>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setCustomerModalOpen(true)
                      restoreOverlayInteraction('customer_modal_opened', {
                        customerId: localCustomer?.id ?? null
                      })
                    }}
                    className='w-full justify-start text-left font-normal'
                  >
                    <span className='truncate'>
                      {localCustomer
                        ? localCustomer.displayName
                        : 'Select customer...'}
                    </span>
                  </Button>
                  <div className='flex justify-start'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-7 px-0 text-xs text-muted-foreground hover:text-foreground'
                      onClick={() => {
                        setSimpleCustomerDialogOpen(true)
                        restoreOverlayInteraction('customer_simple_add_opened', {
                          customerId: localCustomer?.id ?? null
                        })
                      }}
                    >
                      Add New Customer
                    </Button>
                  </div>
                </div>
                {/* Contact dropdown, always shown, next to customer dropdown */}
                <div className='space-y-2'>
                  <Label>
                    Contact <span className='text-red-600'>*</span>
                  </Label>
                  <Popover
                    open={openCustomerContact}
                    onOpenChange={nextOpen => {
                      setOpenCustomerContact(nextOpen)
                      restoreOverlayInteraction('contact_popover_changed', {
                        open: nextOpen,
                        customerId: localCustomer?.id ?? null
                      })
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        aria-expanded={openCustomerContact}
                        className='w-full justify-between'
                        disabled={!localCustomer}
                      >
                        <span className='truncate'>
                          {localContact
                            ? localContact.name
                            : 'Select contact...'}
                        </span>
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className='w-[var(--radix-popover-trigger-width)] p-0'
                      onOpenAutoFocus={event => {
                        event.preventDefault()
                        restorePointerEvents()
                      }}
                    >
                      <Command>
                        <CommandInput placeholder='Search contact...' />
                        <CommandList>
                          <CommandEmpty>No contact found.</CommandEmpty>
                          <CommandGroup className='max-h-[200px] overflow-y-auto'>
                            {/* Add new contact button always visible */}
                            <CommandItem
                              onSelect={() => {
                                setOpenCustomerContact(false)
                                restoreOverlayInteraction(
                                  'contact_add_new_selected',
                                  {
                                    customerId: localCustomer?.id ?? null
                                  }
                                )
                                if (!localCustomer) {
                                  toast.error(
                                    'Please select a customer before adding a contact.'
                                  )
                                  return
                                }
                                setContactDialogOpen(true)
                              }}
                              value='__add_new_contact__'
                              className='font-medium text-primary cursor-pointer'
                            >
                              + Add new contact
                            </CommandItem>
                            {/* List contacts if a customer is selected */}
                            {localCustomer &&
                              Array.isArray(localCustomer.contactIds) &&
                              localCustomer.contactIds.length > 0 &&
                              localCustomer.contactIds.map(
                                (id: number, idx: number) => (
                                  <CommandItem
                                    key={id}
                                    value={`${localCustomer.names[idx] || ''} ${localCustomer.emails[idx] || ''}`.trim()}
                                    onSelect={() => {
                                      setLocalContact({
                                        id,
                                        name: localCustomer.names[idx],
                                        email: localCustomer.emails[idx],
                                        phone: localCustomer.phones[idx],
                                        role: localCustomer.roles[idx]
                                      })
                                      setOpenCustomerContact(false)
                                      restoreOverlayInteraction(
                                        'contact_selected',
                                        {
                                          customerId: localCustomer?.id ?? null,
                                          contactId: id
                                        }
                                      )
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        localContact?.id === id
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      )}
                                    />
                                    {localCustomer.names[idx]}{' '}
                                    {localCustomer.emails[idx] && (
                                      <span className='text-xs text-muted-foreground ml-2'>
                                        {localCustomer.emails[idx]}
                                      </span>
                                    )}
                                  </CommandItem>
                                )
                              )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Order Date */}
                <div className='space-y-2 mt-auto'>
                  <Label>Order Date</Label>
                  <Input
                    type='date'
                    placeholder='Select a date'
                    value={localOrderDate.toISOString().split('T')[0]}
                    onChange={e => setLocalOrderDate(new Date(e.target.value))}
                  />
                </div>

                {/* Need Date */}
                <div className='space-y-2'>
                  {/* <Tooltip>
                    <TooltipTrigger>
                      <div className="flex gap-x-2"> */}
                  <Label>
                    Need Date <span className='text-red-600'>*</span>
                  </Label>
                  {/* <IconBulb className="h-5" color="gray" />
                      </div> */}
                  {/* </TooltipTrigger>
                  <TooltipContent>
                    <div>Sale = date requested by customer</div>
                    <div>Rental = 1 week before job start</div>
                  </TooltipContent>
                </Tooltip> */}
                  <Input
                    type='date'
                    value={
                      localNeedDate
                        ? localNeedDate.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={e => setLocalNeedDate(new Date(e.target.value))}
                    placeholder='Select a date'
                  />
                </div>
              </div>

              {/* Order Type */}
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

              {/* Rental Dates - Only show if rental is selected */}
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
                      onChange={e => setLocalEndDate(new Date(e.target.value))}
                    />
                  </div>
                </div>
              )}
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
        </SheetContent>
      </Sheet>
      <SimpleCustomerCreateDialog
        open={simpleCustomerDialogOpen}
        onOpenChange={nextOpen => {
          setSimpleCustomerDialogOpen(nextOpen)
          if (!nextOpen) {
            restoreOverlayInteraction('customer_simple_add_closed', {
              customerId: localCustomer?.id ?? null
            })
          }
        }}
        description='Create a customer with a company name, then it will be available in this sign order.'
        onCreated={async createdCustomer => {
          await getCustomers()
          const hydratedCustomer = await fetchCustomerById(createdCustomer.id)
          const nextCustomer =
            hydratedCustomer ||
            normalizeCustomer(createdCustomer)

          applyCustomerSelection(nextCustomer)
          restoreOverlayInteraction('customer_simple_add_created', {
            customerId: nextCustomer.id
          })
        }}
      />
      {/* Contact creation dialog: only render if localCustomer is defined */}
      {localCustomer && (
        <CustomerProvider initialCustomer={localCustomer}>
          <CustomerContactForm
            customerId={localCustomer.id}
            isOpen={contactDialogOpen}
            onClose={() => {
              setContactDialogOpen(false)
              restoreOverlayInteraction('contact_dialog_closed', {
                customerId: localCustomer.id
              })
            }}
            onSuccess={async (newContactId?: number, newContactData?: any) => {
              setContactDialogOpen(false)
              restoreOverlayInteraction('contact_dialog_success', {
                customerId: localCustomer?.id ?? null,
                contactId: newContactId ?? null
              })
              if (localCustomer?.id && typeof newContactId === 'number' && newContactData) {
                // Locally update the customer data with the new contact
                const updatedCustomer: Customer = {
                  ...localCustomer,
                  contactIds: [...(localCustomer.contactIds || []), newContactId],
                  names: [...(localCustomer.names || []), newContactData.name || ''],
                  emails: [...(localCustomer.emails || []), newContactData.email || ''],
                  phones: [...(localCustomer.phones || []), newContactData.phone || ''],
                  roles: [...(localCustomer.roles || []), newContactData.role || '']
                }

                // Update the customer state with the locally modified data
                setLocalCustomer(updatedCustomer)

                // Auto-select the newly created contact
                const newContact = {
                  id: newContactId,
                  name: newContactData.name || '',
                  email: newContactData.email || '',
                  phone: newContactData.phone || '',
                  role: newContactData.role || ''
                }
                setLocalContact(newContact)
              }
            }}
            customer={localCustomer}
          />
        </CustomerProvider>
      )}
      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        open={customerModalOpen}
        onOpenChange={nextOpen => {
          setCustomerModalOpen(nextOpen)
          if (!nextOpen) {
            restoreOverlayInteraction('customer_modal_closed', {
              customerId: localCustomer?.id ?? null
            })
          }
        }}
        customers={customers}
        selectedCustomer={localCustomer}
        onSelectCustomer={async customer => {
          if (!customer) {
            applyCustomerSelection(null)
            restoreOverlayInteraction('customer_cleared')
            return
          }

          const hydratedCustomer = await fetchCustomerById(customer.id)
          const nextCustomer = hydratedCustomer || normalizeCustomer(customer)
          applyCustomerSelection(nextCustomer)
          restoreOverlayInteraction('customer_selected', {
            customerId: nextCustomer.id
          })
        }}
      />
    </>
  )
}
