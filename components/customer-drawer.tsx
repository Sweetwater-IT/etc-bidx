"use client"

import { useCallback, memo, useState, useEffect, useRef } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { X, PlusCircle } from "lucide-react"
import { Customer } from "@/types/Customer"
import { CustomerDetails } from "@/components/customer-details"
import { CustomerContacts } from "@/components/customer-contacts"
import { CustomerForm } from "@/components/customer-form"
import { CustomerContactForm } from "@/components/customer-contact-form"

interface CustomerDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  isViewMode: boolean
  onSuccess: () => void
}

export const CustomerDrawer = memo(function CustomerDrawer({
  open,
  onOpenChange,
  customer: initialCustomer,
  isViewMode,
  onSuccess
}: CustomerDrawerProps) {
  
  const [activeTab, setActiveTab] = useState('contacts');
  const [refreshKey, setRefreshKey] = useState(0);
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  
  useEffect(() => {
    setCustomer(initialCustomer);
  }, [initialCustomer]);
  
  // This effect will run when refreshKey changes, triggering a direct fetch of the customer data
  // Use a ref to track the previous refreshKey to prevent unnecessary API calls
  const prevRefreshKeyRef = useRef(refreshKey);
  
  useEffect(() => {
    // Only refresh if we have a customer, the refreshKey has been updated, and it's different from the previous value
    if (customer && refreshKey > 0 && refreshKey !== prevRefreshKeyRef.current) {
      prevRefreshKeyRef.current = refreshKey;
      
      // Directly fetch the updated customer data from the API
      const fetchUpdatedCustomer = async () => {
        try {
          const response = await fetch(`/api/customers/${customer.id}`);
          if (response.ok) {
            const updatedCustomer = await response.json();
            // Update the local customer state with the fresh data
            setCustomer(updatedCustomer);
          }
        } catch (error) {
          console.error('Error fetching updated customer data:', error);
        }
      };
      
      fetchUpdatedCustomer();
      
      // Also call onSuccess to refresh the parent's data, but only once per refreshKey change
      onSuccess();
    }
  }, [refreshKey, customer, onSuccess]);
  
  const handleContactDeleted = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);
  
  const handleContactCreated = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);
  
  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="customer-drawer-content">
        {/* Add custom CSS for the drawer width */}
        <style jsx global>{`
          .customer-drawer-content {
            width: 95vw !important;
            max-width: none !important;
          }
          
          @media (min-width: 640px) {
            .customer-drawer-content {
              width: 50vw !important;
              max-width: none !important;
            }
          }
          
          .customer-drawer-content[data-vaul-drawer-direction="right"] {
            width: 95vw !important;
            max-width: none !important;
          }
          
          @media (min-width: 640px) {
            .customer-drawer-content[data-vaul-drawer-direction="right"] {
              width: 50vw !important;
              max-width: none !important;
            }
          }
        `}</style>
        <div className="flex flex-col h-full">
          <DrawerHeader className="border-b pb-4">
            <div className="flex justify-between items-center">
              <DrawerTitle className="text-xl font-semibold">
                {isViewMode ? 'Customer Details' : 'Create New Customer'}
              </DrawerTitle>
              <DrawerClose className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-gray-100">
                <X className="h-4 w-4" />
              </DrawerClose>
            </div>
          </DrawerHeader>
          
          <div className="flex-1 overflow-auto p-4">
            {isViewMode && customer ? (
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
                            onContactDeleted={handleContactDeleted} 
                            key={refreshKey} 
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
            ) : (
              <CustomerForm 
                onSuccess={onSuccess} 
                onCancel={handleClose}
              />
            )}
          </div>
        </div>
      </DrawerContent>
      {customer && isContactFormOpen && (
        <CustomerContactForm
          customerId={customer.id}
          isOpen={isContactFormOpen}
          onClose={() => setIsContactFormOpen(false)}
          onSuccess={handleContactCreated}
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
    </Drawer>
  )
})
