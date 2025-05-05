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
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { sendQuoteEmail } from "@/lib/api-client";
import { format } from "date-fns";
import { toast } from "sonner";

interface FormSelectProps {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  value?: string;
  onValueChange?: (value: string) => void;
}

function FormSelect({ label, placeholder, options, value, onValueChange }: FormSelectProps) {
  return (
    <div className="space-y-2 w-full">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
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

interface FormInputProps {
  label: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

function FormInput({ label, placeholder, value, disabled, onChange }: FormInputProps) {
  return (
    <div className="space-y-2 w-full">
      <Label>{label}</Label>
      <Input 
        placeholder={placeholder} 
        value={value} 
        disabled={disabled} 
        onChange={e => onChange && onChange(e.target.value)}
      />
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
  { value: "kennethmack6@gmail.com", label: "Contact 1" },
  { value: "contact2", label: "Contact 2" },
];

export default function CreateQuotePage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState("kennethmack6@gmail.com");

  const quoteId = `Q-${Math.floor(100 + Math.random() * 900)}`;
  
  const handleSendQuote = async () => {
    if (!selectedEmail) {
      setEmailError("Please select an email address in the 'To' field.");
      return;
    }
    
    setSending(true);
    setEmailError(null);
    
    try {
      const success = await sendQuoteEmail(selectedEmail, {
        quoteId,
        customerName: "Sample Customer",
        projectName: "Sample Project",
        totalAmount: 1250.00,
        createdBy: "System User",
        createdAt: format(new Date(), "PPP"),
      });
      
      if (success) {
        setEmailSent(true);
        toast.success(`Email sent successfully to ${selectedEmail}!`);
        setTimeout(() => setEmailSent(false), 5000); // Clear success message after 5 seconds
      } else {
        setEmailError("Failed to send email. Please try again.");
      }
    } catch (error) {
      console.error("Error sending quote email:", error);
      setEmailError("An error occurred while sending the email.");
    } finally {
      setSending(false);
    }
  };

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
              {emailSent && (
                <Badge className="bg-green-100 text-green-800 ml-2">
                  Email Sent Successfully
                </Badge>
              )}
              {emailError && (
                <Badge className="bg-red-100 text-red-800 ml-2">
                  {emailError}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Preview Quote</Button>
              <Button 
                onClick={handleSendQuote} 
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Quote"}
              </Button>
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
                  <div className="flex gap-2">
                    <Button onClick={handleSendQuote} disabled={sending} variant="outline">
                      {sending ? "Sending..." : "Send Test Email"}
                    </Button>
                    <Button>Add New Contact</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <FormSelect
                    label="To"
                    placeholder="Point of Contact"
                    options={CONTACTS}
                    value={selectedEmail}
                    onValueChange={setSelectedEmail}
                  />
                  <FormSelect
                    label="CC"
                    placeholder="Choose CC addresses"
                    options={CONTACTS}
                  />
                  <FormSelect
                    label="BCC"
                    placeholder="Choose BCC addresses"
                    options={CONTACTS}
                  />
                  <FormInput
                    label="Subject"
                    placeholder="Subject"
                  />
                  <FormInput
                    label="From"
                    value={process.env.SENDGRID_FROM_EMAIL || "it@establishedtraffic.com"}
                    disabled
                  />
                  <div className="space-y-2 w-full">
                    <Label>Body</Label>
                    <Textarea 
                      placeholder="Body"
                      className="min-h-[150px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (1/3) */}
            <div className="flex-1 space-y-6">
              {/* Quote Number */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="text-sm">
                  Quote Number: <span className="font-medium">{quoteId}</span>
                </div>
                <Badge variant="outline" className={emailSent ? "bg-green-50 text-green-900" : "bg-brown-50 text-brown-900"}>
                  {emailSent ? "SENT" : "NOT SENT"}
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

              {/* Notes */}
              <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-lg font-semibold">Notes</h2>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    No notes for this job
                  </div>
                  <Textarea 
                    placeholder="Add notes here..."
                    className="min-h-[150px]"
                  />
                  <Button className="w-full cursor-pointer">
                    Save Notes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
