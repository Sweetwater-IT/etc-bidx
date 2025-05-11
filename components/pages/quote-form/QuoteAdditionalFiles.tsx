"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AttachmentNames, useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";

export function QuoteAdditionalFiles() {
  const { includeFiles, setIncludeFiles } = useQuoteForm();

  const handleFileToggle = (fileId: AttachmentNames, checked: boolean) => {
    setIncludeFiles(prev => ({ ...prev, [fileId as AttachmentNames]: checked }));
  };

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Additional Files</h2>
      <div className="mb-4 rounded-lg border-2 border-dashed p-8 text-center">
        <div className="text-muted-foreground">
          Drop files here to send as attachments to the quote
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="flagging-price-list"
            checked={includeFiles["flagging-price-list"]}
            onCheckedChange={(checked) => handleFileToggle("flagging-price-list", !!checked)}
          />
          <Label htmlFor="flagging-price-list">Flagging Price List</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="flagging-service-area"
            checked={includeFiles["flagging-service-area"]}
            onCheckedChange={(checked) => handleFileToggle("flagging-service-area", !!checked)}
          />
          <Label htmlFor="flagging-service-area">Flagging Service Area</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="bedford-branch"
            checked={includeFiles["bedford-branch"]}
            onCheckedChange={(checked) => handleFileToggle("bedford-branch", !!checked)}
          />
          <Label htmlFor="bedford-branch">Bedford Branch Sell Sheet</Label>
        </div>
      </div>
    </div>
  );
}