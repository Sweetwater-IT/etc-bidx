import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import React, { useState, useEffect, SetStateAction, Dispatch } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatUTCDate";

interface AdminInformationAccordionProps {
    currentStep: number;
    setCurrentStep: Dispatch<SetStateAction<number>>
    setCurrentPhase: Dispatch<SetStateAction<number>>
    currentPhase: number
}

const PhaseSummaryAccordion = ({ currentStep, setCurrentPhase, setCurrentStep, currentPhase }: AdminInformationAccordionProps) => {
    const [value, setValue] = useState<string[]>([]);
    const { mptRental } = useEstimate();

    useEffect(() => {
        if (currentStep === 2 || currentStep === 3 || currentStep === 4 || mptRental.phases.length > 1) {
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
                        <h3 className="font-semibold">Phase Summary</h3>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-y-2 text-sm mt-4">
                            {mptRental.phases.map((phase, index) => (
                                <div className={`${currentPhase === index ? 'bg-muted' : ''} p-2 rounded-sm cursor-pointer hover:bg-muted`} key={index}>
                                    <div className={`font-medium`} onClick={() => {
                                        setCurrentPhase(index)
                                        setCurrentStep(2)
                                    }}>
                                        Phase {index + 1}: {phase.name ?? ''}
                                    </div>
                                    <div className='ml-4 text-muted-foreground text-xs space-x-2'>
                                        {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
};

export default PhaseSummaryAccordion;