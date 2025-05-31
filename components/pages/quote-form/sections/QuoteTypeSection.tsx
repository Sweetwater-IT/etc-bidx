import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuoteTypeSectionProps {
  quoteType: "new" | "estimate" | "job";
  setQuoteType: (value: "new" | "estimate" | "job") => void;
}

export function QuoteTypeSection({
  quoteType,
  setQuoteType,
}: QuoteTypeSectionProps) {
  return (
    <div className="space-y-2">
      <Label>Quote Type</Label>
      <Select
        value={quoteType}
        onValueChange={(value) =>
          setQuoteType(value as "new" | "estimate" | "job")
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select quote type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="estimate">Estimate</SelectItem>
          <SelectItem value="job">Job</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
