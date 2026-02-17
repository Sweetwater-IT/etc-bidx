"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createCustomer } from "@/hooks/use-customers-swr"

interface CustomerFormProps {
  onSuccess: () => void
  onCancel?: () => void
}

type FormData = {
  // Company Info
  name: string
  display_name: string
  customer_number: string
  url: string
  main_phone: string

  // Main Address
  address: string
  city: string
  state: string
  zip: string

  // Bill To Address
  bill_to_address: string
  billToSameAsMain: boolean

  // Person Ordering
  personOrderingName: string
  personOrderingTitle: string

  // Primary Contact
  primaryContactName: string
  primaryContactPhone: string
  primaryContactEmail: string
  primaryContactSameAsPersonOrdering: boolean

  // Project Manager
  projectManagerName: string
  projectManagerPhone: string
  projectManagerEmail: string

  // Other
  payment_terms: string
  would_like_to_apply_for_credit: boolean
}

export function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, setValue, formState: { errors }, reset, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      display_name: '',
      customer_number: '',
      url: '',
      main_phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      payment_terms: ''
    }
  })

  const states = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'DC', label: 'District of Columbia' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', 'label': 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
    { value: 'AS', label: 'American Samoa' },
    { value: 'GU', label: 'Guam' },
    { value: 'MP', label: 'Northern Mariana Islands' },
    { value: 'PR', label: 'Puerto Rico' },
    { value: 'UM', label: 'United States Minor Outlying Islands' },
    { value: 'VI', label: 'Virgin Islands, U.S.' },
  ];
  
  // Handle select change for payment terms
  const handleSelectChange = (value: string) => {
    setValue('payment_terms', value)
  }
  
  // Watch the 'name' field to enable/style the create button
  const customerName = watch("name");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    
    try {
      await createCustomer(data)
      toast.success('Customer created successfully!')
      reset()
      onSuccess()
    } catch (error: any) {
      toast.error(`Error creating customer: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Watch form values for conditional logic
  const billToSameAsMain = watch("billToSameAsMain");
  const primaryContactSameAsPersonOrdering = watch("primaryContactSameAsPersonOrdering");
  const personOrderingName = watch("personOrderingName");
  const personOrderingTitle = watch("personOrderingTitle");

  return (
    <form className="flex flex-col h-full" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex-1 overflow-y-auto p-1 -m-1">
        <div className="space-y-8">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Legal Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter company legal name"
                  {...register("name", { required: "Company legal name is required" })}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  placeholder="Display name"
                  {...register("display_name")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_number">Customer Number</Label>
                <Input
                  id="customer_number"
                  placeholder="Foundation Customer #"
                  {...register("customer_number")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  placeholder="www.example.com"
                  type="text"
                  {...register("url", {
                    pattern: {
                      value: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                      message: "Please enter a valid URL (e.g., www.example.com)"
                    }
                  })}
                />
                {errors.url && (
                  <p className="text-sm text-red-500">{errors.url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_phone">Main Phone</Label>
                <Input
                  id="main_phone"
                  placeholder="Phone Number"
                  type="tel"
                  {...register("main_phone")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Select
                  onValueChange={handleSelectChange}
                  defaultValue=""
                >
                  <SelectTrigger id="payment_terms" className="w-full">
                    <SelectValue placeholder="Payment Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1%10 NET 30">1%10 NET 30</SelectItem>
                    <SelectItem value="COD">COD</SelectItem>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="NET15">NET15</SelectItem>
                    <SelectItem value="NET30">NET30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Main Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Main Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  {...register("address")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  {...register("city")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select onValueChange={(value) => setValue('state', value)}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  placeholder="ZIP"
                  {...register("zip")}
                />
              </div>
            </div>
          </div>

          {/* Bill To Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Bill To Address</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="billToSameAsMain"
                  checked={billToSameAsMain}
                  onCheckedChange={(checked) => setValue('billToSameAsMain', checked as boolean)}
                />
                <Label htmlFor="billToSameAsMain" className="text-sm font-normal">
                  Same as main address
                </Label>
              </div>

              {!billToSameAsMain && (
                <div className="space-y-2">
                  <Label htmlFor="bill_to_address">Bill To Address</Label>
                  <Input
                    id="bill_to_address"
                    placeholder="Enter bill to address"
                    {...register("bill_to_address")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Person Ordering */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Person Ordering</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="personOrderingName">Name</Label>
                <Input
                  id="personOrderingName"
                  placeholder="Person ordering name"
                  {...register("personOrderingName")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personOrderingTitle">Title</Label>
                <Input
                  id="personOrderingTitle"
                  placeholder="Job title"
                  {...register("personOrderingTitle")}
                />
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Primary Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="primaryContactSameAsPersonOrdering"
                  checked={primaryContactSameAsPersonOrdering}
                  onCheckedChange={(checked) => {
                    setValue('primaryContactSameAsPersonOrdering', checked as boolean);
                    if (checked) {
                      setValue('primaryContactName', personOrderingName || '');
                    }
                  }}
                />
                <Label htmlFor="primaryContactSameAsPersonOrdering" className="text-sm font-normal">
                  Same as person ordering
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryContactName">Name</Label>
                  <Input
                    id="primaryContactName"
                    placeholder="Contact name"
                    {...register("primaryContactName")}
                    disabled={primaryContactSameAsPersonOrdering}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryContactPhone">Phone</Label>
                  <Input
                    id="primaryContactPhone"
                    placeholder="Phone number"
                    type="tel"
                    {...register("primaryContactPhone")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryContactEmail">Email</Label>
                  <Input
                    id="primaryContactEmail"
                    placeholder="Email address"
                    type="email"
                    {...register("primaryContactEmail")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Manager */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Project Manager</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectManagerName">Name</Label>
                <Input
                  id="projectManagerName"
                  placeholder="Project manager name"
                  {...register("projectManagerName")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectManagerPhone">Phone</Label>
                <Input
                  id="projectManagerPhone"
                  placeholder="Phone number"
                  type="tel"
                  {...register("projectManagerPhone")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectManagerEmail">Email</Label>
                <Input
                  id="projectManagerEmail"
                  placeholder="Email address"
                  type="email"
                  {...register("projectManagerEmail")}
                />
              </div>
            </div>
          </div>

          {/* Credit Application */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="would_like_to_apply_for_credit"
                {...register("would_like_to_apply_for_credit")}
              />
              <Label htmlFor="would_like_to_apply_for_credit" className="text-sm font-normal">
                Would you like to apply for credit?
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-6 border-t">
        <div className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={`flex-1 transition-colors ${
              customerName ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  )
}
