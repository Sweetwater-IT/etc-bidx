"use client"

import { memo, useState } from "react"
import { Customer } from "@/types/Customer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { deleteCustomerContact } from "@/lib/api-client"
import { toast } from "sonner"
import { CustomerContactForm } from "@/components/customer-contact-form"

interface CustomerContactsProps {
  customer: Customer
  onContactDeleted?: () => void
}

export const CustomerContacts = memo(function CustomerContacts({ 
  customer, 
  onContactDeleted 
}: CustomerContactsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<{
    id: number
    name: string
    index: number
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [contactToEdit, setContactToEdit] = useState<{
    id: number
    name: string
    role: string
    email: string
    phone: string
  } | null>(null)

  const handleEdit = (contactId: number, index: number) => {
    const contact = {
      id: contactId,
      name: customer.names[index] || '',
      role: customer.roles[index] || '',
      email: customer.emails[index] || '',
      phone: customer.phones[index] || ''
    }
    setContactToEdit(contact)
    setIsEditFormOpen(true)
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (contactId: number, index: number) => {
    setContactToDelete({
      id: contactId,
      name: customer.names[index] || 'Unnamed Contact',
      index
    })
    setIsDeleteDialogOpen(true)
  }

  // Handle contact deletion
  const handleDelete = async () => {
    if (!contactToDelete) return
    
    try {
      setIsDeleting(true)
      const result = await deleteCustomerContact(contactToDelete.id)
      
      // Close the dialog first for better UX
      setIsDeleteDialogOpen(false)
      
      // Show success message with toast
      toast.success(`${contactToDelete.name} has been deleted successfully.`)
      
      // Notify parent component to refresh data
      if (onContactDeleted) {
        onContactDeleted()
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error("Failed to delete contact. Please try again.")
    } finally {
      setIsDeleting(false)
      setContactToDelete(null)
    }
  }

  if (!customer.contactIds || customer.contactIds.length === 0) {
    return (
      <div className="p-4 rounded-md bg-gray-50 text-center">
        <p className="text-muted-foreground">No contacts found for this customer.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customer.contactIds.map((contactId, index) => (
              <TableRow key={contactId}>
                <TableCell className="font-medium">
                  {customer.names[index] || 'Unnamed Contact'}
                </TableCell>
                <TableCell>{customer.roles[index] || '-'}</TableCell>
                <TableCell>
                  {customer.emails[index] ? (
                    <a 
                      href={`mailto:${customer.emails[index]}`} 
                      className="text-blue-600 hover:underline"
                    >
                      {customer.emails[index]}
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {customer.phones[index] ? (
                    <a 
                      href={`tel:${customer.phones[index]}`} 
                      className="text-blue-600 hover:underline"
                    >
                      {customer.phones[index]}
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(contactId, index)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(contactId, index)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the contact <span className="font-medium">{contactToDelete?.name}</span>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Form */}
      {customer && (
        <CustomerContactForm
          customerId={customer.id}
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          onSuccess={() => {
            if (onContactDeleted) onContactDeleted();
          }}
          contactToEdit={contactToEdit}
          customer={{
            name: customer.name,
            displayName: customer.displayName,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            zip: customer.zip,
            paymentTerms: customer.paymentTerms
          }}
        />
      )}
    </>
  )
})
