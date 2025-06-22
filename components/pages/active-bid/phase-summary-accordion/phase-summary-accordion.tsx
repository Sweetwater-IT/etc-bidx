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
import { Trash } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface AdminInformationAccordionProps {
    setCurrentPhase: Dispatch<SetStateAction<number>>
    currentPhase: number
}

const PhaseSummaryAccordion = ({ setCurrentPhase, currentPhase }: AdminInformationAccordionProps) => {
    const [value, setValue] = useState<string[]>([]);
    const { mptRental, dispatch } = useEstimate();

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);

    return (
        <>
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogTitle className='hidden'>Confirm phase deletion</DialogTitle>
                <DialogContent className="min-w-xl flex flex-col justify-center h-40">
                    <div className="flex flex-col items-center mt-4 space-y-4">
                        <div className="text-center">
                            Are you sure you want to delete phase {currentPhase + 1}
                            {mptRental.phases.length > 0 && mptRental.phases[currentPhase].name.trim() !== ''
                                ? ` (${mptRental.phases[currentPhase].name})`
                                : ''
                            }?
                            {currentPhase === 0 && 'This is the last MPT phase.'}
                        </div>
                        <div className="flex space-x-2">
                            <Button variant='outline'>Cancel</Button>
                            <Button variant='default' onClick={() => {
                                dispatch({ type: 'DELETE_MPT_PHASE', payload: currentPhase })
                                setDeleteConfirmOpen(false)
                            }}>Confirm</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Card className="p-4">
                <Accordion type="multiple" value={value} onValueChange={setValue} className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="py-0">
                            <h3 className="font-semibold">Phase Summary</h3>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-2 md:grid-cols-1 gap-y-2 text-sm mt-4">
                                {mptRental.phases.map((phase, index) => (
                                    <div className={`${currentPhase === index ? 'bg-muted' : ''} p-2 items-start flex flex-col rounded-sm cursor-pointer hover:bg-muted`} key={index}>
                                        <div className="flex w-full justify-between">
                                            <div>
                                                <div className={`font-medium`} onClick={() => {
                                                    setCurrentPhase(index)
                                                }}>
                                                    Phase {index + 1}: {phase.name ?? ''}
                                                </div>
                                                <div className='ml-4 mt-1 text-muted-foreground space-x-2'>
                                                    {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                                                </div>
                                            </div>
                                            <Button variant='default' onClick={() => {
                                                setDeleteConfirmOpen(true);
                                                if (index !== 0) {
                                                    setCurrentPhase(index - 1)
                                                }
                                            }}>
                                                <Trash />
                                            </Button>
                                        </div>
                                        <div className="w-full mt-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Personnel:</span>
                                                <span className="text-muted-foreground">{phase.personnel}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Trucks:</span>
                                                <span className="text-muted-foreground">{phase.numberTrucks}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Card>
        </>
    );
};

export default PhaseSummaryAccordion;