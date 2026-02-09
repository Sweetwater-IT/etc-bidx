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

interface CreateActiveBidSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateActiveBidSheet({ open, onOpenChange }: CreateActiveBidSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Create Active Bid</SheetTitle>
          <SheetDescription>
            Add a new active bid to your list.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4 px-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Enter bid title" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" placeholder="Enter company name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="Enter location" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget">Budget</Label>
            <Input id="budget" placeholder="Enter budget" type="number" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" type="date" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Enter bid description" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Create Bid
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 