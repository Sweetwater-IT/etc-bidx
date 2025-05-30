import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DigitalSignatureSectionProps {
  digitalSignature: boolean;
  setDigitalSignature: (value: boolean) => void;
}

export function DigitalSignatureSection({
  digitalSignature,
  setDigitalSignature,
}: DigitalSignatureSectionProps) {
  return (
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
  );
}
