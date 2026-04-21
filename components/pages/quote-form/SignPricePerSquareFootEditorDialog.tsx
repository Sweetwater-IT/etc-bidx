"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignPricePerSquareFootInput } from "./SignPricePerSquareFootInput";

interface SignPricePerSquareFootEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSignPrice: number;
  initialFacePrice: number;
  onSave: (values: { signPrice: number; facePrice: number }) => Promise<void> | void;
}

export function SignPricePerSquareFootEditorDialog({
  open,
  onOpenChange,
  initialSignPrice,
  initialFacePrice,
  onSave,
}: SignPricePerSquareFootEditorDialogProps) {
  const [signPrice, setSignPrice] = useState(initialSignPrice);
  const [facePrice, setFacePrice] = useState(initialFacePrice);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSignPrice(initialSignPrice);
    setFacePrice(initialFacePrice);
  }, [open, initialFacePrice, initialSignPrice]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit Sign Pricing Defaults</DialogTitle>
          <DialogDescription>
            Update the default price-per-square-foot values used when configuring `SIGN` and `FACE` quote items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <SignPricePerSquareFootInput label="Sign" value={signPrice} onChange={setSignPrice} />
          <SignPricePerSquareFootInput label="Face" value={facePrice} onChange={setFacePrice} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true);
              try {
                await onSave({ signPrice, facePrice });
                onOpenChange(false);
              } finally {
                setIsSaving(false);
              }
            }}
          >
            Save Pricing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
