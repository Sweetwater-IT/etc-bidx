"use client"

import { memo } from "react"
import { Customer } from "@/types/Customer"

interface CustomerDetailsProps {
  customer: Customer
}

export const CustomerDetails = memo(function CustomerDetails({ customer }: CustomerDetailsProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">{customer.name}</h2>
        {customer.displayName && (
          <p className="text-muted-foreground">{customer.displayName}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Address</p>
          <div className="text-sm text-muted-foreground">
            {customer.address && <p>{customer.address}</p>}
            {(customer.city || customer.state || customer.zip) && (
              <p>
                {customer.city}{customer.city && customer.state ? ', ' : ''}
                {customer.state} {customer.zip}
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {customer.mainPhone && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">{customer.mainPhone}</p>
            </div>
          )}
          
          {customer.url && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Website</p>
              <p className="text-sm text-muted-foreground">
                <a href={customer.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {customer.url}
                </a>
              </p>
            </div>
          )}
          
          {customer.customerNumber && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Customer #</p>
              <p className="text-sm text-muted-foreground">{customer.customerNumber}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="border-t pt-4">
        {customer.paymentTerms && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Payment Terms</p>
            <p className="text-sm text-muted-foreground">{customer.paymentTerms}</p>
          </div>
        )}
      </div>
    </div>
  )
})
