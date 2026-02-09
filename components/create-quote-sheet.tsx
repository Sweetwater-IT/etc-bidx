import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateQuoteSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateQuoteSheet({ open, onOpenChange }: CreateQuoteSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Create Quote</SheetTitle>
          <SheetDescription>
            Create a new quote with the following details.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4 px-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Quote Title</Label>
            <Input id="title" placeholder="Enter quote title" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client">Client</Label>
            <Input id="client" placeholder="Enter client name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Quote Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select quote type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Value</Label>
            <Input id="value" type="number" placeholder="Enter quote value" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="validity">Validity (days)</Label>
            <Input id="validity" type="number" placeholder="Enter validity period" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Enter quote description" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 px-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Create Quote
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 