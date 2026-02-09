import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuoteTypeSectionProps {
  quoteType:  "straight_sale" | "to_project" | "estimate_bid";
  setQuoteType: (value:  "straight_sale" | "to_project" | "estimate_bid") => void;
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
          setQuoteType(value as  "straight_sale" | "to_project" | "estimate_bid")
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select quote type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="straight_sale">Straight Sale</SelectItem>
          <SelectItem value="estimate_bid">Estimate Bid</SelectItem>
          <SelectItem value="to_project">To Project</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
