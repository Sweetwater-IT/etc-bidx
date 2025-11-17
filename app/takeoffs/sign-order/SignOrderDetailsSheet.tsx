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
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Building2, Mail, Check, ChevronsUpDown, AlertCircle } from 'lucide-react'  

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
        <SheetContent className='w-[500px] sm:max-w-[600px] p-0'>
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
                  <Popover open={openRequestor} onOpenChange={setOpenRequestor}>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        aria-expanded={openRequestor}
                        className='w-full justify-between'
                      >
                        {localRequestor
                          ? localRequestor.name
                          : 'Select requestor...'}
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
                      <Command>
                        <CommandInput placeholder='Search requestor...' />
                        <CommandEmpty>No requestor found.</CommandEmpty>
                        <CommandGroup className='max-h-[200px] overflow-y-auto'>
                          {allUsers.map(user => (
                            <CommandItem
                              key={user.id}
                              value={user.name}
                              onSelect={() => {
                                setLocalRequestor(user)
                                setOpenRequestor(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  localRequestor?.id === user.id
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {user.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                  <Label className="text-sm font-semibold mb-2 text-foreground">
                    Customer <span className='text-red-600'>*</span>
                  </Label>
                  <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCustomer}
                        className="w-full justify-between h-10 px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Building2 className="h-4 w-4 flex-shrink-0 opacity-50" />
                          <span className="truncate">
                            {localCustomer ? localCustomer.displayName : "Select contractor..."}
                          </span>
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput
                          value={customerSearch}
                          onValueChange={setCustomerSearch}
                          placeholder="Search customers..."
                          className="h-9 border-0 focus-visible:ring-0"
                        />
                        <div className="border-b px-2 py-2 sticky top-0 bg-background z-10">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-primary hover:bg-accent"
                            onClick={() => {
                              setOpenCustomer(false);
                              setCustomerDrawerOpen(true);
                            }}
                          >
                            <span className="mr-2">➕</span>
                            Add new customer
                          </Button>
                        </div>
                        <CommandList className="max-h-[300px] overflow-y-auto">
                          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                            No customers found.
                          </CommandEmpty>
                          <CommandGroup className="p-0">
                            {localCustomer && (
                              <CommandItem
                                onSelect={() => {
                                  setLocalCustomer(null);
                                  setCustomerSearch('');
                                  setOpenCustomer(false);
                                }}
                                className="font-medium text-destructive cursor-pointer px-2 py-2"
                              >
                                Clear selection
                              </CommandItem>
                            )}
                            {filteredCustomers.map(c => (
                              <CommandItem
                                key={c.id}
                                value={c.displayName || c.name}
                                onSelect={() => {
                                  setLocalCustomer(c);
                                  setCustomerSearch('');
                                  setOpenCustomer(false);
                                }}
                                className="px-2 py-2 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 flex-shrink-0",
                                    localCustomer?.id === c.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-sm font-medium truncate">
                                    {c.displayName || c.name}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Contact */}
                <div className='space-y-2'>
                  <Label className="text-sm font-semibold mb-2 text-foreground">
                    Contact <span className='text-red-600'>*</span>
                  </Label>
                  <Popover open={openCustomerContact} onOpenChange={setOpenCustomerContact}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCustomerContact}
                        className="w-full justify-between h-10 px-3 py-2 text-sm"
                        disabled={!localCustomer}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <User className="h-4 w-4 flex-shrink-0 opacity-50" />
                          <span className="truncate">
                            {localContact ? localContact.name : "Select contact..."}
                          </span>
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput
                          value={contactSearch}
                          onValueChange={setContactSearch}
                          placeholder="Search contacts..."
                          className="h-9 border-0 focus-visible:ring-0"
                        />
                        <div className="border-b px-2 py-2 sticky top-0 bg-background z-10">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-primary hover:bg-accent"
                            onClick={() => {
                              setOpenCustomerContact(false);
                              if (!localCustomer) {
                                toast.error('Please select a customer before adding a contact.');
                                return;
                              }
                              setContactDrawerOpen(true);
                            }}
                            disabled={!localCustomer}
                          >
                            <span className="mr-2">➕</span>
                            Add new contact
                          </Button>
                        </div>
                        <CommandList className="max-h-[300px] overflow-y-auto">
                          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                            {!localCustomer ? "Select a customer first" : "No contacts found."}
                          </CommandEmpty>
                          <CommandGroup className="p-0">
                            {localContact && (
                              <CommandItem
                                onSelect={() => {
                                  setLocalContact(null);
                                  setContactSearch('');
                                  setOpenCustomerContact(false);
                                }}
                                className="font-medium text-destructive cursor-pointer px-2 py-2"
                              >
                                Clear selection
                              </CommandItem>
                            )}
                            {filteredContacts.map(cc => (
                              <CommandItem
                                key={cc.id}
                                value={cc.name}
                                onSelect={() => {
                                  setLocalContact(cc);
                                  setContactSearch('');
                                  setOpenCustomerContact(false);
                                }}
                                className="px-2 py-2 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 flex-shrink-0",
                                    localContact?.id === cc.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-sm font-medium truncate">{cc.name}</span>
                                  {cc.email && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{cc.email}</span>
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
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
        onOpenChange={setCustomerDrawerOpen}
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
