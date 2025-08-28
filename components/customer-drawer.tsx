"use client"

import React, { useCallback, memo, useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { X } from "lucide-react"
import { Customer } from "@/types/Customer"
import { CustomerForm } from "@/components/customer-form"
import { CustomerContactForm } from "@/components/customer-contact-form"
import { CustomerDetails } from "@/components/customer-details"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { CustomerContacts } from "@/components/customer-contacts"
import { CustomerProvider } from "@/contexts/customer-context"
import { Separator } from "@/components/ui/separator"

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
  const [customerData, setCustomerData] = useState<Customer | null>(initialCustomer);
  const [activeTab, setActiveTab] = useState('contacts');
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editDataCustomer, setEditDataCustomer] = useState<boolean>(false)
  const [loadingApi, setLoadingApi] = React.useState<boolean>(false);

  const handleChangeValues = (key: string, value: any) => {
    setCustomerData((prev: any) => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleModeEditCustomer = () => setEditDataCustomer((prev) => !prev)

  useEffect(() => {
    if (initialCustomer) {
      console.log('CustomerDrawer: initialCustomer changed, updating local state');
      setCustomerData(initialCustomer);
    }
  }, [initialCustomer]);

  useEffect(() => {
    if (!open) {      
      setEditDataCustomer(false);
      setLoadingApi(false);
      setIsContactFormOpen(false);
      setCustomerData(null);
    }
  }, [open]);


  const refreshCustomerData = useCallback(async () => {
    if (customerData?.id) {
      try {
        console.log(`Manually refreshing customer data for ID: ${customerData.id}`);
        const response = await fetch(`/api/customers/${customerData.id}`);
        if (response.ok) {
          const updatedCustomer = await response.json();
          setCustomerData(updatedCustomer);
          onSuccess();
        }
      } catch (error) {
        console.error('Error refreshing customer data:', error);
      }
    }
  }, [customerData?.id, onSuccess]);

  const handleContactSuccess = useCallback(() => {
    setIsContactFormOpen(false);
    refreshCustomerData();
  }, [refreshCustomerData]);

  const handleContactDeleted = useCallback(() => {
    refreshCustomerData();
  }, [refreshCustomerData]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (isViewMode && !customerData) {
    return null;
  }

  const handleEdit = async () => {
    if (editDataCustomer) {
      if (!customerData?.id) return;
      setLoadingApi(true)
      try {

        const response = await fetch(`/api/customers/${customerData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to update customer:', errorData);
          return;
        }

        onSuccess?.();
        toggleModeEditCustomer();
      } catch (error) {
        console.error('Error updating customer:', error);
      } finally {
        setLoadingApi(false)
      }
    } else {
      toggleModeEditCustomer();
    }
  };


  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <CustomerProvider initialCustomer={customerData}>
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
            <DrawerHeader className="p-0">
              <div className="flex items-center p-6 pb-2">
                <DrawerTitle className="text-xl font-semibold">
                  {isViewMode ? 'Customer Details' : 'Create New Customer'}
                </DrawerTitle>
                <DrawerClose className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-gray-100 ml-2">
                  <X className="h-4 w-4" />
                </DrawerClose>
              </div>
              <Separator />
            </DrawerHeader>

            <div className="flex-1 overflow-auto p-6 pt-2 pb-24">
              {isViewMode && customerData ? (
                <div className="space-y-6">
                  <CustomerDetails
                    customer={customerData}
                    canEdit={editDataCustomer}
                    handleChangeValues={handleChangeValues}
                  />

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
                            customer={customerData}
                            onContactDeleted={handleContactDeleted}
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
                                console.log('Create new quote for customer ID:', customerData?.id)
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
              ) : !isViewMode ? (
                <CustomerForm
                  onSuccess={onSuccess}
                  onCancel={handleClose}
                />
              ) : null}
            </div>

            <div className="px-4 py-4 border-t flex gap-2 sticky bottom-0 bg-background z-10 justify-end">
              <div className="flex justify-between gap-4 w-full max-w-[351px]">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleEdit}>
                  {
                    loadingApi ? "Saving..."
                      :
                      editDataCustomer ? "Save" : "Edit"
                  }
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>

        {customerData && isContactFormOpen && (
          <CustomerContactForm
            customerId={customerData.id}
            isOpen={isContactFormOpen}
            onClose={() => setIsContactFormOpen(false)}
            onSuccess={handleContactSuccess}
            customer={customerData}
          />
        )}
      </CustomerProvider>
    </Drawer>
  )
})
