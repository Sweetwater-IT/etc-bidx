"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmArchiveDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemCount: number
  itemType: "job" | "bid"
}

export function ConfirmArchiveDialog({
  isOpen,
  onClose,
  onConfirm,
  itemCount,
  itemType,
}: ConfirmArchiveDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    await onConfirm()
    setIsLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Archive</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive {itemCount} {itemCount === 1 ? itemType : `${itemType}s`}?
            This action will move the {itemCount === 1 ? itemType : `${itemType}s`} to the archive.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Archiving..." : "Archive"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
