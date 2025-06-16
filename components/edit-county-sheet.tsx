"use client";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface County {
    id: number;
    name: string;
    state: string;
    market: string;
    flagging_base_rate: number;
    flagging_fringe_rate: number;
    flagging_rate: number;
}

interface EditCountySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    county: County;
}

export function EditCountySheet({
    open,
    onOpenChange,
    onSuccess,
    county,
}: EditCountySheetProps) {
    const [name, setName] = useState(county.name);
    const [state, setState] = useState(county.state);
    const [market, setMarket] = useState(county.market);
    const [flaggingBaseRate, setFlaggingBaseRate] = useState(county.flagging_base_rate.toString());
    const [flaggingFringeRate, setFlaggingFringeRate] = useState(county.flagging_fringe_rate.toString());
    const [flaggingRate, setFlaggingRate] = useState(county.flagging_rate.toString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setName(county.name);
            setState(county.state);
            setMarket(county.market);
            setFlaggingBaseRate(county.flagging_base_rate.toString());
            setFlaggingFringeRate(county.flagging_fringe_rate.toString());
            setFlaggingRate(county.flagging_rate.toString());
        }
    }, [open, county]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/counties/${county.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    state,
                    market,
                    flagging_base_rate: parseFloat(flaggingBaseRate),
                    flagging_fringe_rate: parseFloat(flaggingFringeRate),
                    flagging_rate: parseFloat(flaggingRate),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update county");
            }

            toast.success("County updated successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating county:", error);
            toast.error("Failed to update county");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit County</SheetTitle>
                    <SheetDescription>
                        Update county information.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                            id="state"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="market">Market</Label>
                        <Input
                            id="market"
                            value={market}
                            onChange={(e) => setMarket(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="flaggingBaseRate">Base Rate</Label>
                        <Input
                            id="flaggingBaseRate"
                            type="number"
                            step="0.01"
                            value={flaggingBaseRate}
                            onChange={(e) => setFlaggingBaseRate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="flaggingFringeRate">Fringe Rate</Label>
                        <Input
                            id="flaggingFringeRate"
                            type="number"
                            step="0.01"
                            value={flaggingFringeRate}
                            onChange={(e) => setFlaggingFringeRate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="flaggingRate">Flagging Rate</Label>
                        <Input
                            id="flaggingRate"
                            type="number"
                            step="0.01"
                            value={flaggingRate}
                            onChange={(e) => setFlaggingRate(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Updating..." : "Update County"}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
} 