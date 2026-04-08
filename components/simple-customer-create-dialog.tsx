"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CreatedCustomer,
  SimpleCustomerCreateForm,
} from "@/components/simple-customer-create-form"

interface SimpleCustomerCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (customer: CreatedCustomer) => void | Promise<void>
  title?: string
  description?: string
}

export function SimpleCustomerCreateDialog({
  open,
  onOpenChange,
  onCreated,
  title = "New Customer",
  description = "Create a customer with a company name, then it will be available right away.",
}: SimpleCustomerCreateDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
  }

  return (
    <Dialog modal={false} open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <SimpleCustomerCreateForm
          onCancel={() => handleOpenChange(false)}
          onCreated={async customer => {
            await onCreated?.(customer)
            handleOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
