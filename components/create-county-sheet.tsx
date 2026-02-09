"use client";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CreateCountySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface CountyFormData {
    name: string;
    market: string;
    flagging_base_rate: number;
    flagging_fringe_rate: number;
    flagging_rate: number;
    district: number;
    branch: number;
    labor_rate: number;
    fringe_rate: number;
    insurance: number;
    fuel: number;
    flagging_non_rated_target_gm: number;
    flagging_rated_target_gm: number;
}

export function CreateCountySheet({ open, onOpenChange, onSuccess }: CreateCountySheetProps) {
    const [name, setName] = useState("");
    const [market, setMarket] = useState("LOCAL");
    const [flaggingBaseRate, setFlaggingBaseRate] = useState(0);
    const [flaggingFringeRate, setFlaggingFringeRate] = useState(0);
    const [flaggingRate, setFlaggingRate] = useState(0);
    const [district, setDistrict] = useState(0);
    const [branch, setBranch] = useState(0);
    const [laborRate, setLaborRate] = useState(0);
    const [fringeRate, setFringeRate] = useState(0);
    const [insurance, setInsurance] = useState(0);
    const [fuel, setFuel] = useState(0);
    const [flaggingNonRatedTargetGM, setFlaggingNonRatedTargetGM] = useState(0);
    const [flaggingRatedTargetGM, setFlaggingRatedTargetGM] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = useCallback(() => {
        setName("");
        setMarket("LOCAL");
        setFlaggingBaseRate(0);
        setFlaggingFringeRate(0);
        setFlaggingRate(0);
        setDistrict(0);
        setBranch(0);
        setLaborRate(0);
        setFringeRate(0);
        setInsurance(0);
        setFuel(0);
        setFlaggingNonRatedTargetGM(0);
        setFlaggingRatedTargetGM(0);
        setError(null);
    }, []);

    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open, resetForm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const newCounty: CountyFormData = {
            name,
            market,
            flagging_base_rate: flaggingBaseRate,
            flagging_fringe_rate: flaggingFringeRate,
            flagging_rate: flaggingRate,
            district,
            branch,
            labor_rate: laborRate,
            fringe_rate: fringeRate,
            insurance,
            fuel,
            flagging_non_rated_target_gm: flaggingNonRatedTargetGM,
            flagging_rated_target_gm: flaggingRatedTargetGM,
        };

        try {
            const response = await fetch("/api/counties", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newCounty),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.message || "Failed to create county");
                return;
            }

            toast.success("County created successfully");
            onSuccess?.();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Create County</SheetTitle>
                    <SheetDescription>
                        Add a new county to the database.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 px-4">
                    {error && <div className="text-red-500">{error}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">County Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="market">Market</Label>
                            <Select
                                value={market}
                                onValueChange={(value: string) => setMarket(value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a market" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOCAL">LOCAL</SelectItem>
                                    <SelectItem value="CORE">CORE</SelectItem>
                                    <SelectItem value="MOBILIZATION">MOBILIZATION</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="district">District</Label>
                            <Input
                                id="district"
                                type="number"
                                value={district}
                                onChange={(e) => setDistrict(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="branch">Branch</Label>
                            <Input
                                id="branch"
                                type="number"
                                value={branch}
                                onChange={(e) => setBranch(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="laborRate">Labor Rate</Label>
                            <Input
                                id="laborRate"
                                type="number"
                                value={laborRate}
                                onChange={(e) => setLaborRate(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <Label htmlFor="fringeRate">Fringe Rate</Label>
                            <Input
                                id="fringeRate"
                                type="number"
                                value={fringeRate}
                                onChange={(e) => setFringeRate(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <Label htmlFor="flaggingBaseRate">Flagging Base Rate</Label>
                            <Input
                                id="flaggingBaseRate"
                                type="number"
                                value={flaggingBaseRate}
                                onChange={(e) => setFlaggingBaseRate(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <Label htmlFor="flaggingFringeRate">Flagging Fringe Rate</Label>
                            <Input
                                id="flaggingFringeRate"
                                type="number"
                                value={flaggingFringeRate}
                                onChange={(e) => setFlaggingFringeRate(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <Label htmlFor="flaggingRate">Flagging Rate</Label>
                            <Input
                                id="flaggingRate"
                                type="number"
                                value={flaggingRate}
                                onChange={(e) => setFlaggingRate(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <Label htmlFor="insurance">Insurance</Label>
                            <Input
                                id="insurance"
                                type="number"
                                value={insurance}
                                onChange={(e) => setInsurance(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <Label htmlFor="fuel">Fuel</Label>
                            <Input
                                id="fuel"
                                type="number"
                                value={fuel}
                                onChange={(e) => setFuel(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <Label htmlFor="flaggingNonRatedTargetGM">Flagging Non-Rated Target GM</Label>
                            <Input
                                id="flaggingNonRatedTargetGM"
                                type="number"
                                value={flaggingNonRatedTargetGM}
                                onChange={(e) => setFlaggingNonRatedTargetGM(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                        <div>
                            <Label htmlFor="flaggingRatedTargetGM">Flagging Rated Target GM</Label>
                            <Input
                                id="flaggingRatedTargetGM"
                                type="number"
                                value={flaggingRatedTargetGM}
                                onChange={(e) => setFlaggingRatedTargetGM(Number(e.target.value))}
                                step="0.01"
                            />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create County"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
} 