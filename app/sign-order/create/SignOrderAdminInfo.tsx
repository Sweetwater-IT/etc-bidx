// SignOrderAdminInfo.jsx - Modified to lift state up
"use client";

import { useEffect, useState } from "react";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User } from "@/types/User";
import { fetchReferenceData } from "@/lib/api-client";

const JOB_TYPES = [
    { value: "job_type_1", label: "Job Type 1" },
    { value: "job_type_2", label: "Job Type 2" },
    { value: "job_type_3", label: "Job Type 3" },
];

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

// Adding props to receive values and setter functions from parent
export function SignOrderAdminInfo({ 
    adminInfo,
    setAdminInfo
}) {
    const { customers, getCustomers, isLoading } = useCustomers();

    // State for local UI management
    const [openRequestor, setOpenRequestor] = useState<boolean>(false);
    const [openCustomer, setOpenCustomer] = useState<boolean>(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);

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
                setAllJobs(data.jobs.filter(job => !!job.job_number) || []);
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

    // Handle branch change - reset job number
    useEffect(() => {
        if (adminInfo.selectedBranch !== adminInfo.prevBranch) {
            setAdminInfo({
                ...adminInfo,
                jobNumber: '',
                prevBranch: adminInfo.selectedBranch
            });
        }
    }, [adminInfo.selectedBranch]);

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

                {/* Date Pickers */}
                <div className="space-y-2">
                    <Label>Order Date</Label>
                    <Input
                        type="date"
                        value={adminInfo.orderDate}
                        onChange={(e) => setAdminInfo({
                            ...adminInfo,
                            orderDate: e.target.value
                        })}
                        className="bg-muted/50"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Need Date</Label>
                    <Input
                        type="date"
                        value={adminInfo.needDate}
                        onChange={(e) => setAdminInfo({
                            ...adminInfo,
                            needDate: e.target.value
                        })}
                        className="bg-muted/50"
                    />
                </div>

                {/* Job Type Selector */}
                <div className="space-y-2">
                    <Label>Job Type</Label>
                    <Select 
                        value={adminInfo.jobType} 
                        onValueChange={(value) => setAdminInfo({
                            ...adminInfo,
                            jobType: value
                        })}
                    >
                        <SelectTrigger className="bg-muted/50">
                            <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                            {JOB_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Sale/Rental Checkboxes */}
                <div className="space-y-2">
                    <Label>Order Type</Label>
                    <div className="flex space-x-4 pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="sale-checkbox"
                                checked={adminInfo.sale}
                                onCheckedChange={(checked) => {
                                    setAdminInfo({
                                        ...adminInfo,
                                        sale: checked === true
                                    });
                                }}
                            />
                            <Label htmlFor="sale-checkbox">Sale</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="rental-checkbox"
                                checked={adminInfo.rental}
                                onCheckedChange={(checked) => {
                                    setAdminInfo({
                                        ...adminInfo,
                                        rental: checked === true
                                    });
                                }}
                            />
                            <Label htmlFor="rental-checkbox">Rental</Label>
                        </div>
                    </div>
                </div>

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

                {/* Job Number Selector */}
                <div className="space-y-2">
                    <Label>Job Number</Label>
                    <Select
                        value={adminInfo.jobNumber}
                        onValueChange={(value) => setAdminInfo({
                            ...adminInfo,
                            jobNumber: value
                        })}
                        disabled={isLoadingJobs}
                    >
                        <SelectTrigger className="bg-muted/50">
                            <SelectValue placeholder="Select job number" />
                        </SelectTrigger>
                        <SelectContent>
                            {allJobs
                                .filter(job => adminInfo.selectedBranch === 'All' ? true : job.branch === adminInfo.selectedBranch)
                                .map(job => (
                                    <SelectItem key={job.job_number} value={job.job_number}>
                                        {job.job_number}
                                    </SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}