"use client"

import { memo } from "react"
import { Customer } from "@/types/Customer"

interface CustomerContactsProps {
  customer: Customer
}

export const CustomerContacts = memo(function CustomerContacts({ customer }: CustomerContactsProps) {
  if (!customer.contactIds || customer.contactIds.length === 0) {
    return (
      <div className="p-4 rounded-md bg-gray-50 text-center">
        <p className="text-muted-foreground">No contacts found for this customer.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0 divide-y">
      {customer.contactIds.map((contactId, index) => (
        <div key={contactId} className="py-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-base">
                {customer.names[index] || 'Unnamed Contact'}
              </h3>
              {customer.roles[index] && (
                <p className="text-sm text-muted-foreground">
                  {customer.roles[index]}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-2 space-y-1.5">
            {customer.emails[index] && (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a href={`mailto:${customer.emails[index]}`} className="text-blue-600 hover:underline text-sm">
                  {customer.emails[index]}
                </a>
              </div>
            )}
            
            {customer.phones[index] && (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <a href={`tel:${customer.phones[index]}`} className="text-blue-600 hover:underline text-sm">
                  {customer.phones[index]}
                </a>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
})
