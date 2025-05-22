"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreateBranchSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}



export function CreateBranchSheet({
    open,
    onOpenChange,
    onSuccess,
}: CreateBranchSheetProps) {
    const [formData, setFormData] = useState({ name: "", address: "" });
    const [digits, setDigits] = useState("000");

    useEffect(() => {
        if (!open) {
            setFormData({ name: "", address: "" });
            setDigits("000");
        }
    }, [open]);

    const formatDecimal = (value: string) =>
        (parseInt(value, 10) / 100).toFixed(2);

    const handleNextDigits = (
        current: string,
        inputType: string,
        data: string
    ) => {
        let d = current;
        if (inputType === "insertText" && /\d/.test(data)) {
            const c = current + data;
            if (parseInt(c, 10) <= 99999) d = c;
        } else if (inputType === "deleteContentBackward") {
            d = current.slice(0, -1);
        }
        return d.padStart(3, "0");
    };

    const handleInputChange = (key: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        const { name, address } = formData;
        const rate = parseFloat(formatDecimal(digits));
        if (!name || !address || isNaN(rate)) {
            toast.error("Please fill all required fields.");
            return;
        }

        try {
            const response = await fetch("/api/branches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, address, shop_rate: rate }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || "Failed to create record");
            }

            toast.success("Record created successfully!");
            onOpenChange(false);
            onSuccess?.();
        } catch {
            toast.error("Error creating record.");
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[500px] overflow-y-auto p-0">
                <div className="p-6 pb-0">
                    <SheetTitle className="text-xl font-medium">
                        New Record
                    </SheetTitle>
                    <SheetDescription className="text-sm text-gray-500 mt-1">
                        Provide the information below to create a new record.
                    </SheetDescription>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label
                                htmlFor="name"
                                className="text-sm font-medium mb-1.5"
                            >
                                Name*
                            </Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                className="h-10 border-gray-200"
                                value={formData.name}
                                onChange={(e) =>
                                    handleInputChange("name", e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label
                                htmlFor="address"
                                className="text-sm font-medium mb-1.5"
                            >
                                Address*
                            </Label>
                            <Input
                                id="address"
                                placeholder="123 Main St"
                                className="h-10 border-gray-200"
                                value={formData.address}
                                onChange={(e) =>
                                    handleInputChange("address", e.target.value)
                                }
                            />
                        </div>

                        <div className="relative space-y-2">
                            <Label
                                htmlFor="shopRate"
                                className="text-sm font-medium mb-1.5"
                            >
                                Shop Rate*
                            </Label>
                            <Input
                                id="shopRate"
                                inputMode="decimal"
                                pattern="^\\d*(\\.\\d{0,2})?$"
                                placeholder="$ 0.00"
                                value={`$ ${formatDecimal(digits)}`}
                                onChange={(e) => {
                                    const ev = e.nativeEvent as InputEvent;
                                    const next = handleNextDigits(
                                        digits,
                                        ev.inputType,
                                        (ev.data || "").replace(/\$/g, "")
                                    );
                                    setDigits(next);
                                }}
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 bg-black text-white hover:bg-gray-800"
                        >
                            Create
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
