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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface County {
    id: string;
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

interface EditCountySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    county: County | null;
    onSuccess?: () => void;
}

export function EditCountySheet({ open, onOpenChange, county, onSuccess }: EditCountySheetProps) {
    const [name, setName] = useState(county?.name || '');
    const [market, setMarket] = useState(county?.market || 'LOCAL');
    const [flaggingBaseRate, setFlaggingBaseRate] = useState(county?.flagging_base_rate || 0);
    const [flaggingFringeRate, setFlaggingFringeRate] = useState(county?.flagging_fringe_rate || 0);
    const [flaggingRate, setFlaggingRate] = useState(county?.flagging_rate || 0);
    const [district, setDistrict] = useState(county?.district || 0);
    const [branch, setBranch] = useState(county?.branch || 0);
    const [laborRate, setLaborRate] = useState(county?.labor_rate || 0);
    const [fringeRate, setFringeRate] = useState(county?.fringe_rate || 0);
    const [insurance, setInsurance] = useState(county?.insurance || 0);
    const [fuel, setFuel] = useState(county?.fuel || 0);
    const [flaggingNonRatedTargetGM, setFlaggingNonRatedTargetGM] = useState(county?.flagging_non_rated_target_gm || 0);
    const [flaggingRatedTargetGM, setFlaggingRatedTargetGM] = useState(county?.flagging_rated_target_gm || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (county) {
            setName(county.name);
            setMarket(county.market);
            setFlaggingBaseRate(county.flagging_base_rate);
            setFlaggingFringeRate(county.flagging_fringe_rate);
            setFlaggingRate(county.flagging_rate);
            setDistrict(county.district);
            setBranch(county.branch);
            setLaborRate(county.labor_rate);
            setFringeRate(county.fringe_rate);
            setInsurance(county.insurance);
            setFuel(county.fuel);
            setFlaggingNonRatedTargetGM(county.flagging_non_rated_target_gm);
            setFlaggingRatedTargetGM(county.flagging_rated_target_gm);
        }
    }, [county]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!county) return;

        setIsLoading(true);
        setError(null);

        const updatedCounty = {
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
            const response = await fetch(`/api/counties/${county.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCounty),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.message || 'Failed to update county');
                return;
            }

            toast.success('County updated successfully');
            onSuccess?.();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit County</SheetTitle>
                    <SheetDescription>Edit the details of the selected county.</SheetDescription>
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
                            {isLoading ? 'Updating...' : 'Update County'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
} 