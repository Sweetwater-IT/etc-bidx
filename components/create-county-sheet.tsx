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

interface CreateCountySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateCountySheet({
    open,
    onOpenChange,
    onSuccess,
}: CreateCountySheetProps) {
    const [name, setName] = useState("");
    const [state, setState] = useState("");
    const [market, setMarket] = useState("");
    const [flaggingBaseRate, setFlaggingBaseRate] = useState("");
    const [flaggingFringeRate, setFlaggingFringeRate] = useState("");
    const [flaggingRate, setFlaggingRate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setName("");
        setState("");
        setMarket("");
        setFlaggingBaseRate("");
        setFlaggingFringeRate("");
        setFlaggingRate("");
        setIsSubmitting(false);
    };

    // Reset form when sheet closes
    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/counties", {
                method: "POST",
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
                throw new Error("Failed to create county");
            }

            toast.success("County created successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating county:", error);
            toast.error("Failed to create county");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Create County</SheetTitle>
                    <SheetDescription>
                        Add a new county to the system.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-4">
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
                        {isSubmitting ? "Creating..." : "Create County"}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
} 