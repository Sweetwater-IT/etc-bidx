"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MapPinIcon,
  LayersIcon,
  GlobeIcon,
  HashIcon,
  UserIcon,
  CalendarIcon,
  Loader2Icon,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { useState, FormEvent } from "react"
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
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    branch: "Main",
    contract_number: "",
    county: "",
    location: "",
    owner: "PENNDOT",
    platform: "ECMS",
    requestor: "",
    mpt: false,
    flagging: false,
    perm_signs: false,
    equipment_rental: false,
    other: false,
    dbe_percentage: null as number | null,
  })
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  }
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : parseFloat(e.target.value);
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!dueDate || !lettingDate) {
      toast.error("Please select both due date and letting date");
      return;
    }
    
    if (!formData.contract_number || !formData.requestor || !formData.county) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Check if due date is after letting date (violates constraint)
    if (dueDate > lettingDate) {
      toast.error("Due date must be on or before the letting date");
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for submission
      const today = new Date();
      const bidData = {
        ...formData,
        due_date: dueDate.toISOString(),
        letting_date: lettingDate.toISOString(),
        entry_date: today.toISOString().split('T')[0],
        status: 'Unset' as const,
      };
      
      // Submit to API
      await createBid(bidData);
      
      // Reset form
      setFormData({
        branch: "Main",
        contract_number: "",
        county: "",
        location: "",
        owner: "PENNDOT",
        platform: "ECMS",
        requestor: "",
        mpt: false,
        flagging: false,
        perm_signs: false,
        equipment_rental: false,
        other: false,
        dbe_percentage: null,
      });
      setDueDate(undefined);
      setLettingDate(undefined);
      
      // Show success message
      toast.success("Bid created successfully");
      
      // Close the sheet
      onOpenChange(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating bid:", error);
      toast.error("Failed to create bid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-screen-lg sm:w-full md:w-3/4 flex flex-col p-0" style={{width: "25%"}}>
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Create a new Open Bid</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label htmlFor="contract_number">Contract Number <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="contract_number"
                      name="contract_number" 
                      value={formData.contract_number} 
                      onChange={handleInputChange} 
                      placeholder="Contract Number" 
                      className="pl-9" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2 w-full">
                  <Label htmlFor="requestor">Requestor <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="requestor"
                      name="requestor" 
                      value={formData.requestor} 
                      onChange={handleInputChange} 
                      placeholder="Requestor" 
                      className="pl-9" 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label htmlFor="owner">Owner</Label>
                  <Select 
                    value={formData.owner} 
                    onValueChange={(value) => handleSelectChange("owner", value)}
                  >
                    <SelectTrigger id="owner" className="w-full pl-9 relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENNDOT">PENNDOT</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <Label htmlFor="platform">Platform</Label>
                  <Select 
                    value={formData.platform} 
                    onValueChange={(value) => handleSelectChange("platform", value)}
                  >
                    <SelectTrigger id="platform" className="w-full pl-9 relative">
                      <LayersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECMS">ECMS</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <Label htmlFor="letting_date">Letting Date <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="letting_date"
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
                  <Label htmlFor="due_date">Due Date <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="due_date"
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
                  <Label htmlFor="county">County <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.county} 
                    onValueChange={(value) => handleSelectChange("county", value)}
                  >
                    <SelectTrigger id="county" className="w-full pl-9 relative">
                      <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="County" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Allegheny">Allegheny</SelectItem>
                      <SelectItem value="Philadelphia">Philadelphia</SelectItem>
                      <SelectItem value="Montgomery">Montgomery</SelectItem>
                      <SelectItem value="Bucks">Bucks</SelectItem>
                      <SelectItem value="Delaware">Delaware</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="location"
                      name="location" 
                      value={formData.location} 
                      onChange={handleInputChange} 
                      placeholder="Location" 
                      className="pl-9" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Services Required <span className="text-red-500">*</span></Label>
                  <p className="text-sm text-muted-foreground">Select all that apply</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mpt" 
                      checked={formData.mpt} 
                      onCheckedChange={(checked) => handleCheckboxChange("mpt", checked === true)} 
                    />
                    <Label htmlFor="mpt">MPT</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="flagging" 
                      checked={formData.flagging} 
                      onCheckedChange={(checked) => handleCheckboxChange("flagging", checked === true)} 
                    />
                    <Label htmlFor="flagging">Flagging</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="perm_signs" 
                      checked={formData.perm_signs} 
                      onCheckedChange={(checked) => handleCheckboxChange("perm_signs", checked === true)} 
                    />
                    <Label htmlFor="perm_signs">Perm Signs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="equipment_rental" 
                      checked={formData.equipment_rental} 
                      onCheckedChange={(checked) => handleCheckboxChange("equipment_rental", checked === true)} 
                    />
                    <Label htmlFor="equipment_rental">Equipment Rental</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="other" 
                      checked={formData.other} 
                      onCheckedChange={(checked) => handleCheckboxChange("other", checked === true)} 
                    />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 w-full">
                <Label htmlFor="dbe_percentage">DBE Percentage</Label>
                <Input 
                  id="dbe_percentage"
                  name="dbe_percentage" 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={formData.dbe_percentage ?? ''} 
                  onChange={handleNumberChange} 
                  placeholder="0.00" 
                />
              </div>
            </div>
          </div>

          <div className="border-t p-6 mt-auto">
            <div className="flex justify-between gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => onOpenChange(false)} 
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Bid"
                )}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
