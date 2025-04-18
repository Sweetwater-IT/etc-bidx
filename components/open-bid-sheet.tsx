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
import { createBid } from "@/lib/api-client"
import { toast } from "sonner"

interface OpenBidSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function OpenBidSheet({ open, onOpenChange, onSuccess }: OpenBidSheetProps) {
  const [lettingDate, setLettingDate] = useState<Date>()
  const [dueDate, setDueDate] = useState<Date>()
  const [contractNumber, setContractNumber] = useState('')
  const [requestor, setRequestor] = useState('john-doe') // Set default value
  const [owner, setOwner] = useState('penndot') // Set default value
  const [county, setCounty] = useState('allegheny') // Set default value
  const [branch, setBranch] = useState('construction') // Set default value
  const [location, setLocation] = useState('')
  const [platform, setPlatform] = useState('ecms') // Set default value
  const [status, setStatus] = useState<'Bid' | 'No Bid' | 'Unset'>('Unset')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setContractNumber('')
      setRequestor('')
      setOwner('')
      setCounty('')
      setBranch('')
      setLocation('')
      setPlatform('')
      setStatus('Unset')
      setLettingDate(undefined)
      setDueDate(undefined)
    }
    onOpenChange(open)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted');
    
    const requiredFields = [
      { field: contractNumber, name: 'Contract number' },
      { field: requestor, name: 'Requestor' },
      { field: owner, name: 'Owner' },
      { field: county, name: 'County' },
      { field: branch, name: 'Branch' },
      { field: location, name: 'Location' },
      { field: platform, name: 'Platform' }
    ];
    
    for (const { field, name } of requiredFields) {
      if (!field) {
        console.log(`Missing field: ${name}`);
        toast.error(`${name} is required`);
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      const formattedLettingDate = lettingDate ? format(lettingDate, 'yyyy-MM-dd') : today;
      const formattedDueDate = dueDate ? format(dueDate, 'yyyy-MM-dd') : today;
      
      const bidData = {
        contract_number: contractNumber,
        requestor,
        owner,
        county,
        branch,
        location,
        platform,
        status,
        letting_date: formattedLettingDate,
        due_date: formattedDueDate,
        entry_date: today,
        // Add default values for optional fields
        mpt: false,
        flagging: false,
        perm_signs: false,
        equipment_rental: false,
        other: false
      }
      
      try {
        const result = await createBid(bidData);
        console.log('API response:', result);
        
        toast.success('Bid created successfully');
      } catch (error) {
        console.error('API error:', error);
        throw error; // Re-throw to be caught by the outer try/catch
      }
      
      onOpenChange(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating bid:', error)
      toast.error('Failed to create bid. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Create a new Open Bid</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label>Contract Number <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Contract Number" 
                      className="pl-9" 
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

              <div className="space-y-2 w-full">
                <Label>Requestor <span className="text-red-500">*</span></Label>
                <Select value={requestor} onValueChange={setRequestor}>
                  <SelectTrigger className="w-full pl-9 relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a requestor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-doe">John Doe</SelectItem>
                    <SelectItem value="jane-smith">Jane Smith</SelectItem>
                    <SelectItem value="alex-johnson">Alex Johnson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <Label>Owner</Label>
                <Select value={owner} onValueChange={setOwner}>
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
                <Label>Branch</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger className="w-full pl-9 relative">
                    <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
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
                      className="w-full pl-9 relative justify-start text-left font-normal"
                    >
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      {dueDate ? format(dueDate, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 w-full">
                <Label>County <span className="text-red-500">*</span></Label>
                <Select value={county} onValueChange={setCounty}>
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
                  <Input 
                    placeholder="Location" 
                    className="pl-9" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Status <span className="text-red-500">*</span></Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'Bid' | 'No Bid' | 'Unset')}>
                <SelectTrigger className="w-full pl-9 relative">
                  <LayersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bid">Bid</SelectItem>
                  <SelectItem value="No Bid">No Bid</SelectItem>
                  <SelectItem value="Unset">Unset</SelectItem>
                </SelectContent>
              </Select>
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
            <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button 
              className="flex-1" 
              type="submit" 
              disabled={isSubmitting}
              onClick={(e) => {
                console.log('Submit button clicked');
                if (!isSubmitting) {
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
