'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, ChevronsUpDown } from 'lucide-react'
import { AutoComplete } from '@/components/ui/autocomplete'
import {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxInput,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  ComboboxValue,
} from '@/components/ui/combobox'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Field,
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldError
} from '@/components/ui/field'
import { FormSection, FormGrid } from '@/components/ui/form-section'
import { useState, useEffect, useRef } from 'react'
import { User } from '@/types/User'
import { Customer } from '@/types/Customer'
import { SignOrderAdminInformation, OrderTypes } from './SignOrderContentSimple'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { CustomerDrawer } from '@/components/customer-drawer'
import { useCustomers } from '@/hooks/use-customers'
import { CustomerProvider } from '@/contexts/customer-context'
import { CustomerContactForm } from '@/components/customer-contact-form'

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
  setAdminInfo: (
    updater: (prev: SignOrderAdminInformation) => SignOrderAdminInformation
  ) => void
  allUsers: User[]
  customers: Customer[]
  mode: 'edit' | 'create'
  onJobCreated?: (job: Job) => void // Add this callback
}

export function SignOrderDetailsSheet({
  open,
  onOpenChange,
  adminInfo,
  setAdminInfo,
  allUsers,
  customers,
  mode,
  onJobCreated
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

  // Popover states
  const [openRequestor, setOpenRequestor] = useState(false)
  const [openCustomer, setOpenCustomer] = useState(false)

  // Add state for CustomerDrawer
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false)
  const [pendingCustomerSelection, setPendingCustomerSelection] = useState<ComboboxItem | null>(null)
  const [newCustomerId, setNewCustomerId] = useState<number | null>(null)
  const { getCustomers } = useCustomers()

  // Add a ref to store the last created customer id
  const lastCreatedCustomerId = useRef<number | null>(null)

  // Add state for selected contact
  const [localContact, setLocalContact] = useState<any | null>(null)

  // Add state for contact popover open/close
  const [openCustomerContact, setOpenCustomerContact] = useState(false)

  // Add state for contact creation drawer
  const [contactDrawerOpen, setContactDrawerOpen] = useState(false)
  const lastCreatedContactId = useRef<number | null>(null)

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
        setLocalContact(null) // Reset contact for new orders
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
        setLocalContact(adminInfo.contact) // Initialize contact from adminInfo
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

  // Effect: when newCustomerId is set, auto-select that customer
  useEffect(() => {
    if (newCustomerId && customers.length > 0) {
      const created = customers.find(c => c.id === newCustomerId)
      if (created) {
        setLocalCustomer(created)
        setNewCustomerId(null)
      }
    }
  }, [newCustomerId, customers])

  // Remove the generateJobNumber function since we don't need it

  const handleSave = async () => {
    if (mode === 'create') {
      // For new sign orders, validate required fields
      if (!localCustomer) {
        toast.error('Customer is required')
        return
      }
      if (!localSelectedBranch) {
        toast.error('Branch is required')
        return
      }
    }

    // Update admin info regardless of mode
    setAdminInfo(prev => ({
      ...prev,
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
    }))

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

    onOpenChange(false)
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
      !!localContact && // Contact is required when customer is selected
      !!localNeedDate &&
      localOrderType.length > 0
    )
  }

  const isCreateMode = mode === 'create'

  // Add this helper function inside the component
  async function fetchCustomerById(id: number) {
    const res = await fetch(`/api/customers/${id}`)
    if (res.ok) {
      return await res.json()
    }
    return null
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className='w-[500px] sm:max-w-[600px] p-0'>
          <div className='flex flex-col gap-2 bg-background'>
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
            <FormSection title="Job Information">
              <FormGrid columns={2}>
                <Field name="contractNumber" required>
                  <FieldLabel>Contract Number</FieldLabel>
                  <FieldControl>
                    <Input
                      value={localContractNumber}
                      onChange={e =>
                        setLocalContractNumber(e.target.value.toUpperCase())
                      }
                      placeholder='Enter contract number'
                    />
                  </FieldControl>
                  <FieldDescription>Unique identifier for this contract</FieldDescription>
                </Field>
              </FormGrid>
            </FormSection>

            <FormSection title="Order Details">
              <FormGrid columns={2}>
                <Field name="requestor" required>
                  <FieldLabel>Requestor</FieldLabel>
                  <FieldControl>
                    <AutoComplete
                      options={allUsers.map(user => ({
                        value: user.id?.toString() || '',
                        label: user.name
                      }))}
                      value={localRequestor ? {
                        value: localRequestor.id?.toString() || '',
                        label: localRequestor.name
                      } : undefined}
                      onValueChange={(value) => {
                        const user = allUsers.find(u => u.id?.toString() === value)
                        setLocalRequestor(user || null)
                      }}
                      placeholder="Search requestors..."
                      emptyMessage="No requestors found"
                    />
                  </FieldControl>
                  <FieldDescription>Select the person requesting this sign order</FieldDescription>
                </Field>

                <Field name="customer" required>
                  <FieldLabel>Customer</FieldLabel>
                  <FieldControl>
                    <Combobox
                      items={[
                        { value: '__create_customer__', label: '+ Add new customer' },
                        ...customers.map(customer => ({
                          value: customer.id.toString(),
                          label: customer.displayName,
                          name: customer.name
                        }))
                      ]}
                      defaultValue={localCustomer ? {
                        value: localCustomer.id.toString(),
                        label: localCustomer.displayName,
                        name: localCustomer.name
                      } : null}
                    >
                      <ComboboxTrigger render={({ open }) => (
                        <Button variant="outline" className="w-full justify-between font-normal">
                          <ComboboxValue />
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      )} />
                      <ComboboxContent>
                        <ComboboxInput showTrigger={false} placeholder="Search customers..." />
                        <ComboboxEmpty>No customers found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem
                              key={item.value}
                              value={item}
                              onSelect={(selectedItem) => {
                                if (selectedItem.value === '__create_customer__') {
                                  setCustomerDrawerOpen(true)
                                } else {
                                  const customer = customers.find(c => c.id.toString() === selectedItem.value)
                                  if (customer) {
                                    setLocalCustomer(customer)
                                  }
                                }
                              }}
                            >
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </FieldControl>
                  <FieldDescription>The contractor for this project</FieldDescription>
                </Field>

                <Field name="orderDate">
                  <FieldLabel>Order Date</FieldLabel>
                  <FieldControl>
                    <DatePicker
                      date={localOrderDate}
                      onDateChange={(date) => setLocalOrderDate(date || new Date())}
                      placeholder="Select order date"
                    />
                  </FieldControl>
                  <FieldDescription>When the order was placed</FieldDescription>
                </Field>

                <Field name="needDate" required>
                  <FieldLabel>Need Date</FieldLabel>
                  <FieldControl>
                    <DatePicker
                      date={localNeedDate}
                      onDateChange={(date) => setLocalNeedDate(date || new Date())}
                      placeholder="Select need date"
                    />
                  </FieldControl>
                  <FieldDescription>When the signs are needed</FieldDescription>
                </Field>
              </FormGrid>

              <FormGrid columns={2}>
                <Field name="contact" required>
                  <FieldLabel>Contact</FieldLabel>
                  <FieldControl>
                    <Combobox
                      items={[
                        { value: '__create_contact__', label: '+ Add new contact' },
                        ...(localCustomer && Array.isArray(localCustomer.contactIds) && localCustomer.contactIds.length > 0
                          ? localCustomer.contactIds.map((id: number, idx: number) => ({
                              value: id.toString(),
                              label: localCustomer.names[idx],
                              email: localCustomer.emails[idx] || '',
                              phone: localCustomer.phones[idx] || '',
                              role: localCustomer.roles[idx] || ''
                            }))
                          : []
                        )
                      ]}
                      defaultValue={localContact ? {
                        value: localContact.id.toString(),
                        label: localContact.name,
                        email: localContact.email || '',
                        phone: localContact.phone || '',
                        role: localContact.role || ''
                      } : null}
                    >
                      <ComboboxTrigger render={({ open }) => (
                        <Button variant="outline" className="w-full justify-between font-normal">
                          <ComboboxValue />
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      )} />
                      <ComboboxContent>
                        <ComboboxInput showTrigger={false} placeholder="Search contacts..." />
                        <ComboboxEmpty>No contacts found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem
                              key={item.value}
                              value={item}
                              onSelect={(selectedItem) => {
                                if (selectedItem.value === '__create_contact__') {
                                  setContactDrawerOpen(true)
                                } else {
                                  if (!localCustomer) return
                                  const contactId = parseInt(selectedItem.value)
                                  const contactIndex = localCustomer.contactIds?.indexOf(contactId)
                                  if (contactIndex !== undefined && contactIndex >= 0) {
                                    const contact = {
                                      id: contactId,
                                      name: localCustomer.names[contactIndex],
                                      email: localCustomer.emails[contactIndex],
                                      phone: localCustomer.phones[contactIndex],
                                      role: localCustomer.roles[contactIndex]
                                    }
                                    setLocalContact(contact)
                                  }
                                }
                              }}
                            >
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </FieldControl>
                  <FieldDescription>Primary contact for this project</FieldDescription>
                </Field>
              </FormGrid>

              <Field name="orderType" required>
                <FieldLabel>Order Type</FieldLabel>
                <FieldControl>
                  <div className='flex flex-wrap gap-4 pt-2'>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='sale-checkbox-sheet'
                        checked={localOrderType.includes('sale')}
                        onCheckedChange={checked =>
                          handleOrderTypeChange('sale', checked as boolean)
                        }
                      />
                      <label
                        htmlFor='sale-checkbox-sheet'
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Sale
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='rental-checkbox-sheet'
                        checked={localOrderType.includes('rental')}
                        onCheckedChange={checked =>
                          handleOrderTypeChange('rental', checked as boolean)
                        }
                      />
                      <label
                        htmlFor='rental-checkbox-sheet'
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Rental
                      </label>
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
                      <label
                        htmlFor='perm-signs-checkbox-sheet'
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Permanent Signs
                      </label>
                    </div>
                  </div>
                </FieldControl>
                <FieldDescription>Select the type(s) of work needed</FieldDescription>
              </Field>

              {localOrderType.includes('rental') && (
                <FormGrid columns={2}>
                  <Field name="startDate">
                    <FieldLabel>Start Date</FieldLabel>
                    <FieldControl>
                      <DatePicker
                        date={localStartDate}
                        onDateChange={(date) => setLocalStartDate(date || new Date())}
                        placeholder="Select start date"
                      />
                    </FieldControl>
                    <FieldDescription>When the rental period begins</FieldDescription>
                  </Field>

                  <Field name="endDate">
                    <FieldLabel>End Date</FieldLabel>
                    <FieldControl>
                      <DatePicker
                        date={localEndDate}
                        onDateChange={(date) => setLocalEndDate(date || new Date())}
                        placeholder="Select end date"
                      />
                    </FieldControl>
                    <FieldDescription>When the rental period ends</FieldDescription>
                  </Field>
                </FormGrid>
              )}
            </FormSection>
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
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!areAllRequiredFieldsFilled()}
                  onClick={handleSave}
                  variant='default'
                >
                  {isCreateMode ? 'Create Sign Order' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {/* CustomerDrawer for creating new customer */}
      <CustomerDrawer
        open={customerDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Drawer is being closed - check if a customer was actually created
            const wasCustomerCreated = lastCreatedCustomerId.current !== null
            if (!wasCustomerCreated) {
              // No customer was created, so reset to the previous selection
              // The Combobox will show the previous value since we haven't changed localCustomer
            }
          }
          setCustomerDrawerOpen(open)
        }}
        customer={null}
        isViewMode={false}
        onSuccess={async (newCustomerId?: number) => {
          setCustomerDrawerOpen(false)
          if (newCustomerId) {
            lastCreatedCustomerId.current = newCustomerId
          }
          await getCustomers()
          if (lastCreatedCustomerId.current) {
            const created = customers.find(
              c => c.id === lastCreatedCustomerId.current
            )
            if (created) {
              setLocalCustomer(created)
            }
            lastCreatedCustomerId.current = null
          }
        }}
      />
      {/* Contact creation drawer: only render if localCustomer is defined */}
      {localCustomer && (
        <CustomerProvider initialCustomer={localCustomer}>
          <Drawer
            open={contactDrawerOpen}
            onOpenChange={setContactDrawerOpen}
            direction='right'
          >
            <DrawerContent>
              <CustomerContactForm
                customerId={localCustomer.id}
                isOpen={contactDrawerOpen}
                onClose={() => setContactDrawerOpen(false)}
                onSuccess={async (newContactId?: number) => {
                  setContactDrawerOpen(false)
                  if (localCustomer?.id) {
                    const updatedCustomer = await fetchCustomerById(
                      localCustomer.id
                    )
                    if (updatedCustomer) {
                      setLocalCustomer(updatedCustomer) // Update the local customer state with fresh data
                      if (typeof newContactId === 'number') {
                        lastCreatedContactId.current = newContactId
                      }
                    }
                  }
                }}
                customer={localCustomer}
              />
            </DrawerContent>
          </Drawer>
        </CustomerProvider>
      )}
    </>
  )
}
