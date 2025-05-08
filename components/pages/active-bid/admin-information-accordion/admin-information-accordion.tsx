import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import React, { useState, useEffect } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { formatDate } from "@/lib/formatUTCDate";

interface AdminInformationAccordionProps {
  currentStep: number;
}

const AdminInformationAccordion = ({ currentStep }: AdminInformationAccordionProps) => {
  const [value, setValue] = useState<string[]>([]);
  const { adminData } = useEstimate();

  // Calculate total days between start and end date
  const getTotalDays = () => {
    if (adminData.startDate && adminData.endDate) {
      const start = new Date(adminData.startDate);
      const end = new Date(adminData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

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
              <div className="text-right">{adminData.contractNumber || "-"}</div>
              <div className="text-muted-foreground">Owner</div>
              <div className="text-right">{adminData.owner || "-"}</div>
              <div className="text-muted-foreground">County</div>
              <div className="text-right">{adminData.county?.name || '-'}</div>
              <div className="text-muted-foreground">Branch</div>
              <div className="text-right">{adminData.county?.branch || '-'}</div>
              <div className="text-muted-foreground">Township</div>
              <div className="text-right">{adminData.location || "-"}</div>
              <div className="text-muted-foreground">Division</div>
              <div className="text-right">{adminData.division || "-"}</div>
              <div className="text-muted-foreground">Start Date</div>
              <div className="text-right">{formatDate(adminData.startDate) || "-"}</div>
              <div className="text-muted-foreground">End Date</div>
              <div className="text-right">{formatDate(adminData.endDate) || "-"}</div>
              <div className="text-muted-foreground">Total Days</div>
              <div className="text-right">{getTotalDays()}</div>
              <div className="text-muted-foreground">Letting Date</div>
              <div className="text-right">{formatDate(adminData.lettingDate) || "-"}</div>
              <div className="text-muted-foreground">SR Route</div>
              <div className="text-right">{adminData.srRoute || "-"}</div>
              <div className="text-muted-foreground">DBE %</div>
              <div className="text-right">{adminData.dbe || "-"}</div>
              
              {(adminData.winterStart || adminData.winterEnd) && (
                <>
                  <div className="text-muted-foreground">Winter Start</div>
                  <div className="text-right">{formatDate(adminData.winterStart) || "-"}</div>
                  <div className="text-muted-foreground">Winter End</div>
                  <div className="text-right">{formatDate(adminData.winterEnd) || "-"}</div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default AdminInformationAccordion;