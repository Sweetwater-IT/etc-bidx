'use client'

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuoteForm } from "../QuoteFormProvider"
import { toast } from "sonner"

interface ModalEnterDataOfNotesProps {
    open: boolean
    setOpen: (value: boolean) => void
}

export function ModalEnterDataOfNotes({ open, setOpen }: ModalEnterDataOfNotesProps) {
    const { quoteItems, setQuoteItems } = useQuoteForm()
    const [fields, setFields] = useState<{ key: string; label: string }[]>([])
    const [values, setValues] = useState<Record<string, string>>({})
    const [itemsNeedingData, setItemsNeedingData] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [preview, setPreview] = useState("")

    useEffect(() => {
        if (!quoteItems?.length) return

        const regex = /\[[^\]]+\]/g
        const items = quoteItems.filter(
            (item: any) => typeof item.notes === "string" && regex.test(item.notes)
        )

        if (items.length > 0) {
            setItemsNeedingData(items)
            setCurrentIndex(0)
            setOpen(true)
        }
    }, [quoteItems, setOpen])

    useEffect(() => {
        if (!itemsNeedingData.length) return
        const item = itemsNeedingData[currentIndex]
        if (!item) return

        const regex = /\[([^\]]+)\]/g
        const foundLabels = new Set<string>()
        let match
        while ((match = regex.exec(item.notes)) !== null) {
            foundLabels.add(match[1].trim())
        }

        const newFields = Array.from(foundLabels).map((label) => ({
            key: label.toLowerCase().replace(/\s+/g, "_"),
            label,
        }))
        setFields(newFields)
        setValues({})
        setPreview(item.notes)
    }, [currentIndex, itemsNeedingData])

    const handleChange = (key: string, value: string) => {
        setValues((prev) => {
            const updated = { ...prev, [key]: value }
            updatePreview(updated)
            return updated
        })
    }

    const updatePreview = (currentValues: Record<string, string>) => {
        const currentItem = itemsNeedingData[currentIndex]
        if (!currentItem) return
        const regex = /\[([^\]]+)\]/g
        const updated = currentItem.notes.replace(regex, (_, label) => {
            const key = label.trim().toLowerCase().replace(/\s+/g, "_")
            return currentValues[key] || `[${label}]`
        })
        setPreview(updated)
    }

    const handleConfirm = () => {
        const currentItem = itemsNeedingData[currentIndex]
        if (!currentItem) return

        const regex = /\[([^\]]+)\]/g
        const newNotes = currentItem.notes.replace(regex, (_, label) => {
            const key = label.trim().toLowerCase().replace(/\s+/g, "_")
            return values[key] || `[${label}]`
        })

        const updatedItems = quoteItems.map((item: any) =>
            item === currentItem ? { ...item, notes: newNotes } : item
        )
        setQuoteItems(updatedItems)

        if (currentIndex < itemsNeedingData.length - 1) {
            setCurrentIndex((prev) => prev + 1)
        } else {
            setOpen(false)
        }
    }
    
    const handleClose = (value: boolean) => {
        if (!value) {
            const hasEmptyFields = fields.some((field) => !values[field.key]?.trim())

            if (hasEmptyFields) {
                toast.error("Please complete all fields before closing.")
                return // 
            }
        }
        setOpen(value)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {`Enter required data (${currentIndex + 1}/${itemsNeedingData.length})`}
                    </DialogTitle>
                    <DialogDescription>
                        {`Fill in the missing values for item #${currentIndex + 1}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-start gap-2">
                    <p className="font-bold">Text preview</p>
                    <div className="bg-gray-100 rounded-md p-3 text-sm border border-gray-300 font-mono whitespace-pre-wrap">
                        {preview}
                    </div>
                </div>

                <div className="space-y-4 py-4">
                    {fields.length > 0 ? (
                        fields.map((field) => (
                            <div key={field.key} className="space-y-1">
                                <Label htmlFor={field.key}>{field.label}</Label>
                                <Input
                                    id={field.key}
                                    value={values[field.key] || ""}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">No fields detected.</p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={()=> handleClose(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm}>
                        {currentIndex < itemsNeedingData.length - 1 ? "Next" : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
