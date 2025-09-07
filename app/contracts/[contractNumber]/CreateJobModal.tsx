'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../components/ui/table'
import { AdminData } from '../../../types/TAdminData'
import { Customer } from '../../../types/Customer'
import { User } from '../../../types/User'
import { toast } from 'sonner'
import { Trash2Icon, Plus, Loader2 } from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../../components/ui/tabs'
import { formatCurrencyValue } from '@/lib/formatDecimals'
import { validateEmail } from '@/lib/emailValidation'
import { handlePhoneInput } from '@/lib/phone-number-functions'
import { ContactSelector } from '@/components/SelectContacts'

// Define item structure
interface JobItem {
  itemNumber: string
  description: string
  onJob: boolean
  aiaBilling: boolean
  quantity: number
  uom: string
  contractValue: number
  backlog?: boolean
  unitPrice?: number
  isCustom?: boolean
}

// Standard item structure from API
interface ItemNumber {
  id: number
  item_number: string
  description: string
  uom: string
}

interface CreateJobModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  customerContractNumber: string
  projectManager: string
  pmEmail: string
  pmPhone: string
  contractNumber: string
  adminData: AdminData
  sender: User
  jobId?: number
  onJobCreated: () => void
  onCustomerChange: (customer: Customer | null) => void;

}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onOpenChange,
  contractNumber,
  customer,
  customerContractNumber,
  projectManager,
  pmEmail,
  pmPhone,
  adminData,
  jobId,
  onJobCreated,
  onCustomerChange
}) => {
  const [itemNumbers, setItemNumbers] = useState<ItemNumber[]>([])

  // State for form values
  const [formValues, setFormValues] = useState({
    contractor: customer?.name || '',
    customer_contract_number: customerContractNumber || '',
    project_manager: projectManager || '',
    project_email: pmEmail || '',
    project_phone: pmPhone || '',
    customJobId: jobId,
    items: [] as JobItem[]
  })

  const [customJobNumber, setCustomJobNumber] = React.useState<boolean>(false)
  const [isValidJobNumber, setIsValidJobNumber] = React.useState<boolean>(true)
  // State for decimal masking - track digits for each contract value field
  const [contractValueDigits, setContractValueDigits] = useState<
    Record<string, string>
  >({})
  const [customItemDigits, setCustomItemDigits] = useState<string>('000')
  // State for validation errors
  const [emailError, setEmailError] = useState<string>()
  // State for job creation flag
  const [jobCreated, setJobCreated] = useState(false)

  const [localContact, setLocalContact] = useState<any | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  useEffect(() => {
    setFormValues(prev => ({
      ...prev,
      contractor: customer?.name || '',
      customer_contract_number: customerContractNumber || '',
      project_manager: projectManager || '',
      project_email: pmEmail || '',
      project_phone: pmPhone || '',
      customJobId: jobId,
      items: prev.items.length ? prev.items : []
    }))
  }, [customer, customerContractNumber, projectManager, pmEmail, pmPhone, jobId])

  useEffect(() => {
    if (localContact && localContact.id) {
      setFormValues(prev => ({
        ...prev,
        project_manager: localContact.name,
        project_email: localContact.email,
        project_phone: localContact.phone,
      }));
    }
  }, [localContact]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      fetch('/api/bid-item-numbers')
        .then(response => response.json())
        .then(data => {
          if (data.status === 200 && data.data) {
            setItemNumbers(data.data)
          } else {
            console.error('Failed to fetch item numbers:', data)
            toast.error('Failed to load item numbers')
          }
        })
        .catch(error => {
          console.error('Error fetching item numbers:', error)
          toast.error('Error loading item numbers')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen])

  // State for custom item form
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [newCustomItem, setNewCustomItem] = useState<
    Omit<JobItem, 'onJob' | 'aiaBilling'>
  >({
    itemNumber: '',
    description: '',
    quantity: 0,
    uom: '',
    contractValue: 0
  })

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Handle form input changes (only for editable fields)
  const handleInputChange = (field: string, value: string | number) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    handleInputChange('project_email', value)

    // Validate email
    const validation = validateEmail(value)
    setEmailError(validation.isValid ? undefined : validation.message)
  }

  // Handle phone change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ev = e.nativeEvent as InputEvent
    const { inputType } = ev
    const data = ev.data || ''
    const newValue = handlePhoneInput(
      inputType,
      data,
      formValues.project_phone || ''
    )
    handleInputChange('project_phone', newValue)
  }

  // Toggle item on job
  const handleOnJobToggle = (item: ItemNumber, checked: boolean) => {
    if (checked) {
      // Add item to form data when checked
      const newItem: JobItem = {
        itemNumber: item.item_number,
        description: item.description,
        onJob: true,
        aiaBilling: false,
        quantity: 0,
        uom: item.uom,
        contractValue: 0
      }

      setFormValues(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }))

      // Initialize digits for this item
      setContractValueDigits(prev => ({
        ...prev,
        [item.item_number]: '000'
      }))
    } else {
      // Remove item from form data when unchecked
      const updatedItems = formValues.items.filter(
        formItem => formItem.itemNumber !== item.item_number
      )

      setFormValues(prev => ({
        ...prev,
        items: updatedItems
      }))

      // Remove digits for this item
      setContractValueDigits(prev => {
        const newDigits = { ...prev }
        delete newDigits[item.item_number]
        return newDigits
      })
    }
  }

  // Handle form field change for items
  const handleItemFieldChange = (
    itemNumber: string,
    field: keyof JobItem,
    value: string | number | boolean
  ) => {
    setFormValues(prev => {
      const itemIndex = prev.items.findIndex(
        item => item.itemNumber === itemNumber
      )
      if (itemIndex === -1) return prev

      const updatedItems = [...prev.items]
      const updatedItem = { ...updatedItems[itemIndex], [field]: value }

      // Auto-calculate contractValue if quantity or unitPrice changes
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity =
          field === 'quantity' ? Number(value) : Number(updatedItem.quantity)
        const unitPrice =
          field === 'unitPrice' ? Number(value) : Number(updatedItem.unitPrice)
        updatedItem.contractValue = quantity * unitPrice
      }

      updatedItems[itemIndex] = updatedItem
      return {
        ...prev,
        items: updatedItems
      }
    })
  }

  // Handle next digits for contract values (higher limit than standard rates)
  function handleNextDigitsContractValue(
    current: string,
    inputType: string,
    data: string
  ): string {
    let digits = current

    if (inputType === 'insertText' && /\d/.test(data)) {
      const candidate = current + data
      // Allow up to 9,999,999.99 (9 digits total)
      if (parseInt(candidate, 10) <= 999999999) digits = candidate
    } else if (inputType === 'deleteContentBackward') {
      digits = current.slice(0, -1)
    }

    return digits.padStart(3, '0')
  }

  // Handle contract value change with decimal masking
  // const handleContractValueChange = (
  //   itemNumber: string,
  //   inputType: string,
  //   data: string
  // ) => {
  //   const currentDigits = contractValueDigits[itemNumber] || '000'
  //   const nextDigits = handleNextDigitsContractValue(
  //     currentDigits,
  //     inputType,
  //     data
  //   )

  //   setContractValueDigits(prev => ({
  //     ...prev,
  //     [itemNumber]: nextDigits
  //   }))

  //   const formatted = (parseInt(nextDigits, 10) / 100).toFixed(2)
  //   handleItemFieldChange(itemNumber, 'contractValue', parseFloat(formatted))
  // }

  // // Handle custom item contract value change
  // const handleCustomContractValueChange = (inputType: string, data: string) => {
  //   const nextDigits = handleNextDigitsContractValue(
  //     customItemDigits,
  //     inputType,
  //     data
  //   )
  //   setCustomItemDigits(nextDigits)

  //   const formatted = (parseInt(nextDigits, 10) / 100).toFixed(2)
  //   handleCustomItemChange('contractValue', parseFloat(formatted))
  // }

  // Handle custom item field change
  const handleCustomItemChange = (
    field: keyof Omit<JobItem, 'onJob' | 'aiaBilling'>,
    value: string | number | boolean
  ) => {
    setNewCustomItem(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity =
          field === 'quantity' ? Number(value) : Number(updated.quantity)
        const unitPrice =
          field === 'unitPrice' ? Number(value) : Number(updated.unitPrice)
        updated.contractValue = quantity * unitPrice
      }
      return updated
    })
  }

  // Add custom item
  const handleAddCustomItem = () => {
    if (newCustomItem.itemNumber && newCustomItem.description) {
      setFormValues(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            ...newCustomItem,
            onJob: true,
            aiaBilling: false,
            isCustom: true
          }
        ]
      }))

      // Reset form
      setNewCustomItem({
        itemNumber: '',
        description: '',
        quantity: 0,
        uom: '',
        contractValue: 0
      })
      setCustomItemDigits('000')
      setShowCustomForm(false)
    }
  }

  // Remove item
  const handleRemoveItem = (itemNumber: string) => {
    setFormValues(prev => ({
      ...prev,
      items: prev.items.filter(item => item.itemNumber !== itemNumber)
    }))

    // Remove digits for this item
    setContractValueDigits(prev => {
      const newDigits = { ...prev }
      delete newDigits[itemNumber]
      return newDigits
    })
  }

  useEffect(() => {
    if (!formValues.customJobId) return;

    const timeout = setTimeout(() => {
      validateCustomJobNumber();
    }, 500);

    return () => clearTimeout(timeout);
  }, [formValues.customJobId]);

  const validateCustomJobNumber = async () => {
    const jobNumber = formValues?.customJobId?.toString();

    if (!jobNumber || jobNumber.length !== 7) {
      return;
    }

    try {
      const res = await fetch(`/api/jobs/exist-job-number?customJobNumber=${jobNumber}`);
      const data = await res.json();

      setIsValidJobNumber(!data.exists);
    } catch (error) {
      console.error('Error validating job number:', error);
      setIsValidJobNumber(false);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    // Basic form validation
    if (
      !formValues.customer_contract_number ||
      !formValues.project_manager ||
      !formValues.project_email ||
      !formValues.project_phone
    ) {
      return false
    }

    // Check if items are valid
    const onJobItems = formValues.items.filter(item => item.onJob)

    // If no items are selected, form is not valid
    if (onJobItems.length === 0) return false

    // Check if any selected items have 0 quantity or value
    return !onJobItems.some(
      item => item.quantity === 0 || item.contractValue === 0
    )
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!isFormValid()) {
      toast.error(
        'Please fill in all required fields and ensure selected items have quantity and contract value'
      )
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare the request data
      const requestData = {
        data: {
          jobId: jobId,
          contractNumber,
          ...formValues,
          items: formValues.items.filter(item => item.onJob),
          adminData
        }
      }

      // Send data to server as JSON
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create job')
      }

      const result = await response.json()

      // Show success message
      toast.success(`Job created successfully for contract #${contractNumber}`)
      setJobCreated(true)
      // Notify parent of job creation
      if (onJobCreated) onJobCreated()
      // Close modal
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating job:', error)
      toast.error(
        `Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Check if an item is in the form
  const isItemInForm = (itemNumber: string) => {
    return formValues.items.some(item => item.itemNumber === itemNumber)
  }

  // Get form item index
  const getFormItemIndex = (itemNumber: string) => {
    return formValues.items.findIndex(item => item.itemNumber === itemNumber)
  }

  // Reset jobCreated when modal is reopened
  useEffect(() => {
    if (isOpen) setJobCreated(false)
  }, [isOpen])


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
        <DialogTitle>Create Job for Contract #{contractNumber}</DialogTitle>

        <Tabs defaultValue='details' className='w-full mt-4'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='details'>Project Details</TabsTrigger>
            <TabsTrigger value='items'>Item Selection</TabsTrigger>
          </TabsList>

          <TabsContent value='details' className='space-y-4 py-4'>
            <div className='w-full'>
              <div className='w-full mb-1.5'>
                <Label className='text-sm font-medium mb-1.5' >Enter number manually</Label>
                <Switch
                  checked={customJobNumber}
                  onCheckedChange={() => setCustomJobNumber((prev) => {
                    if (!prev === false) {
                      handleInputChange('customJobId', jobId ?? '')
                    }
                    return !prev
                  })}
                />
              </div>
              {
                customJobNumber &&
                <div className='w-full mb-4'>
                  <Label htmlFor='custom_job_number' className='text-sm font-medium mb-1.5' >Number Job</Label>
                  <Input
                    id='custom_job_number'
                    placeholder='Enter Custom ID'
                    className='h-10 border-gray-200'
                    value={formValues.customJobId}
                    onChange={e => {
                      handleInputChange('customJobId', e.target.value)
                      if (!isValidJobNumber) {
                        setIsValidJobNumber(true)
                      }
                    }}
                  />
                  {
                    !isValidJobNumber &&
                    <Label className='text-[12px] font-medium my-2 mx-2 text-red-400' >There is already a job with this number</Label>
                  }

                </div>
              }
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='contractor'>Contractor</Label>
                <Input
                  id='contractor'
                  value={formValues.contractor}
                  readOnly
                  disabled
                  className='bg-muted'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='customer_contract_number'>
                  Customer Contract #
                </Label>
                <Input
                  id='customer_contract_number'
                  value={formValues.customer_contract_number}
                  onChange={e =>
                    handleInputChange(
                      'customer_contract_number',
                      e.target.value
                    )
                  }
                  placeholder='Customer contract number'
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Contact Name</Label>
                <ContactSelector
                  localCustomer={customer}
                  localContact={localContact}
                  setLocalContact={setLocalContact}
                  setLocalCustomer={(customer: any) => onCustomerChange(customer)}

                  contactModalOpen={contactModalOpen}
                  setContactModalOpen={setContactModalOpen}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_manager">Project Manager</Label>
                <Input
                  id="project_manager"
                  value={formValues.project_manager}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_email">Project Manager Email</Label>
                <Input
                  id="project_email"
                  type="email"
                  value={formValues.project_email}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_phone">Project Manager Phone</Label>
                <Input
                  id="project_phone"
                  type="text"
                  value={formValues.project_phone}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value='items' className='space-y-4 py-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[150px]'>Item Number</TableHead>
                  <TableHead className='w-[250px]'>Description</TableHead>
                  <TableHead className='w-[80px]'>On Job?</TableHead>
                  <TableHead className='w-[80px]'>AIA?</TableHead>
                  <TableHead className='w-[120px]'>Quantity</TableHead>
                  <TableHead className='w-[80px]'>UOM</TableHead>
                  <TableHead className='w-[80px]'>Backlog</TableHead>
                  <TableHead className='w-[120px]'>Unit Price</TableHead>
                  <TableHead className='w-[150px]'>Contract Value</TableHead>
                  <TableHead className='w-[50px]'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Standard Items */}
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center py-4'>
                      <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                    </TableCell>
                  </TableRow>
                ) : (
                  itemNumbers.map((item, index) => {
                    const isOnJob = isItemInForm(item.item_number)
                    const formItemIndex = getFormItemIndex(item.item_number)

                    return (
                      <TableRow key={index}>
                        <TableCell className='font-medium'>
                          {item.item_number}
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          <Switch
                            checked={isOnJob}
                            onCheckedChange={checked =>
                              handleOnJobToggle(item, checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {isOnJob && (
                            <Switch
                              checked={
                                formValues.items[formItemIndex].aiaBilling
                              }
                              onCheckedChange={checked =>
                                handleItemFieldChange(
                                  item.item_number,
                                  'aiaBilling',
                                  checked
                                )
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isOnJob && (
                            <Input
                              type='text'
                              value={
                                formValues.items[formItemIndex].quantity === 0
                                  ? ''
                                  : formValues.items[formItemIndex].quantity
                              }
                              onChange={e =>
                                handleItemFieldChange(
                                  item.item_number,
                                  'quantity',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell>{item.uom}</TableCell>
                        <TableCell>
                          {isOnJob && (
                            <input
                              type='checkbox'
                              checked={
                                !!formValues.items[formItemIndex].backlog
                              }
                              onChange={e =>
                                handleItemFieldChange(
                                  item.item_number,
                                  'backlog',
                                  e.target.checked
                                )
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isOnJob && (
                            <Input
                              type='number'
                              inputMode='decimal'
                              value={
                                formValues.items[formItemIndex].unitPrice ?? ''
                              }
                              onChange={e =>
                                handleItemFieldChange(
                                  item.item_number,
                                  'unitPrice',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder='Unit Price'
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isOnJob && (
                            <Input
                              inputMode='decimal'
                              pattern='^\\d*(\\.\\d{0,2})?$'
                              value={`$ ${formatCurrencyValue(
                                formValues.items[formItemIndex].contractValue ||
                                0
                              )}`}
                              readOnly
                              placeholder='$ 0.00'
                            />
                          )}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )
                  })
                )}

                {/* Custom Items */}
                {formValues.items
                  .filter(item => item.isCustom)
                  .map(item => (
                    <TableRow key={`custom-${item.itemNumber}`}>
                      <TableCell className='font-medium'>
                        {item.itemNumber}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Switch checked={true} disabled />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.aiaBilling}
                          onCheckedChange={checked =>
                            handleItemFieldChange(
                              item.itemNumber,
                              'aiaBilling',
                              checked
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type='number'
                          min={0}
                          value={item.quantity}
                          onChange={e =>
                            handleItemFieldChange(
                              item.itemNumber,
                              'quantity',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder='Quantity'
                        />
                      </TableCell>
                      <TableCell>{item.uom}</TableCell>
                      <TableCell>
                        <input
                          type='checkbox'
                          checked={!!item.backlog}
                          onChange={e =>
                            handleItemFieldChange(
                              item.itemNumber,
                              'backlog',
                              e.target.checked
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type='number'
                          inputMode='decimal'
                          value={item.unitPrice ?? ''}
                          onChange={e =>
                            handleItemFieldChange(
                              item.itemNumber,
                              'unitPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder='Unit Price'
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          inputMode='decimal'
                          value={`$ ${formatCurrencyValue(
                            item.contractValue || 0
                          )}`}
                          readOnly
                          placeholder='$ 0.00'
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleRemoveItem(item.itemNumber)}
                        >
                          <Trash2Icon className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                {/* Custom Item Form */}
                {showCustomForm && (
                  <TableRow>
                    <TableCell>
                      <Input
                        value={newCustomItem.itemNumber}
                        onChange={e =>
                          handleCustomItemChange('itemNumber', e.target.value)
                        }
                        placeholder='Item Number'
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newCustomItem.description}
                        onChange={e =>
                          handleCustomItemChange('description', e.target.value)
                        }
                        placeholder='Description'
                      />
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                    <TableCell>
                      <Input
                        type='number'
                        min={0}
                        value={newCustomItem.quantity}
                        onChange={e =>
                          handleCustomItemChange(
                            'quantity',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder='Quantity'
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newCustomItem.uom}
                        onChange={e =>
                          handleCustomItemChange('uom', e.target.value)
                        }
                        placeholder='UOM'
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type='checkbox'
                        checked={!!newCustomItem.backlog}
                        onChange={e =>
                          handleCustomItemChange(
                            'backlog',
                            Boolean(e.target.checked)
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type='number'
                        inputMode='decimal'
                        value={newCustomItem.unitPrice ?? ''}
                        onChange={e =>
                          handleCustomItemChange(
                            'unitPrice',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder='Unit Price'
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={handleAddCustomItem}
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {!showCustomForm && (
              <Button
                variant='outline'
                onClick={() => setShowCustomForm(true)}
                className='mt-4'
              >
                <Plus className='h-4 w-4 mr-2' />
                Add Custom Item
              </Button>
            )}
          </TabsContent>
        </Tabs>

        <div className='flex justify-end space-x-2 mt-4'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting || jobCreated || isValidJobNumber === false}
            className='min-w-[120px]'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating...
              </>
            ) : (
              'Create Job'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateJobModal
