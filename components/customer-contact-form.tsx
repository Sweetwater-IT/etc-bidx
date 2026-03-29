"use client"

import { useState, useEffect } from "react"
import { formatPhoneNumber } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useCustomer } from "@/contexts/customer-context"

interface CustomerContactFormProps {
  customerId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: (newContactId?: number, newContactData?: any) => void
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
    url?: string
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

    // Apply phone number formatting if the phone field is being updated
    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const { updateContact } = useCustomer()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required")
      return
    }

    try {
      setIsSubmitting(true)

      if (isEditMode && contactToEdit) {
        const success = await updateContact(contactToEdit.id, {
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone
        })

        if (success) {
          setFormData({
            name: "",
            role: "",
            email: "",
            phone: ""
          })

          onClose()
          onSuccess()
          toast.success('Contact updated successfully');
        } else {
          console.error('Contact update failed but no error was thrown');
          toast.error('Failed to update contact');
        }
      } else {
        // For creating contacts, call the API directly to get the contact data
        const response = await fetch('/api/customer-contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractor_id: customerId,
            name: formData.name,
            role: formData.role,
            email: formData.email,
            phone: formData.phone
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const newContact = result.data;

          setFormData({
            name: "",
            role: "",
            email: "",
            phone: ""
          })

          onClose()
          onSuccess(newContact.id, {
            name: newContact.name,
            role: newContact.role,
            email: newContact.email,
            phone: newContact.phone
          })
          toast.success('Contact created successfully');
        } else {
          const errorData = await response.json();
          console.error('Contact creation failed:', errorData);
          toast.error('Failed to create contact');
        }
      }
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
            {customer.url && (
              <div>
                <span className="font-medium">Website: </span>
                <a
                  href={customer.url.startsWith('http') ? customer.url : `https://${customer.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {customer.url}
                </a>
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
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESTIMATOR">ESTIMATOR</SelectItem>
                  <SelectItem value="PROJECT MANAGER">PROJECT MANAGER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="FIELD / SUPERVISOR">FIELD / SUPERVISOR</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
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
                placeholder="(123) 456-7890"
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
