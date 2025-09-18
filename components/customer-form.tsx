"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCustomer } from "@/hooks/use-customers-swr"

interface CustomerFormProps {
  onSuccess: () => void
  onCancel?: () => void
}

type FormData = {
  name: string
  display_name: string
  customer_number: string
  url: string
  main_phone: string
  address: string
  city: string
  state: string
  zip: string
  payment_terms: string
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
  
  return (
    <form className="flex flex-col h-full" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex-1 overflow-y-auto p-1 -m-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            placeholder="Full customer name"
            {...register("name", { required: "Customer name is required" })}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
        
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="display_name">Display Name</Label>
          <Input 
            id="display_name" 
            placeholder="Display name"
            {...register("display_name")}
          />
        </div>
        
        {/* Customer Number */}
        <div className="space-y-2">
          <Label htmlFor="customer_number">Customer Number</Label>
          <Input 
            id="customer_number" 
            placeholder="Foundation Customer #"
            {...register("customer_number")}
          />
        </div>
        
        {/* Website URL */}
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
          <p className="text-xs text-muted-foreground">
            Accepts URLs starting with http://, https://, or www.
          </p>
        </div>
        
        {/* Main Phone */}
        <div className="space-y-2">
          <Label htmlFor="main_phone">Main Phone</Label>
          <Input 
            id="main_phone" 
            placeholder="Phone Number" 
            type="tel"
            {...register("main_phone")}
          />
        </div>
        
        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input 
            id="address" 
            placeholder="Address"
            {...register("address")}
          />
        </div>
        
        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input 
            id="city" 
            placeholder="City"
            {...register("city")}
          />
        </div>
        
        {/* State */}
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
        
        {/* ZIP Code */}
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input 
            id="zip" 
            placeholder="ZIP"
            {...register("zip")}
          />
        </div>
        
        {/* Payment Terms */}
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
