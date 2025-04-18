"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CalendarIcon,
  UserIcon,
  HashIcon,
  MapPinIcon,
  LayersIcon,
  GlobeIcon,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { useState } from "react"

interface OpenBidSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OpenBidSheet({ open, onOpenChange }: OpenBidSheetProps) {
  const [lettingDate, setLettingDate] = useState<Date>()
  const [dueDate, setDueDate] = useState<Date>()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Create a new Open Bid</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 w-full">
                <Label>Contract Number <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Contract Number" className="pl-9" />
                </div>
              </div>

              <div className="space-y-2 w-full">
                <Label>Requestor <span className="text-red-500">*</span></Label>
                <Select>
                  <SelectTrigger className="w-full pl-9 relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Requestor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john">John Doe</SelectItem>
                    <SelectItem value="jane">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <Label>Owner</Label>
                <Select defaultValue="penndot">
                  <SelectTrigger className="w-full pl-9 relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="penndot">PENNDOT</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <Label>Platform</Label>
                <Select defaultValue="ecms">
                  <SelectTrigger className="w-full pl-9 relative">
                    <LayersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecms">ECMS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <Label>Letting Date <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal"
                    >
                      <span>
                        {lettingDate ? format(lettingDate, "PPP") : "Select date"}
                      </span>
                      <CalendarIcon className="h-4 w-4 opacity-50 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={lettingDate} onSelect={setLettingDate} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 w-full">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal"
                    >
                      <span>
                        {dueDate ? format(dueDate, "PPP") : "Select date"}
                      </span>
                      <CalendarIcon className="h-4 w-4 opacity-50 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 w-full">
                <Label>County <span className="text-red-500">*</span></Label>
                <Select>
                  <SelectTrigger className="w-full pl-9 relative">
                    <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="County" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allegheny">Allegheny</SelectItem>
                    <SelectItem value="philadelphia">Philadelphia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <Label>Location</Label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Location" className="pl-9" />
                </div>
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Services Required <span className="text-red-500">*</span></Label>
              <p className="text-sm text-muted-foreground">Select all that apply</p>
              <div className="flex flex-wrap gap-4">
                {["MPT", "Flagging", "Perm Signs", "Equipment Rental", "Other"].map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox id={service} />
                    <Label htmlFor={service}>{service}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t p-6">
          <div className="flex justify-between gap-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1" type="submit">Create</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
