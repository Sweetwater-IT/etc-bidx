// SignOrderAdminInfo.jsx - Modified to lift state up and improved command input
"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCustomers } from "@/hooks/use-customers";
import { Customer } from "@/types/Customer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Briefcase } from "lucide-react";
import { 
    Command, 
    CommandEmpty, 
    CommandGroup, 
    CommandInput, 
    CommandItem,
    CommandList
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User } from "@/types/User";
import { fetchReferenceData } from "@/lib/api-client";
import { SignOrderAdminInformation } from "./SignOrderContent";
import { AutoComplete } from "@/components/ui/autocomplete";

const BRANCHES = [
    { value: "All", label: "All" },
    { value: "Turbotville", label: "Turbotville" },
    { value: "Hatfield", label: "Hatfield" },
    { value: "Bedford", label: "Bedford" },
];

interface Job {
    job_number: string;
    branch: string;
}

export function SignOrderAdminInfo({
    adminInfo,
    setAdminInfo
}: { adminInfo: SignOrderAdminInformation, setAdminInfo: Dispatch<SetStateAction<SignOrderAdminInformation>> }) {
    const { customers, getCustomers, isLoading } = useCustomers();

    // State for local UI management
    const [openRequestor, setOpenRequestor] = useState<boolean>(false);
    const [openCustomer, setOpenCustomer] = useState<boolean>(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);
    const [jobSearchInput, setJobSearchInput] = useState<string>("");

    // Fetch customers on component mount
    useEffect(() => {
        getCustomers();
        fetchUsers();
        fetchJobs();
    }, []);

    // Fetch users data
    const fetchUsers = async () => {
        try {
            const users = await fetchReferenceData('users');
            setAllUsers(users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error fetching users');
        }
    };

    // Fetch jobs based on branch selection
    const fetchJobs = async () => {
        try {
            setIsLoadingJobs(true);
            const response = await fetch('/api/quotes/estimate-job-data');
            const data = await response.json();

            if (response.ok) {
                const jobs = data.jobs.filter(job => !!job.job_number) || [];
                setAllJobs(jobs);
                setFilteredJobs(jobs);
            } else {
                console.error('Failed to fetch jobs:', data.error);
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Error fetching jobs');
        } finally {
            setIsLoadingJobs(false);
        }
    };

    // Handle branch change - reset job number and filter jobs
    useEffect(() => {
        setAdminInfo(prev => ({
            ...prev,
            jobNumber: '',
        }));
        
        // Filter jobs based on selected branch
        if (adminInfo.selectedBranch === 'All') {
            setFilteredJobs(allJobs);
        } else {
            setFilteredJobs(allJobs.filter(job => job.branch === adminInfo.selectedBranch));
        }
        
        setJobSearchInput("");
    }, [adminInfo.selectedBranch, allJobs]);

    // Handle job search input change
    const handleJobNumberChange = (value: string) => {
        // Update the admin info with whatever the user types
        setAdminInfo(prev => ({ 
            ...prev, 
            jobNumber: value 
        }));
        
        // Additionally filter the dropdown options for selection
        const filtered = allJobs.filter(job => 
            job.job_number.toLowerCase().includes(value.toLowerCase()) && 
            (adminInfo.selectedBranch === 'All' || job.branch === adminInfo.selectedBranch)
        );
        
        setFilteredJobs(filtered);
    };


    return (
        <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Admin Information</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Requestor Dropdown */}
                <div className="space-y-2">
                    <Label>Requestor</Label>
                    <Popover
                        open={openRequestor}
                        onOpenChange={setOpenRequestor}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openRequestor}
                                className="w-full justify-between bg-muted/50"
                            >
                                {adminInfo.requestor ? adminInfo.requestor.name : "Select requestor..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                                <CommandInput placeholder="Search requestor..." />
                                <CommandEmpty>No requestor found.</CommandEmpty>
                                <CommandGroup className="max-h-[200px] overflow-y-auto">
                                    {allUsers.map((user) => (
                                        <CommandItem
                                            key={user.id}
                                            value={user.name}
                                            onSelect={() => {
                                                setAdminInfo({
                                                    ...adminInfo,
                                                    requestor: user
                                                });
                                                setOpenRequestor(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    (adminInfo.requestor && adminInfo.requestor.id === user.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {user.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Customer Dropdown */}
                <div className="md:col-span-2 space-y-2">
                    <Label>Customer</Label>
                    <Popover
                        open={openCustomer}
                        onOpenChange={setOpenCustomer}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCustomer}
                                className="w-full justify-between bg-muted/50"
                            >
                                {adminInfo.customer ? adminInfo.customer.name : "Select contractor..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                                <CommandInput placeholder="Search contractor..." />
                                <CommandEmpty>No contractor found.</CommandEmpty>
                                <CommandGroup className="max-h-[200px] overflow-y-auto">
                                    {customers.map((c) => (
                                        <CommandItem
                                            key={c.id}
                                            value={c.name}
                                            onSelect={() => {
                                                setAdminInfo({
                                                    ...adminInfo,
                                                    customer: c
                                                });
                                                setOpenCustomer(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    (adminInfo.customer && adminInfo.customer.id === c.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {c.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label>Need Date</Label>
                    <Input
                        type="date"
                        value={adminInfo.needDate.toISOString().split('T')[0]}
                        onChange={(e) => setAdminInfo({
                            ...adminInfo,
                            needDate: new Date(e.target.value)
                        })}
                        className="bg-muted/50"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Order Date</Label>
                    <Input
                        type="date"
                        value={adminInfo.orderDate.toISOString().split('T')[0]}
                        onChange={(e) => setAdminInfo({
                            ...adminInfo,
                            orderDate: new Date(e.target.value)
                        })}
                        className="bg-muted/50"
                    />
                </div>

                {/* Sale/Rental Checkboxes */}
                <div className="space-y-2">
                    <Label>Order Type</Label>
                    <div className="flex space-x-4 pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="sale-checkbox"
                                checked={adminInfo.orderType === 'sale'}
                                onCheckedChange={() => {
                                    setAdminInfo({
                                        ...adminInfo,
                                        orderType: 'sale'
                                    });
                                }}
                            />
                            <Label htmlFor="sale-checkbox">Sale</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="rental-checkbox"
                                checked={adminInfo.orderType === 'rental'}
                                onCheckedChange={() => {
                                    setAdminInfo({
                                        ...adminInfo,
                                        orderType: 'rental'
                                    });
                                }}
                            />
                            <Label htmlFor="rental-checkbox">Rental</Label>
                        </div>
                    </div>
                </div>

                {adminInfo.orderType === 'rental' && <>
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                            type="date"
                            value={adminInfo.startDate ? adminInfo.startDate.toISOString().split('T')[0] :
                                new Date().toISOString().split('T')[0]}
                            onChange={(e) => setAdminInfo({
                                ...adminInfo,
                                startDate: new Date(e.target.value)
                            })}
                            className="bg-muted/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                            type="date"
                            value={adminInfo.endDate ? adminInfo.endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            onChange={(e) => setAdminInfo({
                                ...adminInfo,
                                endDate: new Date(e.target.value)
                            })}
                            className="bg-muted/50"
                        />
                    </div>
                </>}

                {/* Branch Selector for Job Number */}
                <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select
                        value={adminInfo.selectedBranch}
                        onValueChange={(value) => setAdminInfo({
                            ...adminInfo,
                            selectedBranch: value
                        })}
                    >
                        <SelectTrigger className="bg-muted/50">
                            <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                            {BRANCHES.map(branch => (
                                <SelectItem key={branch.value} value={branch.value}>
                                    {branch.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Job Number Selector - Updated to match example */}
                <div className="space-y-2 md:col-span-2 relative">
                    <Label>Job Number</Label>
                    <AutoComplete
                        value={{label: adminInfo.jobNumber, value: adminInfo.jobNumber}}
                        options={filteredJobs.map(fj => ({label: fj.job_number, value: fj.job_number}))}
                        emptyMessage="No job numbers found"
                        disabled={isLoadingJobs}
                        onValueChange={handleJobNumberChange}
                        placeholder="Search or enter job number..."
                    />
                </div>
            </div>
        </div>
    );
}