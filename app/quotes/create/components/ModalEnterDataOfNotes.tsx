'use client'

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Circle } from "lucide-react"
import { toast } from "sonner"
import { useQuoteForm } from "../QuoteFormProvider"
import NotesInputs from "@/components/pages/active-bid/steps/NotesInput"

export function ModalEnterDataOfNotes({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
    const { quoteItems, setQuoteItems } = useQuoteForm()
    const [itemsNeedingData, setItemsNeedingData] = useState<any[]>([])
    const [values, setValues] = useState<Record<string, Record<string, string>>>({})
    const [openAccordion, setOpenAccordion] = useState<string>("")
    const [editedNotes, setEditedNotes] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!quoteItems?.length) return
        const regex = /\[(?:enter|insert)[^\]]*\]/gi
        const items = quoteItems.filter((item: any) => typeof item.notes === "string" && regex.test(item.notes))
        if (items.length > 0) {
            setItemsNeedingData(items)
            setOpen(true)
            setEditedNotes(
                Object.fromEntries(items.map((i) => [i.id, i.notes]))
            )
        }
    }, [quoteItems, setOpen])

    const extractLabels = (text: string) => {
        const regex = /\[(?:enter|insert)[^\]]*\]/gi
        const labels: string[] = []
        let match
        let index = 0
        while ((match = regex.exec(text)) !== null) {
            const cleanLabel = match[0].replace(/[\[\]]/g, "").trim()
            labels.push(`${cleanLabel}__${index}`)
            index++
        }
        return labels
    }

    const handleChange = (itemId: string, key: string, value: string) => {
        setValues((prev) => ({
            ...prev,
            [itemId]: { ...(prev[itemId] || {}), [key]: value },
        }))
    }

    const getFilledPreview = (item: any) => {
        const regex = /\[(?:enter|insert)[^\]]*\]/gi
        const itemValues = values[item.id] || {}
        let i = 0
        return item.notes.replace(regex, (match) => {
            const labelKey = `${match.replace(/[\[\]]/g, "").trim()}__${i}`
            i++
            return itemValues[labelKey]?.trim() || match
        })
    }

    const isItemCompleted = (item: any) => {
        const labels = extractLabels(item.notes)
        const vals = values[item.id] || {}
        return labels.every((label) => {
            const val = vals[label]?.trim() || ""
            return val && !/enter|insert/i.test(val)
        })
    }

    const handleSave = () => {
        const allCompleted = itemsNeedingData.every(isItemCompleted)
        if (!allCompleted) {
            toast.error("Please complete all fields before saving.")
            return
        }

        const updatedItems = quoteItems.map((item: any) => {
            const newText = editedNotes[item.id] || item.notes
            return { ...item, notes: newText }
        })

        setQuoteItems(updatedItems)
        setOpen(false)
    }

    const completedCount = itemsNeedingData.filter(isItemCompleted).length
    const totalCount = itemsNeedingData.length
    const progressPercentage = totalCount ? (completedCount / totalCount) * 100 : 0

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) {
                    const allCompleted = itemsNeedingData.every(isItemCompleted)
                    if (!allCompleted) {
                        toast.error("Please complete all fields before closing.")
                        return
                    }
                }
                setOpen(value)
            }}
        >
            <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Add Notes to Quote Items</DialogTitle>
                    <DialogDescription>
                        Fill out the note details for each maintenance and protection of traffic item
                    </DialogDescription>
                </DialogHeader>

                {itemsNeedingData.length > 0 ? (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-md">
                                <span className="font-medium text-foreground">Progress</span>
                                <span className="text-muted-foreground">
                                    {completedCount} of {totalCount} completed
                                </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                        </div>

                        <Accordion
                            type="single"
                            collapsible
                            value={openAccordion}
                            onValueChange={setOpenAccordion}
                            className="space-y-2"
                        >
                            {itemsNeedingData.map((item: any) => {
                                const labels = extractLabels(item.notes)
                                const vals = values[item.id] || {}
                                const allFilled = isItemCompleted(item)

                                return (
                                    <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-2 bg-card">
                                        <AccordionTrigger className="hover:no-underline px-2">
                                            <div className="flex items-center gap-3 text-left">
                                                {allFilled ? (
                                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                                ) : (
                                                    <Circle className="h-8 w-8 text-muted-foreground" />
                                                )}
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-semibold text-foreground text-[20px]">{item.itemNumber}</div>
                                                    <div className="text-sm text-muted-foreground text-[16px]">
                                                        {item.description || "No description"}
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 pb-2 px-3 space-y-4">
                                            <p className="mb-2">Notes</p>
                                            <div className="border-gray-300 border bg-muted/50 p-4 rounded-md">
                                                <NotesInputs
                                                    value={editedNotes[item.id] || item.notes}
                                                    onChange={(newText) => {
                                                        setEditedNotes((prev) => ({ ...prev, [item.id]: newText }))

                                                        const regex = /\[(?:enter|insert)[^\]]*\]/gi
                                                        const matchesOriginal = [...item.notes.matchAll(regex)]
                                                        const matchesNew = [...newText.matchAll(/\[(.*?)\]/g)]

                                                        const updatedValues: Record<string, string> = {}
                                                        matchesOriginal.forEach((match, i) => {
                                                            const key = `${match[0].replace(/[\[\]]/g, "").trim()}__${i}`
                                                            updatedValues[key] = matchesNew[i]?.[1] || ""
                                                        })

                                                        setValues((prev) => ({
                                                            ...prev,
                                                            [item.id]: { ...(prev[item.id] || {}), ...updatedValues },
                                                        }))
                                                    }}
                                                />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={completedCount !== totalCount}>
                                Save Notes ({completedCount}/{totalCount})
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <p className="text-center py-6 text-sm text-muted-foreground">No fields detected.</p>
                )}
            </DialogContent>
        </Dialog>
    )
}
