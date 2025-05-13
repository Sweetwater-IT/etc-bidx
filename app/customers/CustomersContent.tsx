'use client'
import { CardActions } from '@/components/card-actions'
import { DataTable } from '@/components/data-table'
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/types/Customer';
import React, { useEffect, useState, FormEvent } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

interface Column {
    key : keyof Customer,
    title: string,
    className? : string
}

const COLUMNS : Column[] = [
    { key: "name", title: "Name" },
    { key: "customerNumber", title: "Customer Number" },
    // { key: "paymentTerms", title: "Payment Terms" },
    { key: "address", title: "Address",},
    { key: "city", title: "City" },
    { key: "state", title: "State" },
    { key: "zip", title: "ZIP" },
    // { key: "displayName", title: "Display Name" },
    // { key: "url", title: "Website URL", className: 'max-w-200' },
    { key: 'created', title: 'Created'},
    { key: 'updated', title: 'Last Updated'}
];

const SEGMENTS = [
    { label: "All", value: "all" },
    { label: "1%10 NET 30", value: "1%10 NET 30" },
    { label: "COD", value: "COD" },
    { label: "CC", value: "CC" },
    { label: "NET15", value: "NET15" },
    { label: "NET30", value: "NET30" }
];

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CustomersContent = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        customer_number: '',
        web: '',
        main_phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        payment_terms: ''
    });
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };
    
    const handleSelectChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            payment_terms: value
        }));
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const { data, error } = await supabase
                .from('contractors')
                .insert([
                    {
                        name: formData.name,
                        display_name: formData.display_name,
                        customer_number: formData.customer_number,
                        web: formData.web,
                        main_phone: formData.main_phone,
                        address: formData.address,
                        city: formData.city,
                        state: formData.state,
                        zip: formData.zip,
                        payment_terms: formData.payment_terms,
                        created: new Date().toISOString(),
                        updated: new Date().toISOString(),
                        active: true
                    }
                ]);
                
            if (error) {
                throw error;
            }
            
            toast.success('Customer created successfully!');
            setDrawerOpen(false);
            getCustomers();
            
            setFormData({
                name: '',
                display_name: '',
                customer_number: '',
                web: '',
                main_phone: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                payment_terms: ''
            });
        } catch (error: any) {
            toast.error(`Error creating customer: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const { customers, isLoading, error, getCustomers } = useCustomers();

    useEffect(() => {
        getCustomers();
    }, [])
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!customers.length) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => {
                    const newIndex = prev < customers.length - 1 ? prev + 1 : prev;
                    setSelectedCustomer(customers[newIndex]);
                    if (drawerOpen) {
                        setIsViewMode(true);
                        setFormData({
                            name: customers[newIndex].name || '',
                            display_name: customers[newIndex].displayName || '',
                            customer_number: String(customers[newIndex].customerNumber) || '',
                            web: customers[newIndex].url || '',
                            main_phone: customers[newIndex].mainPhone || '',
                            address: customers[newIndex].address || '',
                            city: customers[newIndex].city || '',
                            state: customers[newIndex].state || '',
                            zip: customers[newIndex].zip || '',
                            payment_terms: customers[newIndex].paymentTerms || ''
                        });
                    }
                    return newIndex;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => {
                    const newIndex = prev > 0 ? prev - 1 : prev;
                    setSelectedCustomer(customers[newIndex]);
                    if (drawerOpen) {
                        setIsViewMode(true);
                        setFormData({
                            name: customers[newIndex].name || '',
                            display_name: customers[newIndex].displayName || '',
                            customer_number: String(customers[newIndex].customerNumber) || '',
                            web: customers[newIndex].url || '',
                            main_phone: customers[newIndex].mainPhone || '',
                            address: customers[newIndex].address || '',
                            city: customers[newIndex].city || '',
                            state: customers[newIndex].state || '',
                            zip: customers[newIndex].zip || '',
                            payment_terms: customers[newIndex].paymentTerms || ''
                        });
                    }
                    return newIndex;
                });
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                handleViewCustomer(customers[selectedIndex]);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [customers, selectedIndex, drawerOpen]);
    
    const handleViewCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsViewMode(true);
        setFormData({
            name: customer.name || '',
            display_name: customer.displayName || '',
            customer_number: String(customer.customerNumber) || '',
            web: customer.url || '',
            main_phone: customer.mainPhone || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            zip: customer.zip || '',
            payment_terms: customer.paymentTerms || ''
        });
        setDrawerOpen(true);
    };
    
    const handleCreateCustomer = () => {
        setSelectedCustomer(null);
        setIsViewMode(false);
        setFormData({
            name: '',
            display_name: '',
            customer_number: '',
            web: '',
            main_phone: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            payment_terms: ''
        });
        setDrawerOpen(true);
    };

    if(error){
        toast.error(error);
    }

    return (
        <div className="flex flex-col items-center justify-between">
            
            <div className="flex items-center justify-between px-0 -mb-3 ml-auto">
            <CardActions
                createButtonLabel="Create Customer"
                hideCalendar
                goUpActions
                onCreateClick={handleCreateCustomer}
            />
            </div>
            {!isLoading && <div className='w-full mt-3'>
                <DataTable<Customer>
                    columns={COLUMNS}
                    segments={SEGMENTS}
                    stickyLastColumn
                    data={customers}
                    onViewDetails={handleViewCustomer}
                    selectedItem={selectedCustomer as Customer | undefined}
                />
            </div>}
            {/* Side Drawer for Creating New Customer */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
                <DrawerContent className="sm:max-w-lg">
                    <div className="flex flex-col h-full">
                        <DrawerHeader className="border-b pb-4">
                            <div className="flex justify-between items-center">
                                <DrawerTitle className="text-xl font-semibold">
                                    {isViewMode ? 'Customer Details' : 'Create New Customer'}
                                </DrawerTitle>
                                <DrawerClose className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-gray-100">
                                    <X className="h-4 w-4" />
                                </DrawerClose>
                            </div>
                        </DrawerHeader>
                        
                        <div className="flex-1 overflow-auto p-4">
                            {isViewMode && (
                                <div className="mb-6 space-y-4">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-bold">{formData.name}</h2>
                                        {formData.display_name && (
                                            <p className="text-muted-foreground">{formData.display_name}</p>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Address</p>
                                            <div className="text-sm text-muted-foreground">
                                                {formData.address && <p>{formData.address}</p>}
                                                {(formData.city || formData.state || formData.zip) && (
                                                    <p>
                                                        {formData.city}{formData.city && formData.state ? ', ' : ''}
                                                        {formData.state} {formData.zip}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {formData.main_phone && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">Phone</p>
                                                    <p className="text-sm text-muted-foreground">{formData.main_phone}</p>
                                                </div>
                                            )}
                                            
                                            {formData.web && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">Website</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        <a href={formData.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                            {formData.web}
                                                        </a>
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {formData.customer_number && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">Customer #</p>
                                                    <p className="text-sm text-muted-foreground">{formData.customer_number}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="border-t pt-4">
                                        {formData.payment_terms && (
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">Payment Terms</p>
                                                <p className="text-sm text-muted-foreground">{formData.payment_terms}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <Tabs defaultValue="contacts" className="w-full">
                                <TabsList className="w-full grid grid-cols-2 mb-4">
                                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                                    <TabsTrigger value="quotes">Quotes</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="contacts" className="p-1">
                                    {isViewMode ? (
                                        <div className="space-y-4">
                                            {selectedCustomer && selectedCustomer.contactIds.length > 0 ? (
                                                <div className="space-y-4">
                                                    {selectedCustomer.contactIds.map((contactId, index) => (
                                                        <div key={contactId} className="p-4 border rounded-md bg-white shadow-sm">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h3 className="font-medium text-lg">
                                                                        {selectedCustomer.names[index] || 'Unnamed Contact'}
                                                                    </h3>
                                                                    {selectedCustomer.roles[index] && (
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {selectedCustomer.roles[index]}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="mt-3 space-y-2">
                                                                {selectedCustomer.emails[index] && (
                                                                    <div className="flex items-center gap-2">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                                            <polyline points="22,6 12,13 2,6"></polyline>
                                                                        </svg>
                                                                        <a href={`mailto:${selectedCustomer.emails[index]}`} className="text-blue-600 hover:underline">
                                                                            {selectedCustomer.emails[index]}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                                
                                                                {selectedCustomer.phones[index] && (
                                                                    <div className="flex items-center gap-2">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                                        </svg>
                                                                        <a href={`tel:${selectedCustomer.phones[index]}`} className="text-blue-600 hover:underline">
                                                                            {selectedCustomer.phones[index]}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-md bg-gray-50 text-center">
                                                    <p className="text-muted-foreground">No contacts found for this customer.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <form className="space-y-6" onSubmit={handleSubmit}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Name */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Name</Label>
                                                    <Input 
                                                        id="name" 
                                                        placeholder="Full customer name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                                
                                                {/* Display Name */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="display_name">Display Name</Label>
                                                    <Input 
                                                        id="display_name" 
                                                        placeholder="Display name"
                                                        value={formData.display_name}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                
                                                {/* Customer Number */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="customer_number">Customer Number</Label>
                                                    <Input 
                                                        id="customer_number" 
                                                        placeholder="Foundation Customer #"
                                                        value={formData.customer_number}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                
                                                {/* Website URL */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="web">Website URL</Label>
                                                    <Input 
                                                        id="web" 
                                                        placeholder="https://example.com" 
                                                        type="url"
                                                        value={formData.web}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                
                                                {/* Main Phone */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="main_phone">Main Phone</Label>
                                                    <Input 
                                                        id="main_phone" 
                                                        placeholder="Phone Number" 
                                                        type="tel"
                                                        value={formData.main_phone}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                
                                                {/* Address */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="address">Address</Label>
                                                    <Input 
                                                        id="address" 
                                                        placeholder="Address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                
                                                {/* City */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="city">City</Label>
                                                    <Input 
                                                        id="city" 
                                                        placeholder="City"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                
                                                {/* State */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="state">State</Label>
                                                    <Input 
                                                        id="state" 
                                                        placeholder="State"
                                                        value={formData.state}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                
                                                {/* ZIP Code */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="zip">ZIP Code</Label>
                                                    <Input 
                                                        id="zip" 
                                                        placeholder="ZIP"
                                                        value={formData.zip}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                
                                                {/* Payment Terms */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="payment_terms">Payment Terms</Label>
                                                    <Select 
                                                        value={formData.payment_terms}
                                                        onValueChange={handleSelectChange}
                                                    >
                                                        <SelectTrigger id="payment_terms" className="w-full">
                                                            <SelectValue placeholder="Payment Terms" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1%10 NET 30">1%10 NET 30</SelectItem>
                                                            <SelectItem value="COD">COD</SelectItem>
                                                            <SelectItem value="CC">CC</SelectItem>
                                                            <SelectItem value="NET15">NET15</SelectItem>
                                                            <SelectItem value="NET30">NET30</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            
                                            {/* Submit Button */}
                                            <div className="pt-4">
                                                <Button 
                                                    type="submit" 
                                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? 'Creating...' : 'Create Customer'}
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </TabsContent>
                                
                                <TabsContent value="quotes" className="p-1">
                                    <div className="space-y-4">
                                        {/* Quotes content will go here */}
                                        <p className="text-muted-foreground">Quotes information will be displayed here.</p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}

export default CustomersContent
