"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import CustomPhoneNumberInput from "@/components/Input/CustomPhoneNumberInput"
import { notifications } from "@mantine/notifications"

interface CreateCustomerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    name: string
    customerNumber: string
    url: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
  }) => void
}

export function CreateCustomerSheet({ open, onOpenChange, onSubmit }: CreateCustomerSheetProps) {
  const [name, setName] = useState("")
  const [customerNumber, setCustomerNumber] = useState("")
  const [url, setUrl] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName("")
      setCustomerNumber("")
      setUrl("")
      setPhone("")
      setAddress("")
      setCity("")
      setState("")
      setZip("")
    }
  }, [open])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contractors/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          customerNumber: customerNumber ? parseInt(customerNumber) : undefined,
          url,
          phone,
          address,
          city,
          state,
          zip
        })
      })
      
      if (response.ok) {
        notifications.show({
          color: 'green',
          message: 'Customer successfully created'
        })
        onSubmit({
          name,
          customerNumber,
          url,
          phone,
          address,
          city,
          state,
          zip
        })
        onOpenChange(false)
      } else {
        const errorData = await response.json()
        notifications.show({
          color: 'red',
          message: `Failed to create customer: ${errorData.message || 'Unknown error'}`
        })
      }
    } catch (error) {
      notifications.show({
        color: 'red',
        message: 'An error occurred while creating the customer'
      })
      console.error('Error creating customer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Create Customer</SheetTitle>
          <SheetDescription>
            Add a new customer to your list. Fill in all the required information below.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Customer name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerNumber">Customer Number</Label>
                <Input
                  id="customerNumber"
                  placeholder="Foundation Customer #"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  type="number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  placeholder="ZIP"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t p-6">
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!name || !address || !city || !state || !zip || !phone || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Customer"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 