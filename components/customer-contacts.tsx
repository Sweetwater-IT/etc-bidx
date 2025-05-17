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
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

interface CustomerContactsProps {
  customer: Customer
}

export const CustomerContacts = memo(function CustomerContacts({ customer }: CustomerContactsProps) {
  // Placeholder functions for edit and delete actions
  // These would be implemented with actual API calls in a real implementation
  const handleEdit = (contactId: number) => {
    console.log(`Edit contact with ID: ${contactId}`)
    // Implementation would open a modal or form to edit the contact
  }

  const handleDelete = (contactId: number) => {
    console.log(`Delete contact with ID: ${contactId}`)
    // Implementation would call an API to delete the contact and refresh the list
  }

  if (!customer.contactIds || customer.contactIds.length === 0) {
    return (
      <div className="p-4 rounded-md bg-gray-50 text-center">
        <p className="text-muted-foreground">No contacts found for this customer.</p>
      </div>
    )
  }

  return (
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
                    <DropdownMenuItem onClick={() => handleEdit(contactId)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(contactId)}
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
  )
})
