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

export function ModalEnterDataOfNotes({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { quoteItems, setQuoteItems } = useQuoteForm()
  const [itemsNeedingData, setItemsNeedingData] = useState<any[]>([])
  const [values, setValues] = useState<Record<string, Record<string, string>>>({})
  const [openAccordion, setOpenAccordion] = useState<string>("")

  useEffect(() => {
    if (!quoteItems?.length) return
    const regex = /\[(?:enter|insert)[^\]]*\]/gi
    const items = quoteItems.filter((item: any) => typeof item.notes === "string" && regex.test(item.notes))
    if (items.length > 0) {
      setItemsNeedingData(items)
      setOpen(true)
    }
  }, [quoteItems, setOpen])

  const extractLabels = (text: string) => {
    const regex = /\[(?:enter|insert)[^\]]*\]/gi
    const labels: string[] = []
    let match
    let index = 0
    while ((match = regex.exec(text)) !== null) {
      const cleanLabel = match[0].replace(/[\[\]]/g, "").trim()
      // agregar un índice único aunque el texto sea igual
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
      if (!itemsNeedingData.find((i) => i === item)) return item
      const regex = /\[(?:enter|insert)[^\]]*\]/gi
      const itemValues = values[item.id] || {}
      let i = 0
      return {
        ...item,
        notes: item.notes.replace(regex, (match) => {
          const labelKey = `${match.replace(/[\[\]]/g, "").trim()}__${i}`
          i++
          return itemValues[labelKey]?.trim() || match
        }),
      }
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Enter Required Data</DialogTitle>
          <DialogDescription>
            Fill in the missing values for each quote item.
          </DialogDescription>
        </DialogHeader>

        {itemsNeedingData.length > 0 ? (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
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
                  <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline px-4">
                      <div className="flex items-center gap-3 text-left">
                        {allFilled ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-semibold text-foreground">{item.itemNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.description || "No description"}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-2 space-y-4">
                      <div className="bg-muted/50 rounded-md border p-4 text-sm leading-relaxed text-foreground font-mono whitespace-pre-wrap">
                        {getFilledPreview(item)}
                      </div>
                      {labels.map((label, index) => {
                        const displayLabel = label.replace(/__\d+$/, "")
                        const val = vals[label] || ""
                        return (
                          <div key={label} className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">{displayLabel}</span>
                            <Input
                              value={val}
                              onChange={(e) => handleChange(item.id, label, e.target.value)}
                              placeholder={`Enter ${displayLabel.toLowerCase()}`}
                            />
                          </div>
                        )
                      })}
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
                Confirm ({completedCount}/{totalCount})
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
