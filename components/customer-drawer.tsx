"use client"

import { useCallback, memo, useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { X, PlusCircle } from "lucide-react"
import { Customer } from "@/types/Customer"
import { CustomerDetails } from "@/components/customer-details"
import { CustomerContacts } from "@/components/customer-contacts"
import { CustomerForm } from "@/components/customer-form"

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
  
  useEffect(() => {
    setCustomer(initialCustomer);
  }, [initialCustomer]);
  
  const handleContactDeleted = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
    onSuccess();
  }, [onSuccess]);
  
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
                              onClick={() => {
                                console.log('Create new contact for customer ID:', customer.id)
                                // Implementation would open a modal or form to create a new contact
                              }}
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
    </Drawer>
  )
})
