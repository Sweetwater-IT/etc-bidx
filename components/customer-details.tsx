"use client"

import { memo } from "react"
import { Customer } from "@/types/Customer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CustomerDetailsProps {
  customer: Customer
  canEdit?: boolean
  handleChangeValues?: (key: string, value: any) => void
}

export const CustomerDetails = memo(function CustomerDetails({
  customer,
  canEdit = false,
  handleChangeValues
}: CustomerDetailsProps) {

  if (!customer) {
    return <div>No customer data available</div>;
  }

  return (
    <div className="mb-6 space-y-6">

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Customer Name</Label>
          {canEdit ? (
            <Input
              id="name"
              value={customer.name || ""}
              onChange={(e) => handleChangeValues?.("name", e.target.value)}
              placeholder="Customer name"
            />
          ) : (
            <h2 className="text-2xl font-bold">{customer.name || "Unnamed Customer"}</h2>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          {canEdit ? (
            <Input
              id="displayName"
              value={customer.displayName || ""}
              onChange={(e) => handleChangeValues?.("displayName", e.target.value)}
              placeholder="Display name"
            />
          ) : (
            customer.displayName && <p className="text-muted-foreground">{customer.displayName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            {canEdit ? (
              <Input
                id="address"
                value={customer.address || ""}
                onChange={(e) => handleChangeValues?.("address", e.target.value)}
                placeholder="Address"
              />
            ) : (
              <div className="text-sm text-muted-foreground">{customer.address}</div>
            )}
          </div>

          {canEdit ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={customer.city || ""}
                  onChange={(e) => handleChangeValues?.("city", e.target.value)}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={customer.state || ""}
                  onChange={(e) => handleChangeValues?.("state", e.target.value)}
                  placeholder="State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={customer.zip || ""}
                  onChange={(e) => handleChangeValues?.("zip", e.target.value)}
                  placeholder="ZIP code"
                />
              </div>
            </>
          ) : (
            (customer.city || customer.state || customer.zip) && (
              <p className="text-sm text-muted-foreground">
                {customer.city}{customer.city && customer.state ? ", " : ""}
                {customer.state} {customer.zip}
              </p>
            )
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mainPhone">Phone</Label>
            {canEdit ? (
              <Input
                id="mainPhone"
                value={customer.mainPhone || ""}
                onChange={(e) => handleChangeValues?.("mainPhone", e.target.value)}
                placeholder="Phone"
              />
            ) : (
              customer.mainPhone && (
                <p className="text-sm text-muted-foreground">{customer.mainPhone ?? "-"}</p>
              )
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Website</Label>
            {canEdit ? (
              <Input
                id="url"
                value={customer.url || ""}
                onChange={(e) => handleChangeValues?.("url", e.target.value)}
                placeholder="Website URL"
              />
            ) : (
              customer.url && (
                <p className="text-sm text-muted-foreground">
                  <a href={customer.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {customer.url}
                  </a>
                </p>
              )
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <Label htmlFor="paymentTerms">Payment Terms</Label>
        {canEdit ? (
          <Input
            id="paymentTerms"
            value={customer.paymentTerms || ""}
            onChange={(e) => handleChangeValues?.("paymentTerms", e.target.value)}
            placeholder="Payment terms"
          />
        ) : (
          customer.paymentTerms && (
            <p className="text-sm text-muted-foreground">{customer.paymentTerms}</p>
          )
        )}
      </div>
    </div>
  )
})
