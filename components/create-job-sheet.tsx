"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchReferenceData } from "@/lib/api-client"
import { County } from "@/types/TCounty"
import { toast } from "sonner"

interface CreateJobSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customSequentialNumber?: string
  onSuccess?: () => void
}

export function CreateJobSheet({ open, onOpenChange, customSequentialNumber, onSuccess }: CreateJobSheetProps) {
  // Form data
  const [formData, setFormData] = useState({
    customer: "",
    contractNumber: "",
    estimator: "",
    owner: "",
    county: "",
    township: "",
    division: "PUBLIC",
    lettingDate: "",
    startDate: "",
    endDate: "",
    srRoute: "",
    dbePercentage: "",
    workType: "",
    laborRate: "",
    fringeRate: "",
    shopRate: "",
  })
  
  // Dropdown data
  const [counties, setCounties] = useState<County[]>([])
  const [estimators, setEstimators] = useState<{ id: number; name: string }[]>([])
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([])
  const [contractors, setContractors] = useState<{ id: number; name: string }[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState({
    counties: false,
    estimators: false,
    owners: false,
    contractors: false,
  })
  
  const [openCounty, setOpenCounty] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, counties: true }))
        const countiesData = await fetchReferenceData("counties")
        setCounties(countiesData)
        setIsLoading((prev) => ({ ...prev, counties: false }))

        setIsLoading((prev) => ({ ...prev, estimators: true }))
        const estimatorsData = await fetchReferenceData("users")
        setEstimators(estimatorsData)
        setIsLoading((prev) => ({ ...prev, estimators: false }))

        setIsLoading((prev) => ({ ...prev, owners: true }))
        const ownersData = await fetchReferenceData("owners")
        setOwners(ownersData)
        setIsLoading((prev) => ({ ...prev, owners: false }))
        
        setIsLoading((prev) => ({ ...prev, contractors: true }))
        const contractorsData = await fetchReferenceData("contractors")
        setContractors(contractorsData)
        setIsLoading((prev) => ({ ...prev, contractors: false }))
      } catch (error) {
        console.error("Error fetching reference data:", error)
        setIsLoading({
          counties: false,
          estimators: false,
          owners: false,
          contractors: false,
        })
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleCountyChange = (countyId: string) => {
    const selectedCounty = counties.find(c => c.id.toString() === countyId)
    if (selectedCounty) {
      setFormData(prev => ({
        ...prev,
        county: countyId
      }))
      setOpenCounty(false)
    }
  }
  
  const getCountyName = () => {
    const selectedCounty = counties.find(c => c.id.toString() === formData.county)
    return selectedCounty ? selectedCounty.name : "Select county..."
  }

  const handleSubmit = async () => {
    try {
      
      if (!formData.customer || !formData.contractNumber || !formData.estimator || 
          !formData.owner || !formData.county || !formData.township || !formData.division) {
        return;
      }
      
      const requestData = {
        ...formData,
        customSequentialNumber: customSequentialNumber
      };
      
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create job');
      }
      
      const jobData = await response.json();
      toast.success(`Job created successfully: ${jobData.job_number}`);
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating job:', error);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto p-0">
        <div className="p-6 pb-0">
          <SheetTitle className="text-xl font-medium">Manual Job Creation</SheetTitle>
          <SheetDescription className="text-sm text-gray-500 mt-1">
            Fill in the required information to create a new job.
          </SheetDescription>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer" className="text-sm font-medium mb-1.5">Customer*</Label>
                <Select
                  value={formData.customer}
                  onValueChange={(value) => handleInputChange("customer", value)}
                >
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading.contractors ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : contractors.length > 0 ? (
                      contractors.map((contractor) => (
                        <SelectItem key={contractor.id} value={contractor.id.toString()}>
                          {contractor.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No customers found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contract-number" className="text-sm font-medium mb-1.5">Contract Number*</Label>
                <Input 
                  id="contract-number" 
                  placeholder="Enter contract number" 
                  className="h-10 border-gray-200"
                  value={formData.contractNumber}
                  onChange={(e) => handleInputChange("contractNumber", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimator" className="text-sm font-medium mb-1.5">Estimator*</Label>
                <Select
                  value={formData.estimator}
                  onValueChange={(value) => handleInputChange("estimator", value)}
                >
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder="Select estimator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading.estimators ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : estimators.length > 0 ? (
                      estimators.map((est) => (
                        <SelectItem key={est.id} value={est.id.toString()}>
                          {est.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No estimators found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="owner" className="text-sm font-medium mb-1.5">Owner*</Label>
                <Select
                  value={formData.owner}
                  onValueChange={(value) => handleInputChange("owner", value)}
                >
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder="Select owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading.owners ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : owners.length > 0 ? (
                      owners.map((own) => (
                        <SelectItem key={own.id} value={own.id}>
                          {own.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No owners found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="county" className="text-sm font-medium mb-1.5">County*</Label>
                <Popover
                  open={openCounty}
                  onOpenChange={setOpenCounty}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCounty}
                      className="w-full justify-between h-10 border-gray-200"
                    >
                      {getCountyName()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search county..." />
                      <CommandEmpty>No county found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {isLoading.counties ? (
                          <CommandItem disabled>Loading...</CommandItem>
                        ) : counties.length > 0 ? (
                          counties.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => handleCountyChange(c.id.toString())}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.county === c.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.name}
                            </CommandItem>
                          ))
                        ) : (
                          <CommandItem disabled>No counties found</CommandItem>
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="township" className="text-sm font-medium mb-1.5">Township*</Label>
                <Input 
                  id="township" 
                  placeholder="Enter township" 
                  className="h-10 border-gray-200"
                  value={formData.township}
                  onChange={(e) => handleInputChange("township", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="division" className="text-sm font-medium mb-1.5">Division*</Label>
                <Select
                  value={formData.division}
                  onValueChange={(value) => handleInputChange("division", value)}
                >
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder="Select division..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">PUBLIC (22)</SelectItem>
                    <SelectItem value="PRIVATE">PRIVATE (21)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="work-type" className="text-sm font-medium mb-1.5">Work Type</Label>
                <Select
                  value={formData.workType}
                  onValueChange={(value) => handleInputChange("workType", value)}
                >
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder="Select work type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RATED">RATED</SelectItem>
                    <SelectItem value="NON-RATED">NON-RATED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="letting-date" className="text-sm font-medium mb-1.5">Letting Date*</Label>
                <Input 
                  id="letting-date" 
                  type="date" 
                  className="h-10 border-gray-200"
                  value={formData.lettingDate}
                  onChange={(e) => handleInputChange("lettingDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="start-date" className="text-sm font-medium mb-1.5">Start Date*</Label>
                <Input 
                  id="start-date" 
                  type="date" 
                  className="h-10 border-gray-200"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-sm font-medium mb-1.5">End Date*</Label>
                <Input 
                  id="end-date" 
                  type="date" 
                  className="h-10 border-gray-200"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sr-route" className="text-sm font-medium mb-1.5">SR Route*</Label>
                <Input 
                  id="sr-route" 
                  placeholder="Enter SR route" 
                  className="h-10 border-gray-200"
                  value={formData.srRoute}
                  onChange={(e) => handleInputChange("srRoute", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dbe-percentage" className="text-sm font-medium mb-1.5">DBE %*</Label>
                <Input 
                  id="dbe-percentage" 
                  placeholder="Enter DBE %" 
                  className="h-10 border-gray-200"
                  value={formData.dbePercentage}
                  onChange={(e) => handleInputChange("dbePercentage", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="labor-rate" className="text-sm font-medium mb-1.5">Labor Rate*</Label>
                <Input 
                  id="labor-rate" 
                  placeholder="Enter labor rate" 
                  className="h-10 border-gray-200"
                  value={formData.laborRate}
                  onChange={(e) => handleInputChange("laborRate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fringe-rate" className="text-sm font-medium mb-1.5">Fringe Rate*</Label>
                <Input 
                  id="fringe-rate" 
                  placeholder="Enter fringe rate" 
                  className="h-10 border-gray-200"
                  value={formData.fringeRate}
                  onChange={(e) => handleInputChange("fringeRate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shop-rate" className="text-sm font-medium mb-1.5">Shop Rate*</Label>
                <Input 
                  id="shop-rate" 
                  placeholder="Enter shop rate" 
                  className="h-10 border-gray-200"
                  value={formData.shopRate}
                  onChange={(e) => handleInputChange("shopRate", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              Create
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
