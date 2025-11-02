"use client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

const UOM_TYPES = ["EA", "LF", "TON", "HR"];

const emptyProduct = {
    item_name: "",
    item_number: "",
    description: "",
    uom: "",
    quantity: 1,
    unitPrice: "",
    discountType: "dollar",
    discount: "",
    notes: "",
};

export default function ModalCreateJobServiceItems({
    open,
    onOpenChange,
    item,
    editingSubItemId,
    handleNextDigits,
    formatDecimal,
    savedProduct
}: {
    open: boolean;
    onOpenChange: (val: boolean) => void;
    item: any;
    editingSubItemId?: string;
    handleNextDigits: (val1: any, val2: any, val3: any) => any,
    formatDecimal: (val: any) => any,
    savedProduct: (productData: any) => void,


}) {
    const [product, setProduct] = useState(emptyProduct);
    const [digits, setDigits] = useState({ unitPrice: "000", discount: "000" });

    useEffect(() => {
        if (!open) {
            setProduct(emptyProduct);
            setDigits({ unitPrice: "000", discount: "000" });
            return;
        }

        const source =
            item?.associatedItems?.find((s) => s.id === editingSubItemId) || item;

        if (!source) return;

        setProduct({
            item_number: source.item_number.trim() || "",
            description: source.description || "",
            uom: source.uom || "",
            quantity: source.quantity || 1,
            unitPrice: source.unitPrice || "",
            discountType: source.discountType || "dollar",
            discount: source.discount || "",
            notes: source.notes || "",
            item_name: source.display_name

        });

        setDigits({
            unitPrice: ((source.unitPrice || 0) * 100).toString().padStart(3, "0"),
            discount: ((source.discount || 0) * 100).toString().padStart(3, "0"),
        });
    }, [open, item, editingSubItemId]);

    const handleSaveProduct = (productData: any) => {
        console.log("Product saved:", productData);
        savedProduct(productData);
        onOpenChange(false);

    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[90vh] flex flex-col">
                <DialogHeader className="p-0 pt-4">
                    <DialogTitle className="text-[16px] ml-2">Add New Product</DialogTitle>
                    <Separator className="mt-2" />
                </DialogHeader>

                <form className="flex flex-col gap-5 px-4 flex-1 overflow-y-auto pt-2">
                    {[
                        { label: "Item # / SKU", key: "item_number" },
                        { label: "Item Name", key: "item_name" },
                        { label: "Description", key: "description" },
                    ].map(({ label, key }) => (
                        <div key={key}>
                            <Label className="text-[15px] font-medium text-muted-foreground">
                                {label}
                            </Label>
                            <Input
                                className="bg-background"
                                placeholder={`Enter ${label.toLowerCase()}`}
                                value={product[key]}
                                onChange={(e) =>
                                    setProduct((p) => ({ ...p, [key]: e.target.value }))
                                }
                            />
                        </div>
                    ))}

                    <div>
                        <Label className="text-[15px] font-medium text-muted-foreground">UOM</Label>
                        <Select
                            value={product.uom}
                            onValueChange={(value) => setProduct((p) => ({ ...p, uom: value }))}
                        >
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select UOM" />
                            </SelectTrigger>
                            <SelectContent>
                                {UOM_TYPES.map((uom) => (
                                    <SelectItem key={uom} value={uom}>
                                        {uom}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-[15px] font-medium text-muted-foreground">
                            Quantity
                        </Label>
                        <Input
                            type="number"
                            className="bg-background"
                            value={product.quantity}
                            onChange={(e) =>
                                setProduct((p) => ({ ...p, quantity: Number(e.target.value) }))
                            }
                        />
                    </div>

                    <div>
                        <Label className="text-[15px] font-medium text-muted-foreground">
                            Unit Price
                        </Label>
                        <Input
                            type="text"
                            className="bg-background"
                            value={formatDecimal(Number(digits.unitPrice) / 100)}
                            onChange={(e: any) => {
                                const ev = e.nativeEvent;
                                const nextDigits = handleNextDigits(
                                    digits.unitPrice,
                                    ev.inputType,
                                    (ev.data || "").replace(/,/g, "")
                                );
                                setDigits((d) => ({ ...d, unitPrice: nextDigits }));
                                setProduct((p) => ({ ...p, unitPrice: String(nextDigits / 100) }));
                            }}
                        />
                    </div>

                    <div>
                        <Label className="text-[15px] font-medium text-muted-foreground">
                            Discount
                        </Label>
                        <div className="flex items-center">
                            <Input
                                type="text"
                                className="bg-background rounded-r-none"
                                value={formatDecimal(Number(digits.discount) / 100)}
                                onChange={(e: any) => {
                                    const ev = e.nativeEvent;
                                    const nextDigits = handleNextDigits(
                                        digits.discount,
                                        ev.inputType,
                                        (ev.data || "").replace(/[$%\s,]/g, "")
                                    );
                                    setDigits((d) => ({ ...d, discount: nextDigits }));
                                    setProduct((p) => ({ ...p, discount: String(nextDigits / 100) }));
                                }}
                            />
                            <Select
                                value={product.discountType}
                                onValueChange={(value) =>
                                    setProduct((p) => ({ ...p, discountType: value }))
                                }
                            >
                                <SelectTrigger className="rounded-l-none w-[80px] border-l-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dollar">$</SelectItem>
                                    <SelectItem value="percentage">%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label className="text-[15px] font-medium text-muted-foreground">
                            Notes
                        </Label>
                        <Textarea
                            className="bg-background min-h-[100px]"
                            value={product.notes}
                            onChange={(e) =>
                                setProduct((p) => ({ ...p, notes: e.target.value }))
                            }
                        />
                    </div>
                </form>

                <div className="px-4 py-4 border-t flex gap-4">
                    <DialogClose asChild>
                        <Button variant="outline" className="flex-1 text-sm">
                            Cancel
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            className="flex-1 text-sm"
                            onClick={() => {
                                handleSaveProduct(product);
                            }}
                        >
                            Save Product
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
