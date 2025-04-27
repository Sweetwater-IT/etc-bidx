"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/data-table";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface FormSelectProps {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
}

function FormSelect({ label, placeholder, options }: FormSelectProps) {
  return (
    <div className="space-y-2 w-full">
      <Label>{label}</Label>
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface FormCheckboxProps {
  id: string;
  label: string;
}

function FormCheckbox({ id, label }: FormCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id={id} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

const QUOTE_ITEMS_COLUMNS = [
  { key: "itemSku", title: "Item # / SKU" },
  { key: "description", title: "Description" },
  { key: "uom", title: "UOM" },
  { key: "qty", title: "Qty" },
  { key: "unitPrice", title: "Unit Price" },
  { key: "discount", title: "Discount" },
];

const QUOTE_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "custom", label: "Custom" },
];

const PAYMENT_TERMS = [
  { value: "net30", label: "Net 30" },
  { value: "net60", label: "Net 60" },
];

const CUSTOMERS = [
  { value: "customer1", label: "Customer 1" },
  { value: "customer2", label: "Customer 2" },
];

const CONTACTS = [
  { value: "contact1", label: "Contact 1" },
  { value: "contact2", label: "Contact 2" },
];

export default function CreateQuotePage() {
  const router = useRouter();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b px-6 py-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">Quote Form</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Preview Quote</Button>
              <Button>Send Quote</Button>
              <Button variant="outline">Download</Button>
            </div>
          </div>

          <div className="flex gap-6 p-6">
            {/* Main Form Column (2/3) */}
            <div className="flex-[2] space-y-6">
              {/* Admin Information */}
              <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Admin Information
                </h2>
                <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
                  <FormSelect
                    label="Quote Type"
                    placeholder="Choose quote type"
                    options={QUOTE_TYPES}
                  />
                  <FormSelect
                    label="Payment Terms"
                    placeholder="Payment Terms"
                    options={PAYMENT_TERMS}
                  />
                  <div className="space-y-2">
                    <Label>Quote Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="md:col-span-2">
                    <FormSelect
                      label="Customers"
                      placeholder="Select customers"
                      options={CUSTOMERS}
                    />
                  </div>
                  <div className="flex items-center h-full pt-5">
                    <FormCheckbox
                      id="digital-signature"
                      label="Digital signature"
                    />
                  </div>
                </div>
              </div>

              {/* Quote Items */}
              <div className="rounded-lg border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Quote Items</h2>
                  <Button>Add New Item</Button>
                </div>

                <div className="-mx-6">
                  <DataTable
                    data={[]}
                    columns={QUOTE_ITEMS_COLUMNS}
                    stickyLastColumn
                  />
                </div>

                <div className="mt-4 flex justify-end text-sm">
                  <div className="space-y-1">
                    <div>Total Items: 0</div>
                    <div>Total Value: $0.00</div>
                  </div>
                </div>
              </div>

              {/* Email Details */}
              <div className="rounded-lg border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Email Details</h2>
                  <Button>Add New Contact</Button>
                </div>
                <div className="space-y-4">
                  <FormSelect
                    label="To"
                    placeholder="Point of Contact"
                    options={CONTACTS}
                  />
                  <FormSelect
                    label="CC"
                    placeholder="Select CC recipients"
                    options={CONTACTS}
                  />
                </div>
              </div>
            </div>

            {/* Right Column (1/3) */}
            <div className="flex-1 space-y-6">
              {/* Quote Number */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="text-sm">
                  Quote Number: <span className="font-medium">Q-106</span>
                </div>
                <Badge variant="outline" className="bg-brown-50 text-brown-900">
                  NOT SENT
                </Badge>
              </div>

              {/* Additional Files */}
              <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-lg font-semibold">Additional Files</h2>
                <div className="mb-4 rounded-lg border-2 border-dashed p-8 text-center">
                  <div className="text-muted-foreground">
                    Drop files here to send as attachments to the quote
                  </div>
                </div>
                <div className="space-y-2">
                  <FormCheckbox
                    id="flagging-price-list"
                    label="Flagging Price List"
                  />
                  <FormCheckbox
                    id="flagging-service-area"
                    label="Flagging Service Area"
                  />
                  <FormCheckbox
                    id="bedford-branch"
                    label="Bedford Branch Sell Sheet"
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Terms and Conditions
                </h2>
                <div className="space-y-2">
                  <FormCheckbox
                    id="standard-terms"
                    label="Standard Terms & Conditions"
                  />
                  <FormCheckbox
                    id="rental-agreements"
                    label="Rental Agreements"
                  />
                  <FormCheckbox
                    id="equipment-sale"
                    label="Equipment Sale Net 14"
                  />
                  <FormCheckbox
                    id="flagging-terms"
                    label="Flagging Terms & Conditions"
                  />
                  <FormCheckbox id="custom-terms" label="Custom" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
