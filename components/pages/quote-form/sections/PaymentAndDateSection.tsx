import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAYMENT_TERMS = [
  { value: "COD", label: "COD" },
  { value: "CC", label: "CC" },
  { value: "NET15", label: "NET15" },
  { value: "NET30", label: "NET30" },
  { value: "DUR", label: "DUR" },
];

export type PaymentTerms = "COD" | "CC" | "NET15" | "NET30" | "DUR";

interface PaymentAndDateSectionProps {
  paymentTerms: PaymentTerms;
  setPaymentTerms: (value: PaymentTerms) => void;
  quoteDate: string;
  setQuoteDate: (value: string) => void;
}

export function PaymentAndDateSection({
  paymentTerms,
  setPaymentTerms,
  quoteDate,
  setQuoteDate,
}: PaymentAndDateSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Payment Terms</Label>
        <Select value={paymentTerms} onValueChange={setPaymentTerms}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment terms" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_TERMS.map((term) => (
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
    </>
  );
}
