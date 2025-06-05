'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

interface SignOrder {
  id: number;
  requestor: string;
  contractor_id: number;
  contractors?: { name: string };
  branch?: string;
  order_date: string;
  need_date: string;
  start_date: string;
  end_date: string;
  job_number: string;
  contract_number: string;
  sale: boolean;
  rental: boolean;
  perm_signs: boolean;
  status: string;
  assigned_to?: string;
}

interface SignItem {
  id: number;
  designation: string;
  description: string;
  width: number;
  height: number;
  quantity: number;
  sheeting: string;
  structure: string;
  stiffner: string;
  assigned_to: string;
  in_stock: number;
  order: number;
  make: number;
  bLights: number;
  covers: number;
  substrate?: string;
  includeCover?: boolean;
  includeStiffener?: boolean;
  isCustom?: boolean;
}

// Helper function to determine branch based on ID (temporary solution)
const determineBranch = (id: number): string => {
  if (id < 100) return 'Hatfield';
  if (id < 200) return 'Turbotville';
  if (id < 300) return 'Bedford';
  return 'Archived';
};

export default function SignOrderTrackerPage() {
  const params = useParams();
  const router = useRouter();
  const [signOrder, setSignOrder] = useState<SignOrder | null>(null);
  const [signItems, setSignItems] = useState<SignItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isCustomSign, setIsCustomSign] = useState(false);
  const [newSign, setNewSign] = useState<SignItem>({
    id: 0,
    designation: '',
    description: '',
    width: 0,
    height: 0,
    quantity: 1,
    sheeting: 'DG',
    structure: 'LOOSE',
    stiffner: 'None',
    assigned_to: '',
    in_stock: 0,
    order: 0,
    make: 0,
    bLights: 0,
    covers: 0,
    substrate: 'Aluminum',
    includeCover: false,
    includeStiffener: false
  });
  const [loading, setLoading] = useState(true);
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [needDate, setNeedDate] = useState<Date | undefined>(undefined);

  // Dropdown open states
  const [openRequestor, setOpenRequestor] = useState(false);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [openBranch, setOpenBranch] = useState(false);

  // Order type checkboxes state
  const [isSale, setIsSale] = useState(false);
  const [isRental, setIsRental] = useState(false);
  const [isPermanent, setIsPermanent] = useState(false);

  // Dummy data for dropdowns - would be fetched from API in real implementation
  const requestors = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Robert Johnson' },
    { id: 4, name: 'Emily Davis' }
  ];

  const customers = [
    { id: 1, name: 'Acme Corporation' },
    { id: 2, name: 'Wayne Enterprises' },
    { id: 3, name: 'Stark Industries' },
    { id: 4, name: 'Umbrella Corporation' }
  ];

  const branches = [
    { id: 1, name: 'All' },
    { id: 2, name: 'Hatfield' },
    { id: 3, name: 'Turbotville' },
    { id: 4, name: 'Bedford' },
    { id: 5, name: 'Archived' }
  ];

  useEffect(() => {
    const fetchSignOrder = async () => {
      try {
        if (!params || !params.id) {
          console.error('No sign order ID provided');
          return;
        }

        console.log(`Fetching sign order with ID: ${params.id}`);
        const response = await fetch(`/api/sign-orders/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          console.error('API response not OK:', response.status, data);
          throw new Error(`Failed to fetch sign order: ${data.message || response.statusText}`);
        }

        console.log('Sign order data:', data);
        if (!data.success || !data.data) {
          console.error('Invalid API response format:', data);
          throw new Error('Invalid API response format');
        }

        // Add branch information based on ID ranges (temporary solution)
        // This would be replaced with actual branch data from the API
        const orderWithBranch = {
          ...data.data,
          branch: determineBranch(data.data.id)
        };

        setSignOrder(orderWithBranch);

        // Set dates if available
        if (data.data.order_date) {
          setOrderDate(new Date(data.data.order_date));
        }
        if (data.data.need_date) {
          setNeedDate(new Date(data.data.need_date));
        }

        // Set order type checkboxes based on data
        if (data.data.sale) setIsSale(true);
        if (data.data.rental) setIsRental(true);
        if (data.data.perm_signs) setIsPermanent(true);

        // Extract sign items from the signs JSON field
        if (data.data.signs) {
          try {
            // The signs field is a JSON object where each key is a sign ID
            // and the value is the sign data
            const signsData = data.data.signs;

            // Convert the signs object to an array of SignItem objects
            const signItemsArray = Object.entries(signsData).map(([id, signData]: [string, any], index) => {
              return {
                id: index + 1, // Generate sequential IDs
                designation: signData.designation || signData.mutcd || 'N/A',
                description: signData.description || 'N/A',
                width: signData.width || 0,
                height: signData.height || 0,
                quantity: signData.quantity || 1,
                sheeting: signData.sheeting || 'N/A',
                structure: signData.structure || 'N/A',
                stiffner: signData.stiffner || 'None',
                assigned_to: signData.assigned_to || 'Unassigned',
                in_stock: Number(signData.in_stock) || 0,
                order: Number(signData.order) || 0,
                make: Number(signData.make) || 0,
                bLights: Number(signData.bLights) || 0,
                covers: Number(signData.covers) || 0
              };
            });

            setSignItems(signItemsArray);
            console.log('Loaded sign items from database:', signItemsArray);
          } catch (error) {
            console.error('Error parsing signs data:', error);
            // Fallback to empty array if there's an error parsing the signs data
            setSignItems([]);
          }
        } else {
          console.log('No signs data found in the sign order');
          setSignItems([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching sign order:', error);
        setLoading(false);
      }
    };

    if (params && params.id) {
      fetchSignOrder();
    }
  }, [params]);

  const handleExport = () => {
    // Export functionality would go here
    alert('Export functionality not implemented yet');
  };

  const handleSubmitOrder = async () => {
    if (!signOrder) return;

    try {
      setLoading(true);

      const updatedSignItems = [...signItems];
      if (showAddForm && newSign.designation) {
        updatedSignItems.push(newSign);
        setSignItems(updatedSignItems);
        setShowAddForm(false);
      }

      // Convert the sign items array to the expected signs object format
      const signsObject = updatedSignItems.reduce((acc, item) => {
        acc[item.id.toString()] = {
          designation: item.designation,
          description: item.description,
          width: item.width,
          height: item.height,
          quantity: item.quantity,
          sheeting: item.sheeting,
          structure: item.structure,
          stiffner: item.stiffner,
          assigned_to: item.assigned_to,
          in_stock: item.in_stock,
          order: item.order,
          make: item.make,
          bLights: item.bLights,
          covers: item.covers,
          substrate: item.substrate,
          includeCover: item.includeCover,
          includeStiffener: item.includeStiffener
        };
        return acc;
      }, {});

      // Log the ID being used
      console.log('Submitting order with ID:', params?.id);
      
      // Use our new API endpoint that doesn't include the assigned_to field
      const response = await fetch(`/api/sign-orders/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: params?.id,
          signs: signsObject,
          status: 'in-process', // Update the order status to in-process
          submitted_at: new Date().toISOString(), // Add submission timestamp
          assigned_to: signOrder.assigned_to // Include the assigned_to field
        })
      });

      const result = await response.json();
      
      console.log('API response:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit sign order');
      }
      
      // Log success message
      console.log('Successfully submitted order with ID:', params?.id, 'Status changed to in-process');

      setLoading(false);

      // Show success toast message
      toast.success('Order submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting sign order:', error);
      setLoading(false);
      toast.error(`Error: ${error.message || 'Failed to submit sign order'}`);
    }
  };

  const handleAddNewSign = () => {
    // Toggle the form visibility
    setShowAddForm(true);
    setIsCustomSign(false);

    // Reset the new sign form
    setNewSign({
      id: signItems.length + 1,
      designation: '',
      description: '',
      width: 0,
      height: 0,
      quantity: 1,
      sheeting: 'DG',
      structure: 'LOOSE',
      stiffner: 'None',
      assigned_to: '',
      in_stock: 0,
      order: 0,
      make: 0,
      bLights: 0,
      covers: 0,
      substrate: 'Aluminum',
      includeCover: false,
      includeStiffener: false
    });
  };

  const handleSaveNewSign = () => {
    if (!signOrder) return;

    // Create a new sign object with all properties
    const signToAdd: SignItem = {
      id: newSign.id,
      designation: newSign.designation,
      description: newSign.description,
      width: newSign.width,
      height: newSign.height,
      quantity: newSign.quantity,
      sheeting: newSign.sheeting,
      structure: newSign.structure,
      stiffner: newSign.stiffner || 'None',
      assigned_to: newSign.assigned_to || '',
      in_stock: newSign.in_stock,
      order: newSign.order,
      make: newSign.make,
      bLights: newSign.bLights,
      covers: newSign.covers,
      substrate: newSign.substrate,
      includeCover: newSign.includeCover,
      includeStiffener: newSign.includeStiffener
    };

    // Add the new sign to the signItems array
    const updatedSignItems = [...signItems, signToAdd];

    // Update the state
    setSignItems(updatedSignItems);

    // Hide the form
    setShowAddForm(false);
  };

  const handleCancelAddSign = () => {
    // Hide the form without saving
    setShowAddForm(false);
  };

  const handleGenerate = () => {
    // Generate functionality would go here
    alert('Generate functionality not implemented yet');
  };

  const handleSaveChanges = async () => {
    if (!signOrder) return;

    try {
      setLoading(true);

      // If we're currently adding a new sign, save it first
      const updatedSignItems = [...signItems];
      if (showAddForm && newSign.designation) {
        updatedSignItems.push(newSign);
        setSignItems(updatedSignItems);
        setShowAddForm(false);
      }

      // Convert the sign items array to the expected signs object format
      const signsObject = updatedSignItems.reduce((acc, item) => {
        acc[item.id.toString()] = {
          designation: item.designation,
          description: item.description,
          width: item.width,
          height: item.height,
          quantity: item.quantity,
          sheeting: item.sheeting,
          structure: item.structure,
          stiffner: item.stiffner,
          assigned_to: item.assigned_to,
          in_stock: item.in_stock,
          order: item.order,
          make: item.make,
          bLights: item.bLights,
          covers: item.covers,
          substrate: item.substrate,
          includeCover: item.includeCover,
          includeStiffener: item.includeStiffener
        };
        return acc;
      }, {});

      // Update the sign order in the database
      const response = await fetch(`/api/sign-orders/${params?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signs: signsObject
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update sign order');
      }

      setLoading(false);

      // Show success message
      alert('Changes saved successfully!');
    } catch (error: any) {
      console.error('Error updating sign order:', error);
      setLoading(false);
      alert(`Failed to save changes: ${error?.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!signOrder) {
    return <div className="flex justify-center items-center h-screen">Sign order not found</div>;
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 68)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <Toaster />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold mt-2 ml-0">Sign Shop Order Tracker</h1>
            <div className="flex gap-2">
              <Button onClick={handleSubmitOrder} className="bg-primary text-white hover:bg-primary/90">Submit Order</Button>
              <Button variant="outline" onClick={handleExport}>Export</Button>
            </div>
          </div>
        </SiteHeader>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
              {/* Customer Info and Upload Files in same row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Customer Information - Takes 2/3 of the row */}
                <div className="lg:col-span-2 bg-white p-8 rounded-md shadow-sm border border-gray-100">
                  <h2 className="text-xl font-semibold mb-4">Customer Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">Job Number</label>
                      <Input
                        value={signOrder.job_number || ''}
                        onChange={() => { }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Contract Number</label>
                      <Input
                        value={signOrder.contract_number || ''}
                        onChange={() => { }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Requestor</label>
                      <Popover open={openRequestor} onOpenChange={setOpenRequestor}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openRequestor}
                            className="w-full justify-between"
                          >
                            {signOrder.requestor || 'Select requestor...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Search requestor..." />
                            <CommandEmpty>No requestor found.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {requestors.map((requestor) => (
                                <CommandItem
                                  key={requestor.id}
                                  value={requestor.name}
                                  onSelect={() => {
                                    setSignOrder(prev => prev ? { ...prev, requestor: requestor.name } : null);
                                    setOpenRequestor(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      signOrder.requestor === requestor.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {requestor.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Branch</label>
                      <Popover open={openBranch} onOpenChange={setOpenBranch}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openBranch}
                            className="w-full justify-between"
                          >
                            {signOrder.branch || 'All'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Search branch..." />
                            <CommandEmpty>No branch found.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {branches.map((branch) => (
                                <CommandItem
                                  key={branch.id}
                                  value={branch.name}
                                  onSelect={() => {
                                    setSignOrder(prev => prev ? { ...prev, branch: branch.name } : null);
                                    setOpenBranch(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      signOrder.branch === branch.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {branch.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">Customer</label>
                      <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCustomer}
                            className="w-full justify-between"
                          >
                            {signOrder.contractors?.name || 'Select customer...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Search customer..." />
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.name}
                                  onSelect={() => {
                                    setSignOrder(prev => prev ? {
                                      ...prev,
                                      contractor_id: customer.id,
                                      contractors: { name: customer.name }
                                    } : null);
                                    setOpenCustomer(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      signOrder.contractors?.name === customer.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {customer.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Need Date</label>
                      <div className="flex items-center">
                        <Input
                          value={needDate ? format(needDate, "MM/dd/yyyy") : ''}
                          onChange={() => { }}
                          className="w-full"
                        />
                        <button className="ml-2 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Order Date</label>
                      <div className="flex items-center">
                        <Input
                          value={orderDate ? format(orderDate, "MM/dd/yyyy") : ''}
                          onChange={() => { }}
                          className="w-full"
                        />
                        <button className="ml-2 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Order Type</label>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="sale"
                            className="mr-2"
                            checked={isSale}
                            onChange={(e) => {
                              setIsSale(e.target.checked);
                              setSignOrder(prev => prev ? { ...prev, sale: e.target.checked } : null);
                            }}
                          />
                          <label htmlFor="sale">Sale</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="rental"
                            className="mr-2"
                            checked={isRental}
                            onChange={(e) => {
                              setIsRental(e.target.checked);
                              setSignOrder(prev => prev ? { ...prev, rental: e.target.checked } : null);
                            }}
                          />
                          <label htmlFor="rental">Rental</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="permanent"
                            className="mr-2"
                            checked={isPermanent}
                            onChange={(e) => {
                              setIsPermanent(e.target.checked);
                              setSignOrder(prev => prev ? { ...prev, perm_signs: e.target.checked } : null);
                            }}
                          />
                          <label htmlFor="permanent">Permanent Signs</label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Assigned to</label>
                      <Select
                        value={signOrder.assigned_to || ''}
                        onValueChange={(value) => {
                          setSignOrder(prev => prev ? { ...prev, assigned_to: value } : null);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tom Daywalt">Tom Daywalt</SelectItem>
                          <SelectItem value="Richie Sweigert">Richie Sweigert</SelectItem>
                          <SelectItem value="David Grooms">David Grooms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Upload Files - Takes 1/3 of the row */}
                <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100">
                  <h2 className="text-xl font-semibold mb-4">Upload files</h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center h-full flex flex-col justify-center">
                    <div className="flex justify-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </div>
                    <p className="mb-1">Upload up to 10 files at once</p>
                    <p className="text-sm text-gray-500">Drag and drop or select files to upload</p>
                    <p className="text-xs text-gray-400 mt-1">Maximum file size: 50 MB</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Sign order</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleGenerate}>Generate</Button>
                  <Button onClick={handleAddNewSign} className="bg-primary text-white hover:bg-primary/90" disabled={showAddForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Sign
                  </Button>
                  <Button onClick={handleSaveChanges} className="bg-green-600 text-white hover:bg-green-700">Save Changes</Button>
                </div>
              </div>

              {showAddForm && (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 mb-4">
                  <div className="space-y-8">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="custom-sign"
                        checked={isCustomSign}
                        onCheckedChange={(checked) => {
                          setIsCustomSign(checked);
                          setNewSign({ ...newSign, isCustom: checked });
                        }}
                      />
                      <Label htmlFor="custom-sign">Custom Sign</Label>
                    </div>

                    <div className="w-full flex gap-4">
                      <div className="flex-1">
                        <Label className="text-base font-semibold mb-2.5 block">
                          Designation
                        </Label>
                        {isCustomSign ? (
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">
                                Designation Code
                              </Label>
                              <Input
                                value={newSign.designation || ""}
                                onChange={(e) => setNewSign({ ...newSign, designation: e.target.value })}
                                placeholder="Enter custom designation"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">
                                Description
                              </Label>
                              <Input
                                value={newSign.description || ""}
                                onChange={(e) => setNewSign({ ...newSign, description: e.target.value })}
                                placeholder="Enter description"
                              />
                            </div>
                          </div>
                        ) : (
                          <Select
                            value={newSign.designation}
                            onValueChange={(value) => setNewSign({ ...newSign, designation: value })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select designation..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="R1-1">R1-1 STOP</SelectItem>
                              <SelectItem value="R1-2">R1-2 YIELD</SelectItem>
                              <SelectItem value="R2-1">R2-1 SPEED LIMIT</SelectItem>
                              <SelectItem value="W1-1">W1-1 TURN</SelectItem>
                              <SelectItem value="W1-2">W1-2 CURVE</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="flex-1">
                        <Label className="text-base font-semibold mb-2.5 block">
                          Substrate
                        </Label>
                        <Select
                          value={newSign.substrate}
                          onValueChange={(value) => setNewSign({ ...newSign, substrate: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select substrate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aluminum">Aluminum</SelectItem>
                            <SelectItem value="Aluminum Composite">Aluminum Composite</SelectItem>
                            <SelectItem value="Plastic">Plastic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {isCustomSign ? (
                        <>
                          <div className="flex-1">
                            <Label className="text-sm font-medium mb-2 block">
                              Width
                            </Label>
                            <Input
                              type="number"
                              value={newSign.width || ""}
                              onChange={(e) => setNewSign({ ...newSign, width: parseFloat(e.target.value) || 0 })}
                              min={0}
                              step="0.1"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-sm font-medium mb-2 block">
                              Height
                            </Label>
                            <Input
                              type="number"
                              value={newSign.height || ""}
                              onChange={(e) => setNewSign({ ...newSign, height: parseFloat(e.target.value) || 0 })}
                              min={0}
                              step="0.1"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex-1">
                          <Label className="text-sm font-medium mb-2 block">
                            Dimensions
                          </Label>
                          <Select
                            value={newSign.width && newSign.height ? `${newSign.width}x${newSign.height}` : undefined}
                            onValueChange={(value) => {
                              const [width, height] = value.split('x').map(v => parseFloat(v));
                              setNewSign({ ...newSign, width, height });
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select dimensions" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="24x24">24 x 24</SelectItem>
                              <SelectItem value="30x30">30 x 30</SelectItem>
                              <SelectItem value="36x36">36 x 36</SelectItem>
                              <SelectItem value="48x24">48 x 24</SelectItem>
                              <SelectItem value="48x48">48 x 48</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 block">
                          Sheeting
                        </Label>
                        <Select
                          value={newSign.sheeting}
                          onValueChange={(value) => setNewSign({ ...newSign, sheeting: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HI">HI</SelectItem>
                            <SelectItem value="DG">DG</SelectItem>
                            <SelectItem value="Type IX">Type IX</SelectItem>
                            <SelectItem value="Special">Special</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 block">
                          Quantity
                        </Label>
                        <Input
                          type="number"
                          value={newSign.quantity}
                          onChange={(e) => setNewSign({ ...newSign, quantity: parseInt(e.target.value) || 1 })}
                          min={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 block">
                          Structure
                        </Label>
                        <Select
                          value={newSign.structure}
                          onValueChange={(value) => setNewSign({ ...newSign, structure: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4&apos; T-III RIGHT">4&apos; T-III RIGHT</SelectItem>
                            <SelectItem value="4&apos; T-III LEFT">4&apos; T-III LEFT</SelectItem>
                            <SelectItem value="6&apos; T-III RIGHT">6&apos; T-III RIGHT</SelectItem>
                            <SelectItem value="6&apos; T-III LEFT">6&apos; T-III LEFT</SelectItem>
                            <SelectItem value="H-FOOT">H-FOOT</SelectItem>
                            <SelectItem value="LOOSE">LOOSE</SelectItem>
                            <SelectItem value="8&apos; POST">8&apos; POST</SelectItem>
                            <SelectItem value="10&apos; POST">10&apos; POST</SelectItem>
                            <SelectItem value="12&apos; POST">12&apos; POST</SelectItem>
                            <SelectItem value="14&apos; POST">14&apos; POST</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 block">
                          B Light Quantity
                        </Label>
                        <Input
                          type="number"
                          value={newSign.bLights}
                          onChange={(e) => setNewSign({ ...newSign, bLights: parseInt(e.target.value) || 0 })}
                          min={0}
                          className="w-full"
                        />
                      </div>

                      <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 block">
                          Covers
                        </Label>
                        <Input
                          type="number"
                          value={newSign.covers}
                          onChange={(e) => setNewSign({ ...newSign, covers: parseInt(e.target.value) || 0 })}
                          min={0}
                          className="w-full"
                        />
                      </div>

                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex gap-x-2 items-center">
                            <Checkbox
                              id="cover-checkbox"
                              checked={newSign.includeCover}
                              onCheckedChange={(checked) => setNewSign({ ...newSign, includeCover: !!checked })}
                            />
                            <Label htmlFor="cover-checkbox" className="text-sm font-medium">
                              Include cover
                            </Label>
                          </div>
                          <div className="flex gap-x-2 items-center">
                            <Checkbox
                              id="stiffener-checkbox"
                              checked={newSign.includeStiffener}
                              onCheckedChange={(checked) => setNewSign({ ...newSign, includeStiffener: !!checked })}
                            />
                            <Label htmlFor="stiffener-checkbox" className="text-sm font-medium">
                              Include stiffener
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelAddSign}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveNewSign}>
                        Save Sign
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-sm font-medium text-gray-600">
                      <th className="border p-2 text-left">Designation</th>
                      <th className="border p-2 text-left">Description</th>
                      <th className="border p-2 text-left">Width</th>
                      <th className="border p-2 text-left">Height</th>
                      <th className="border p-2 text-left">Quantity</th>
                      <th className="border p-2 text-left">Sheeting</th>
                      <th className="border p-2 text-left">Structure</th>
                      <th className="border p-2 text-left">Stiffner</th>
                      <th className="border p-2 text-left">In Stock</th>
                      <th className="border p-2 text-left">Order</th>
                      <th className="border p-2 text-left">Make</th>
                      <th className="border p-2 text-left">B Lights</th>
                      <th className="border p-2 text-left">Covers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signItems.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border p-2">
                          <Input 
                            className="w-full" 
                            value={item.designation} 
                            onChange={(e) => {
                              const updatedItems = [...signItems];
                              updatedItems[index].designation = e.target.value;
                              setSignItems(updatedItems);
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input 
                            className="w-full" 
                            value={item.description} 
                            onChange={(e) => {
                              const updatedItems = [...signItems];
                              updatedItems[index].description = e.target.value;
                              setSignItems(updatedItems);
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input 
                            className="w-full" 
                            type="number" 
                            value={item.width} 
                            onChange={(e) => {
                              const updatedItems = [...signItems];
                              updatedItems[index].width = parseInt(e.target.value) || 0;
                              setSignItems(updatedItems);
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input 
                            className="w-full" 
                            type="number" 
                            value={item.height} 
                            onChange={(e) => {
                              const updatedItems = [...signItems];
                              updatedItems[index].height = parseInt(e.target.value) || 0;
                              setSignItems(updatedItems);
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input 
                            className="w-full" 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => {
                              const updatedItems = [...signItems];
                              updatedItems[index].quantity = parseInt(e.target.value) || 0;
                              setSignItems(updatedItems);
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input 
                            className="w-full" 
                            value={item.sheeting} 
                            onChange={(e) => {
                              const updatedItems = [...signItems];
                              updatedItems[index].sheeting = e.target.value;
                              setSignItems(updatedItems);
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input 
                            className="w-full" 
                            value={item.structure} 
                            onChange={(e) => {
                              const updatedItems = [...signItems];
                              updatedItems[index].structure = e.target.value;
                              setSignItems(updatedItems);
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input 
                            className="w-full" 
                            value={item.stiffner} 
                            onChange={(e) => {
                              const updatedItems = [...signItems];
                              updatedItems[index].stiffner = e.target.value;
                              setSignItems(updatedItems);
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <div className="flex items-center">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="h-8 w-8 text-xs rounded-r-none border-r-0 bg-gray-100 hover:bg-gray-200"
                              onClick={() => {
                                const updatedItems = [...signItems];
                                const currentValue = Number(item.in_stock) || 0;
                                updatedItems[index].in_stock = Math.max(0, currentValue - 1);
                                setSignItems(updatedItems);
                              }}
                            >
                              -
                            </Button>
                            <Input 
                              type="number" 
                              value={item.in_stock || 0} 
                              onChange={(e) => {
                                const updatedItems = [...signItems];
                                const value = parseInt(e.target.value);
                                updatedItems[index].in_stock = isNaN(value) ? 0 : Math.max(0, value);
                                setSignItems(updatedItems);
                              }}
                              className="h-8 rounded-none text-center w-12 min-w-[2rem] px-0 text-xs"
                              min={0}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="h-8 w-8 text-xs rounded-l-none border-l-0 bg-gray-100 hover:bg-gray-200"
                              onClick={() => {
                                const updatedItems = [...signItems];
                                const currentValue = Number(item.in_stock) || 0;
                                updatedItems[index].in_stock = currentValue + 1;
                                setSignItems(updatedItems);
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </td>
                        <td className="border p-2">
                          <div className="flex items-center">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="h-8 w-8 text-xs rounded-r-none border-r-0 bg-gray-100 hover:bg-gray-200"
                              onClick={() => {
                                const updatedItems = [...signItems];
                                const currentValue = Number(item.order) || 0;
                                updatedItems[index].order = Math.max(0, currentValue - 1);
                                setSignItems(updatedItems);
                              }}
                            >
                              -
                            </Button>
                            <Input 
                              type="number" 
                              value={item.order || 0} 
                              onChange={(e) => {
                                const updatedItems = [...signItems];
                                const value = parseInt(e.target.value);
                                updatedItems[index].order = isNaN(value) ? 0 : Math.max(0, value);
                                setSignItems(updatedItems);
                              }}
                              className="h-8 rounded-none text-center w-12 min-w-[2rem] px-0 text-xs"
                              min={0}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="h-8 w-8 text-xs rounded-l-none border-l-0 bg-gray-100 hover:bg-gray-200"
                              onClick={() => {
                                const updatedItems = [...signItems];
                                const currentValue = Number(item.order) || 0;
                                updatedItems[index].order = currentValue + 1;
                                setSignItems(updatedItems);
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </td>
                        <td className="border p-2">
                          <div className="flex items-center">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="h-8 w-8 text-xs rounded-r-none border-r-0 bg-gray-100 hover:bg-gray-200"
                              onClick={() => {
                                const updatedItems = [...signItems];
                                const currentValue = Number(item.make) || 0;
                                updatedItems[index].make = Math.max(0, currentValue - 1);
                                setSignItems(updatedItems);
                              }}
                            >
                              -
                            </Button>
                            <Input 
                              type="number" 
                              value={item.make || 0} 
                              onChange={(e) => {
                                const updatedItems = [...signItems];
                                const value = parseInt(e.target.value);
                                updatedItems[index].make = isNaN(value) ? 0 : Math.max(0, value);
                                setSignItems(updatedItems);
                              }}
                              className="h-8 rounded-none text-center w-12 min-w-[2rem] px-0 text-xs"
                              min={0}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="h-8 w-8 text-xs rounded-l-none border-l-0 bg-gray-100 hover:bg-gray-200"
                              onClick={() => {
                                const updatedItems = [...signItems];
                                const currentValue = Number(item.make) || 0;
                                updatedItems[index].make = currentValue + 1;
                                setSignItems(updatedItems);
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </td>
                        <td className="border p-2">
                          <Input 
                            className="w-full" 
                            type="number" 
                            value={item.bLights || 0} 
                            onChange={(e) => {
                              const updatedItems = [...signItems];
                              updatedItems[index].bLights = parseInt(e.target.value) || 0;
                              setSignItems(updatedItems);
                            }}
                            min={0}
                          />
                        </td>
                        <td className="border p-2">
                          <Input 
                            className="w-full" 
                            type="number" 
                            value={item.covers || 0} 
                            onChange={(e) => {
                              const updatedItems = [...signItems];
                              updatedItems[index].covers = parseInt(e.target.value) || 0;
                              setSignItems(updatedItems);
                            }}
                            min={0}
                          />
                        </td>
                      </tr>
                    ))}
                    {signItems.length === 0 && !showAddForm && (
                      <tr>
                        <td colSpan={11} className="border p-2 text-center">No signs added yet</td>
                      </tr>
                    )}
                    {signItems.length === 0 && !showAddForm && (
                      <tr>
                        <td colSpan={11} className="border p-2 text-center">No signs added yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
