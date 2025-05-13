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
  web: string
  main_phone: string
  address: string
  city: string
  state: string
  zip: string
  payment_terms: string
}

export function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      name: '',
      display_name: '',
      customer_number: '',
      web: '',
      main_phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      payment_terms: ''
    }
  })
  
  // Handle select change for payment terms
  const handleSelectChange = (value: string) => {
    setValue('payment_terms', value)
  }
  
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
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
          <Label htmlFor="web">Website URL</Label>
          <Input 
            id="web" 
            placeholder="https://example.com" 
            type="url"
            {...register("web")}
          />
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
          <Input 
            id="state" 
            placeholder="State"
            {...register("state")}
          />
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
      
      {/* Action Buttons */}
      <div className="pt-6 border-t mt-6">
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
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  )
}
