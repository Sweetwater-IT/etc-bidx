"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CustomerForm } from "@/components/customer-form"
import { SimpleCustomerCreateDialog } from "@/components/simple-customer-create-dialog"

type CustomerResult = {
  id: number
  name?: string | null
  display_name?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  main_phone?: string | null
}

interface CustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (customer?: CustomerResult) => void | Promise<void>
  mode?: "create" | "edit"
  createVariant?: "simple" | "full"
  customerId?: number
  initialData?: any
  title?: string
  description?: string
}

export function CustomerModal({
  open,
  onOpenChange,
  onSuccess,
  mode = "create",
  createVariant = "simple",
  customerId,
  initialData,
  title,
  description,
}: CustomerModalProps) {
  const isEditMode = mode === "edit"

  if (!isEditMode && createVariant === "simple") {
    return (
      <SimpleCustomerCreateDialog
        open={open}
        onOpenChange={onOpenChange}
        onCreated={async customer => {
          await onSuccess?.(customer)
        }}
        title={title ?? "Add Customer"}
        description={
          description ??
          "Create a customer with a company name, then it will be available right away."
        }
      />
    )
  }

  if (!open) {
    return null
  }

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{title ?? (isEditMode ? "Edit Customer" : "Add Customer")}</DialogTitle>
          <DialogDescription>
            {description ??
              (isEditMode
                ? "Update the customer details below."
                : "Create a customer and make it available in the current workflow.")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 px-6 py-4">
          <CustomerForm
            mode={mode}
            customerId={customerId}
            initialData={initialData}
            onCancel={() => onOpenChange(false)}
            onSuccess={async customer => {
              await onSuccess?.(customer as CustomerResult | undefined)
              onOpenChange(false)
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
