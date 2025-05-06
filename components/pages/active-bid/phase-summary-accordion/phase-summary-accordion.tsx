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
        if (currentStep === 2 || currentStep === 3 || currentStep === 4) {
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
                                <Button className={`${currentPhase === index ? 'bg-black text-white' : 'bg-accent text-black hover:text-white'}`} key={index} onClick={() => {
                                    setCurrentPhase(index)
                                    setCurrentStep(2)
                                }}>
                                    Phase {index + 1}: {phase.name} {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                                </Button>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
};

export default PhaseSummaryAccordion;