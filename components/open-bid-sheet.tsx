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
  Check,
  ChevronsUpDown,
  Search,
} from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { createBid, updateBid, fetchReferenceData } from "@/lib/api-client"
import { toast } from "sonner"
import { County } from "@/types/TCounty"

interface OpenBidSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  job?: {
    id: number
    contractNumber: string
    status: string
    requestor: string
    owner: string
    lettingDate: string | null
    dueDate: string | null
    county: string
    branch: string
    createdAt: string
    location: string
    platform: string
  }
}

export function OpenBidSheet({ open, onOpenChange, onSuccess, job }: OpenBidSheetProps) {
  const [lettingDate, setLettingDate] = useState<Date>()
  const [dueDate, setDueDate] = useState<Date>()
  const [contractNumber, setContractNumber] = useState('')
  const [requestor, setRequestor] = useState('')
  const [owner, setOwner] = useState('')
  const [county, setCounty] = useState('')
  const [branch, setBranch] = useState('')
  const [location, setLocation] = useState('')
  const [platform, setPlatform] = useState('ecms')
  const [status, setStatus] = useState<'Bid' | 'No Bid' | 'Unset'>('Unset')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [users, setUsers] = useState<{id: string, name: string}[]>([])
  const [owners, setOwners] = useState<{id: string, name: string}[]>([])
  const [counties, setCounties] = useState<County[]>([])
  const [branches, setBranches] = useState<{id: string, name: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // State for popover open states
  const [openStates, setOpenStates] = useState({
    requestor: false,
    owner: false,
  })

  useEffect(() => {
    async function loadReferenceData() {
      setIsLoading(true)
      try {
        const [usersData, ownersData, countiesData] = await Promise.all([
          fetchReferenceData('users'),
          fetchReferenceData('owners'),
          fetchReferenceData('counties')
        ])
        
        setUsers(usersData)
        setOwners(ownersData)
        setCounties(countiesData)
        
        const branchNames = countiesData.map(county => county.branch)
        const uniqueBranchNames = Array.from(new Set(branchNames))
        const branchesData = uniqueBranchNames
          .filter((branchName): branchName is string => typeof branchName === 'string')
          .map(branchName => ({
            id: branchName.toLowerCase().replace(/\s+/g, '-'),
            name: branchName
          }))
        
        setBranches(branchesData)
        
        if (!job && usersData.length && ownersData.length && countiesData.length) {
          console.log(usersData[0]?.id)
          console.log(ownersData[0]?.id)
          console.log(countiesData[0]?.id)
          setRequestor(usersData[0]?.id)
          setOwner(ownersData[0]?.id)
          
          // Set county and automatically set branch based on county
          const initialCountyId = countiesData[0]?.id.toString()
          setCounty(initialCountyId)
          
          // Get branch from county
          const selectedCounty = countiesData.find(c => c.id.toString() === initialCountyId)
          if (selectedCounty?.branch) {
            const branchId = selectedCounty.branch.toLowerCase().replace(/\s+/g, '-')
            setBranch(branchId)
          }
        }
      } catch (error) {
        console.error('Error loading reference data:', error)
        toast.error('Failed to load form data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (open) {
      loadReferenceData()
    }
  }, [open, job])

  // Reset form when job changes
  useEffect(() => {
    if (job) {
      // Populate form with job data
      setContractNumber(job.contractNumber)
      setRequestor(job.requestor)
      setOwner(job.owner)
      setCounty(job.county)
      setBranch(job.branch)
      setLocation(job.location)
      setPlatform(job.platform)
      setStatus(job.status as 'Bid' | 'No Bid' | 'Unset')
      setLettingDate(job.lettingDate ? new Date(job.lettingDate) : undefined)
      setDueDate(job.dueDate ? new Date(job.dueDate) : undefined)
    } else {
      // Form will be reset with default values from the reference data
      setContractNumber('')
      setLocation('')
      setPlatform('ecms')
      setStatus('Unset')
      setLettingDate(undefined)
      setDueDate(undefined)
    }
  }, [job, open]) // Add open to dependencies to reset when sheet opens/closes
  
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
    console.log('Form submitted')
    
    const requiredFields = [
      { field: contractNumber, name: 'Contract number' },
      { field: requestor, name: 'Requestor' },
      { field: owner, name: 'Owner' },
      { field: county, name: 'County' },
      { field: branch, name: 'Branch' },
      { field: location, name: 'Location' },
      { field: platform, name: 'Platform' }
    ]
    
    for (const { field, name } of requiredFields) {
      if (!field) {
        console.log(`Missing field: ${name}`)
        toast.error(`${name} is required`)
        return
      }
    }
    
    try {
      setIsSubmitting(true)
      
      const today = new Date().toISOString().split('T')[0]
      
      const formattedLettingDate = lettingDate ? format(lettingDate, 'yyyy-MM-dd') : today
      const formattedDueDate = dueDate ? format(dueDate, 'yyyy-MM-dd') : today
      
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
        mpt: false,
        flagging: false,
        perm_signs: false,
        equipment_rental: false,
        other: false
      }
      
      try {
        if (job) {
          // Update existing bid
          console.log('Updating bid:', job.id, bidData)
          await updateBid(job.id, bidData)
          toast.success('Bid updated successfully')
        } else {
          // Create new bid
          console.log('Creating new bid:', bidData)
          await createBid(bidData)
          toast.success('Bid created successfully')
        }
      } catch (error) {
        console.error('API error:', error)
        throw error
      }
      
      onOpenChange(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating/updating bid:', error)
      toast.error(`Failed to ${job ? 'update' : 'create'} bid. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>{job ? 'Edit Open Bid' : 'Create a new Open Bid'}</SheetTitle>
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
                  <Popover
                    open={openStates.requestor}
                    onOpenChange={(open) => setOpenStates(prev => ({...prev, requestor: open}))}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openStates.requestor}
                        className="w-full justify-between text-left font-normal"
                        disabled={isLoading}
                      >
                        <span>
                          {requestor ? users.find(u => u.id === requestor)?.name || "Select requestor..." : "Select requestor..."}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Search requestor..." />
                        <CommandEmpty>No requestor found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {users.length > 0 ? (
                            users.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.name}
                                onSelect={() => {
                                  setRequestor(user.id);
                                  setOpenStates(prev => ({...prev, requestor: false}));
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    requestor === user.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {user.name}
                              </CommandItem>
                            ))
                          ) : (
                            <CommandItem disabled>Loading requestors...</CommandItem>
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 w-full">
                  <Label>Owner</Label>
                  <Popover
                    open={openStates.owner}
                    onOpenChange={(open) => setOpenStates(prev => ({...prev, owner: open}))}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-normal"
                        disabled={isLoading}
                      >
                        <span>
                          {owner ? owners.find(o => o.id === owner)?.name || "Select owner..." : "Select owner..."}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Command>
                        <CommandInput placeholder="Search owner..." />
                        <CommandEmpty>No owner found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {owners.length > 0 ? (
                            owners.map((ownerItem) => (
                              <CommandItem
                                key={ownerItem.id}
                                value={ownerItem.name}
                                onSelect={() => {
                                  setOwner(ownerItem.id);
                                  setOpenStates(prev => ({...prev, owner: false}));
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    owner === ownerItem.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {ownerItem.name}
                              </CommandItem>
                            ))
                          ) : (
                            <CommandItem disabled>Loading owners...</CommandItem>
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Branch is automatically set based on county */}

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
                        className="w-full justify-between text-left font-normal"
                      >
                        <span>
                          {dueDate ? format(dueDate, "PPP") : "Select date"}
                        </span>
                        <CalendarIcon className="h-4 w-4 opacity-50 ml-2" />
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
                  <Popover>
                    <PopoverTrigger asChild disabled={isLoading}>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between text-left font-normal"
                      >
                        <span>
                          {county && counties.find(c => c.id.toString() === county)
                            ? counties.find(c => c.id.toString() === county)?.name
                            : "Select county..."}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search county..." className="h-9" />
                        <CommandEmpty>No county found.</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {counties.length > 0 ? (
                              counties.map((countyItem) => (
                                <CommandItem
                                  key={countyItem.id}
                                  value={countyItem.name}
                                  onSelect={() => {
                                    const countyId = countyItem.id.toString();
                                    setCounty(countyId);
                                    // Auto-set branch based on county
                                    if (countyItem.branch) {
                                      const branchId = countyItem.branch.toLowerCase().replace(/\s+/g, '-');
                                      setBranch(branchId);
                                    }
                                  }}
                                >
                                  {countyItem.name}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      county === countyItem.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))
                            ) : (
                              <CommandItem disabled>Loading counties...</CommandItem>
                            )}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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

          <div className="p-6 pt-0">
            <div className="flex justify-between gap-4">
              <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                type="submit" 
                disabled={isSubmitting}
                onClick={(e) => {
                  console.log('Submit button clicked')
                  if (!isSubmitting) {
                    handleSubmit(e as unknown as React.FormEvent)
                  }
                }}
              >
                {isSubmitting ? (job ? "Updating..." : "Creating...") : (job ? "Update" : "Create")}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
