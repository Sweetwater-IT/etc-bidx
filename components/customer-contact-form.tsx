"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCustomerContact, updateCustomerContact } from "@/lib/api-client"
import { toast } from "sonner"

interface CustomerContactFormProps {
  customerId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  contactToEdit?: {
    id: number
    name: string
    role: string
    email: string
    phone: string
  } | null
  customer: {
    name: string
    displayName: string
    address?: string
    city?: string
    state?: string
    zip?: string
    paymentTerms?: string
  }
}

export function CustomerContactForm({
  customerId,
  isOpen,
  onClose,
  onSuccess,
  contactToEdit,
  customer
}: CustomerContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!contactToEdit

  // Initialize form data when editing a contact
  useEffect(() => {
    if (contactToEdit) {
      setFormData({
        name: contactToEdit.name || "",
        role: contactToEdit.role || "",
        email: contactToEdit.email || "",
        phone: contactToEdit.phone || ""
      })
    } else {
      // Reset form when not editing
      setFormData({
        name: "",
        role: "",
        email: "",
        phone: ""
      })
    }
  }, [contactToEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Contact name is required")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      let result;
      
      if (isEditMode && contactToEdit) {
        // Update existing contact
        result = await updateCustomerContact(contactToEdit.id, {
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone
        })
        
        toast.success("Contact updated successfully")
      } else {
        // Create new contact
        result = await createCustomerContact({
          contractor_id: customerId,
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone
        })
        
        toast.success("Contact created successfully")
      }
      
      // Add a small delay to ensure the database has been updated
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Reset form
      setFormData({
        name: "",
        role: "",
        email: "",
        phone: ""
      })
      
      // Close only the contact form dialog, but keep the drawer open
      onClose()
      // Notify parent to refresh the contacts list without closing the drawer
      onSuccess()
    } catch (error) {
      console.error(isEditMode ? "Error updating contact:" : "Error creating contact:", error)
      toast.error(isEditMode ? "Failed to update contact. Please try again." : "Failed to create contact. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the contact details below.' 
              : 'Create a new contact for this customer. Fill in the details below.'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Customer Details Section */}
        <div className="border rounded-md p-4 mb-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">{customer.displayName || customer.name}</h3>
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
            {customer.address && (
              <div>
                <span className="font-medium">Address: </span>
                <span>{customer.address}</span>
                {(customer.city || customer.state || customer.zip) && (
                  <span>, {[customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}</span>
                )}
              </div>
            )}
            {customer.paymentTerms && (
              <div>
                <span className="font-medium">Payment Terms: </span>
                <span>{customer.paymentTerms}</span>
              </div>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (isEditMode ? "Updating..." : "Creating...") 
                : (isEditMode ? "Update Contact" : "Create Contact")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
