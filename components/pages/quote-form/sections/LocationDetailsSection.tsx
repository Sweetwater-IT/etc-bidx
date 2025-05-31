import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationDetailsSectionProps {
  county: string;
  setCounty: (value: string) => void;
  ecmsPoNumber: string;
  setEcmsPoNumber: (value: string) => void;
  stateRoute: string;
  setStateRoute: (value: string) => void;
  quoteType: "new" | "estimate" | "job";
}

export function LocationDetailsSection({
  county,
  setCounty,
  ecmsPoNumber,
  setEcmsPoNumber,
  stateRoute,
  setStateRoute,
  quoteType,
}: LocationDetailsSectionProps) {
  if (quoteType === "new") return null;

  return (
    <>
      <div className="space-y-2">
        <Label>County</Label>
        <Input
          placeholder="County"
          value={county}
          onChange={(e) => setCounty(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>ECMS / PO #</Label>
        <Input
          placeholder="ECMS / PO #"
          value={ecmsPoNumber}
          onChange={(e) => setEcmsPoNumber(e.target.value)}
          disabled={quoteType === "job"}
        />
      </div>
      <div className="space-y-2">
        <Label>State Route</Label>
        <Input
          placeholder="State Route"
          value={stateRoute}
          onChange={(e) => setStateRoute(e.target.value)}
        />
      </div>
    </>
  );
} 