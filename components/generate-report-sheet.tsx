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

interface GenerateReportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerateReportSheet({ open, onOpenChange }: GenerateReportSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Generate Report</SheetTitle>
          <SheetDescription>
            Create a new report with the following details.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4 px-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Report Title</Label>
            <Input id="title" placeholder="Enter report title" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Report Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Performance Report</SelectItem>
                <SelectItem value="financial">Financial Report</SelectItem>
                <SelectItem value="progress">Progress Report</SelectItem>
                <SelectItem value="summary">Summary Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="period">Reporting Period</Label>
            <div className="flex items-center gap-2">
              <Input id="startDate" type="date" />
              <span className="text-sm text-muted-foreground">-</span>
              <Input id="endDate" type="date" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="format">Report Format</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="word">Word</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Enter report description" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 px-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Generate Report
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 