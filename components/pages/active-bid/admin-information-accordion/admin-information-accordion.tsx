import { FormData } from "@/app/active-bid/page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import React from "react";

const AdminInformationAccordion = ({formData}: {formData: FormData}) => {
    return (
        <Card className="p-4">
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger className="py-0">
                        <h3 className="font-semibold">Admin Information</h3>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-2 gap-y-2 text-sm mt-4">
                            <div className="text-muted-foreground">Contract #</div>
                            <div className="text-right">{formData.contractNumber || "-"}</div>
                            <div className="text-muted-foreground">Owner</div>
                            <div className="text-right">{formData.owner || "-"}</div>
                            <div className="text-muted-foreground">County</div>
                            <div className="text-right">{formData.county || "-"}</div>
                            <div className="text-muted-foreground">Branch</div>
                            <div className="text-right">{formData.branch || "-"}</div>
                            <div className="text-muted-foreground">Township</div>
                            <div className="text-right">{formData.township || "-"}</div>
                            <div className="text-muted-foreground">Division</div>
                            <div className="text-right">{formData.division || "-"}</div>
                            <div className="text-muted-foreground">Start Date</div>
                            <div className="text-right">{formData.startDate || "-"}</div>
                            <div className="text-muted-foreground">End Date</div>
                            <div className="text-right">{formData.endDate || "-"}</div>
                            <div className="text-muted-foreground">Total Days</div>
                            <div className="text-right">0</div>
                            <div className="text-muted-foreground">Bid Date</div>
                            <div className="text-right">{formData.lettingDate || "-"}</div>
                            <div className="text-muted-foreground">SR Route</div>
                            <div className="text-right">{formData.srRoute || "-"}</div>
                            <div className="text-muted-foreground">DBE %</div>
                            <div className="text-right">{formData.dbePercentage || "%"}</div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
};

export default AdminInformationAccordion;
