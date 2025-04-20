import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const BidSummaryAccordion = () => {
    return (
        <Card className="p-4">
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger className="py-0">
                        <h3 className="font-semibold">Bid Summary</h3>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 text-sm mt-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Revenue:</span>
                                <span>$0.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Cost:</span>
                                <span>$0.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Gross Profit:</span>
                                <span>$0.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Gross Margin:</span>
                                <span>0.00%</span>
                            </div>
                            <Button className="w-full mt-4" variant="secondary">
                                View Bid Summary
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
};

export default BidSummaryAccordion;
