import { FormData } from "@/types/IFormData";

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return date.toString();
  }
}
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import React, { useState, useEffect } from "react";

interface AdminInformationAccordionProps {
  formData: FormData;
  currentStep: number;
}

const AdminInformationAccordion = ({ formData, currentStep }: AdminInformationAccordionProps) => {
  const [value, setValue] = useState<string[]>([]);

  // Open accordion when currentStep is 1
  useEffect(() => {
    if (currentStep === 1) {
      setValue(["item-1"]);
    } else {
      setValue([]);
    }
  }, [currentStep]);

  return (
    <Card className="p-4">
      <Accordion type="multiple" value={value} onValueChange={setValue} className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="py-0">
            <h3 className="font-semibold">Admin Information</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-y-2 text-sm mt-4">
              <div className="text-muted-foreground">Contract #</div>
              <div className="text-right">{formData.adminData.contractNumber || "-"}</div>
              <div className="text-muted-foreground">Owner</div>
              <div className="text-right">{formData.adminData.owner || "-"}</div>
              <div className="text-muted-foreground">County</div>
              <div className="text-right">{formData.adminData.county.name || '-'}</div>
              <div className="text-muted-foreground">Branch</div>
              <div className="text-right">{formData.adminData.county.branch || '-'}</div>
              <div className="text-muted-foreground">Township</div>
              <div className="text-right">{formData.adminData.location || "-"}</div>
              <div className="text-muted-foreground">Division</div>
              <div className="text-right">{formData.adminData.division || "-"}</div>
              <div className="text-muted-foreground">Start Date</div>
              <div className="text-right">{formatDate(formData.adminData.startDate) || "-"}</div>
              <div className="text-muted-foreground">End Date</div>
              <div className="text-right">{formatDate(formData.adminData.endDate) || "-"}</div>
              <div className="text-muted-foreground">Total Days</div>
              <div className="text-right">0</div>
              <div className="text-muted-foreground">Bid Date</div>
              <div className="text-right">{formatDate(formData.adminData.lettingDate) || "-"}</div>
              <div className="text-muted-foreground">SR Route</div>
              <div className="text-right">{formData.adminData.srRoute || "-"}</div>
              <div className="text-muted-foreground">DBE %</div>
              <div className="text-right">{formData.adminData.dbe || "%"}</div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default AdminInformationAccordion;
