"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsNames, useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";

export function QuoteTermsAndConditions() {
  const { includeTerms, setIncludeTerms } = useQuoteForm();

  const handleTermToggle = (termId: TermsNames, checked: boolean) => {
    setIncludeTerms(prev => ({ ...prev, [termId]: checked }));
  };

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Terms and Conditions</h2>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="standard-terms"
            checked={includeTerms["standard-terms"]}
            onCheckedChange={(checked) => handleTermToggle("standard-terms", !!checked)}
          />
          <Label htmlFor="standard-terms">Standard Terms & Conditions</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="rental-agreements"
            checked={includeTerms["rental-agreements"]}
            onCheckedChange={(checked) => handleTermToggle("rental-agreements", !!checked)}
          />
          <Label htmlFor="rental-agreements">Rental Agreements</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="equipment-sale"
            checked={includeTerms["equipment-sale"]}
            onCheckedChange={(checked) => handleTermToggle("equipment-sale", !!checked)}
          />
          <Label htmlFor="equipment-sale">Equipment Sale Net 14</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="flagging-terms"
            checked={includeTerms["flagging-terms"]}
            onCheckedChange={(checked) => handleTermToggle("flagging-terms", !!checked)}
          />
          <Label htmlFor="flagging-terms">Flagging Terms & Conditions</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="custom-terms"
            checked={includeTerms["custom-terms"]}
            onCheckedChange={(checked) => handleTermToggle("custom-terms", !!checked)}
          />
          <Label htmlFor="custom-terms">Custom</Label>
        </div>
      </div>
    </div>
  );
}