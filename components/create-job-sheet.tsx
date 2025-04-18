"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CreateJobSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateJobSheet({ open, onOpenChange }: CreateJobSheetProps) {
  const [contractNumber, setContractNumber] = useState("")
  const [requestor, setRequestor] = useState("")
  const [owner, setOwner] = useState("")
  const [county, setCounty] = useState("")
  const [branch, setBranch] = useState("")
  const [status, setStatus] = useState("")

  const handleSubmit = () => {
    // TODO: Implement form submission
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Create Job</SheetTitle>
          <SheetDescription>
            Add a new job to the system. Fill in all the required information below.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contractNumber">Contract Number</Label>
                <Input
                  id="contractNumber"
                  placeholder="Enter contract number"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="requestor">Requestor</Label>
                <Input
                  id="requestor"
                  placeholder="Enter requestor name"
                  value={requestor}
                  onChange={(e) => setRequestor(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  placeholder="Enter owner name"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    placeholder="Enter county"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="south-florida">South Florida</SelectItem>
                      <SelectItem value="west">West</SelectItem>
                      <SelectItem value="turbotville">Turbotville</SelectItem>
                      <SelectItem value="hatfield">Hatfield</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t p-6">
          <Button onClick={handleSubmit} className="w-full">Create Job</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 