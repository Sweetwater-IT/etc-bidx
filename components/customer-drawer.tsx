"use client"

import { useCallback, memo } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { X } from "lucide-react"
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
  customer,
  isViewMode,
  onSuccess
}: CustomerDrawerProps) {
  
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
                
                <Tabs defaultValue="contacts" className="w-full mt-6">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="quotes">Quotes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="contacts" className="p-1">
                    <CustomerContacts customer={customer} />
                  </TabsContent>
                  
                  <TabsContent value="quotes" className="p-1">
                    <div className="space-y-4">
                      <div className="text-center py-8 text-muted-foreground">
                        No quotes found for this customer.
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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
