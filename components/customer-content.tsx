"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { CustomerDetails } from "@/components/customer-details"
import { CustomerContacts } from "@/components/customer-contacts"
import { useCustomer } from "@/contexts/customer-context"

interface CustomerContentProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  setIsContactFormOpen: (isOpen: boolean) => void
  onSuccess: () => void
}

export const CustomerContent = memo(function CustomerContent({
  activeTab,
  setActiveTab,
  setIsContactFormOpen,
  onSuccess
}: CustomerContentProps) {
  const { customer } = useCustomer()

  console.log('CustomerContent - customer from context:', customer)

  if (!customer) {
    console.log('CustomerContent - No customer data available')
    return null
  }

  return (
    <>
      <CustomerDetails customer={customer} />
      
      <div className="w-full mt-6">
        {/* Custom Tabs Implementation */}
        <div className="w-full">
          {/* Tab Headers */}
          <div className="flex w-full border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('contacts')}
              className={`py-2 px-18 text-center font-medium ${activeTab === 'contacts' ? 'border-b-2 border-black' : ''}`}
            >
              Contacts
            </button>
            <button 
              onClick={() => setActiveTab('quotes')}
              className={`py-2 px-18 text-center font-medium ${activeTab === 'quotes' ? 'border-b-2 border-black' : ''}`}
            >
              Quotes
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="mt-4">
            {/* Contacts Tab Content */}
            {activeTab === 'contacts' && (
              <div className="p-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium">Customer Contacts</h3>
                  <Button 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => setIsContactFormOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create Contact
                  </Button>
                </div>
                <CustomerContacts 
                  customer={customer} 
                  onContactDeleted={() => {
                    // Call parent's onSuccess to refresh the data in the parent component
                    onSuccess()
                  }}
                />
              </div>
            )}
            
            {/* Quotes Tab Content */}
            {activeTab === 'quotes' && (
              <div className="p-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium">Customer Quotes</h3>
                  <Button 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => {
                      console.log('Create new quote for customer ID:', customer.id)
                      // Implementation would redirect to quote creation page or open a modal
                    }}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create Quote
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    No quotes found for this customer.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
})
