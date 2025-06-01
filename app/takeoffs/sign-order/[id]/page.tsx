'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

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
  in_stock: boolean;
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
        
        // Fetch sign items (this would be a separate API call)
        // For now, we'll use dummy data
        setSignItems([
          {
            id: 1,
            designation: 'R1-1',
            description: 'STOP',
            width: 30,
            height: 30,
            quantity: 2,
            sheeting: 'Type III',
            structure: 'Aluminum',
            stiffner: 'None',
            assigned_to: 'John Doe',
            in_stock: true
          },
          {
            id: 2,
            designation: 'W1-8',
            description: 'CHEVRON',
            width: 24,
            height: 30,
            quantity: 4,
            sheeting: 'Type III',
            structure: 'Aluminum',
            stiffner: 'None',
            assigned_to: 'Jane Smith',
            in_stock: false
          }
        ]);
        
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

  const handleSubmitOrder = () => {
    // Submit order functionality would go here
    alert('Submit order functionality not implemented yet');
  };

  const handleAddNewSign = () => {
    // Add new sign functionality would go here
    alert('Add new sign functionality not implemented yet');
  };

  const handleGenerate = () => {
    // Generate functionality would go here
    alert('Generate functionality not implemented yet');
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
                        onChange={() => {}} 
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Contract Number</label>
                      <Input 
                        value={signOrder.contract_number || ''} 
                        onChange={() => {}} 
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
                                    setSignOrder(prev => prev ? {...prev, requestor: requestor.name} : null);
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
                                    setSignOrder(prev => prev ? {...prev, branch: branch.name} : null);
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
                          onChange={() => {}} 
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
                          onChange={() => {}} 
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
                              setSignOrder(prev => prev ? {...prev, sale: e.target.checked} : null);
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
                              setSignOrder(prev => prev ? {...prev, rental: e.target.checked} : null);
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
                              setSignOrder(prev => prev ? {...prev, perm_signs: e.target.checked} : null);
                            }}
                          />
                          <label htmlFor="permanent">Permanent Signs</label>
                        </div>
                      </div>
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
              
              {/* Sign Order Table */}
              <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Sign order</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleGenerate}>Generate</Button>
                    <Button onClick={handleAddNewSign} className="bg-primary text-white hover:bg-primary/90">Add New Sign</Button>
                  </div>
                </div>
                
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
                        <th className="border p-2 text-left">Assigned to</th>
                        <th className="border p-2 text-left">In Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signItems.map((item) => (
                        <tr key={item.id}>
                          <td className="border p-2">{item.designation}</td>
                          <td className="border p-2">{item.description}</td>
                          <td className="border p-2">{item.width}</td>
                          <td className="border p-2">{item.height}</td>
                          <td className="border p-2">{item.quantity}</td>
                          <td className="border p-2">{item.sheeting}</td>
                          <td className="border p-2">{item.structure}</td>
                          <td className="border p-2">{item.stiffner}</td>
                          <td className="border p-2">{item.assigned_to}</td>
                          <td className="border p-2">{item.in_stock ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                      {signItems.length === 0 && (
                        <tr>
                          <td colSpan={10} className="border p-2 text-center">No signs added yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
