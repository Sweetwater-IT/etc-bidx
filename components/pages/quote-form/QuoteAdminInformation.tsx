"use client";

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
import { MultiSelect } from "@/components/ui/multiselect";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";

const PAYMENT_TERMS = [
  { value: "1%10 NET 30", label: "1%10 NET 30" },
  { value: "COD", label: "COD" },
  { value: "CC", label: "CC" },
  { value: "NET15", label: "NET15" },
  { value: "NET30", label: "NET30" }
];

export type PaymentTerms = '1%10 NET 30' | 'COD' | 'CC' | 'NET15' | 'NET30'

export function QuoteAdminInformation() {
  const {
    quoteType,
    setQuoteType,
    paymentTerms,
    setPaymentTerms,
    quoteDate,
    setQuoteDate,
    selectedCustomers,
    setSelectedCustomers,
    digitalSignature,
    setDigitalSignature,
    customers,
    isLoadingCustomers
  } = useQuoteForm();

  const customerOptions = customers.map(c => ({
    value: c.name,
    label: c.name
  }));

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Admin Information</h2>
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Quote Type</Label>
          <Select value={quoteType} onValueChange={(value) => setQuoteType(value as "new" | "estimate" | "job")}>
            <SelectTrigger>
              <SelectValue placeholder="Choose quote type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="estimate">Estimate</SelectItem>
              <SelectItem value="job">Job</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Payment Terms</Label>
          <Select value={paymentTerms} onValueChange={setPaymentTerms}>
            <SelectTrigger>
              <SelectValue placeholder="Payment Terms" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TERMS.map(term => (
                <SelectItem key={term.value} value={term.value}>
                  {term.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quote Date</Label>
          <Input 
            type="date" 
            value={quoteDate}
            onChange={(e) => setQuoteDate(e.target.value)}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label>Customers</Label>
          <MultiSelect
            options={customerOptions}
            selected={selectedCustomers}
            onChange={setSelectedCustomers}
            placeholder="Select customers"
            disabled={isLoadingCustomers}
          />
        </div>

        <div className="flex items-center h-full pt-5">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="digital-signature" 
              checked={digitalSignature}
              onCheckedChange={setDigitalSignature}
            />
            <Label htmlFor="digital-signature">Digital signature</Label>
          </div>
        </div>
      </div>
    </div>
  );
}