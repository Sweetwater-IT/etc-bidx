// SignOrderAdminInfo.jsx - Modified job selector to use popover like designations
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconBulb } from "@tabler/icons-react";
import { MPTRentalEstimating } from "@/types/MPTEquipment";
import { defaultMPTObject } from "@/types/default-objects/defaultMPTObject";

const BRANCHES = [
    { value: "All", label: "All" },
    { value: "Turbotville", label: "Turbotville" },
    { value: "Hatfield", label: "Hatfield" },
    { value: "Bedford", label: "Bedford" },
];

interface Job {
    job_number: string;
    branch: string;
    mpt_rental: MPTRentalEstimating;
    contractNumber: string;
    contractorName: string;
}

export function SignOrderAdminInfo({
    adminInfo,
    setAdminInfo
}: { adminInfo: SignOrderAdminInformation, setAdminInfo: Dispatch<SetStateAction<SignOrderAdminInformation>> }) {
    const { customers, getCustomers, isLoading } = useCustomers();

    // State for local UI management
    const [openRequestor, setOpenRequestor] = useState<boolean>(false);
    const [openCustomer, setOpenCustomer] = useState<boolean>(false);
    const [openJob, setOpenJob] = useState<boolean>(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
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
            const response = await fetch('/api/takeoffs/job-data');
            const data = await response.json();

            if (response.ok) {
                setAllJobs([{ job_number: 'N/A', contractNumber: '', mpt_rental: defaultMPTObject, branch: '', contractorName: '' }, ...data.data]);
                setFilteredJobs([{ job_number: 'N/A', contractNumber: '', mpt_rental: defaultMPTObject, branch: '', contractorName: '' }, ...data.data]);
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

    // Filter jobs based on search term
    const filterJobs = (searchTerm: string) => {
        if (!Array.isArray(allJobs)) {
            setFilteredJobs([]);
            return;
        }

        try {
            const filtered = allJobs.filter(job => {
                if (searchTerm.length < 2) return true;
                // Then apply search filter (job number or contract number)
                const searchMatch =
                    job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (job.contractNumber && job.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()));

                return searchMatch;
            });

            setFilteredJobs(filtered);
        } catch (error) {
            console.error("Error filtering jobs:", error);
            setFilteredJobs([]);
        }
    };

    // Handle job selection
    const handleJobSelect = (jobNumber: string) => {
        const selectedJob = allJobs.find(job => job.job_number === jobNumber);
        console.log(selectedJob?.contractorName)
        const associatedCustomer = customers.find(c => {
            console.log(c.name)
            return c.name === selectedJob?.contractorName
        })

        if (selectedJob) {
            setAdminInfo(prev => ({
                ...prev,
                jobNumber: jobNumber,
                contractNumber: selectedJob.contractNumber || '',
                customer: associatedCustomer ? associatedCustomer : null
            }));
        }

        setOpenJob(false);
    };

    useEffect(() => {
        if (adminInfo.requestor && adminInfo.requestor.branches) {
            setAdminInfo({
                ...adminInfo,
                selectedBranch: adminInfo.requestor.branches.name
            })
        }
    }, [adminInfo.requestor])

    return (
        <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Admin Information</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">

                {/* Job Number Selector - Updated to use popover */}
                <div className="space-y-2 md:col-span-1">
                    <Label>Job Number {isLoadingJobs && "(Loading...)"}</Label>
                    <Popover open={openJob} onOpenChange={setOpenJob}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openJob}
                                className="w-full justify-between bg-muted/50"
                                disabled={isLoadingJobs}
                            >
                                {adminInfo.jobNumber}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-fit p-0">
                            <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Search by job number or contract..."
                                    onValueChange={filterJobs}
                                />
                                <CommandList>
                                    <CommandEmpty>No jobs found.</CommandEmpty>
                                    <CommandGroup key={filteredJobs.length} className="max-h-[200px] overflow-y-auto">
                                        {isLoadingJobs ? (
                                            <div className="py-6 text-center text-sm">Loading...</div>
                                        ) : (
                                            filteredJobs.map((job) => (
                                                <CommandItem
                                                    key={job.job_number}
                                                    value={job.job_number}
                                                    onSelect={() => handleJobSelect(job.job_number)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            adminInfo.jobNumber === job.job_number ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex gap-x-2 items-center">
                                                        <span className="font-medium">{job.job_number}</span>
                                                        {job.contractNumber && (
                                                            <span className="text-muted-foreground text-sm text-nowrap">
                                                                - ({job.contractNumber})
                                                            </span>
                                                        )}
                                                    </div>
                                                </CommandItem>
                                            ))
                                        )}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label>Contract Number</Label>
                    <Input
                        type="text"
                        value={adminInfo.contractNumber}
                        onChange={(e) => setAdminInfo({
                            ...adminInfo,
                            contractNumber: e.target.value
                        })}
                        className="bg-muted/50"
                        placeholder="Contract number"
                        disabled={adminInfo.jobNumber !== 'N/A'}
                    />
                </div>

                {/* Requestor Dropdown */}
                <div className="flex-1 space-y-2">
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

                <div className="flex space-x-2 items-end">
                    {/* Customer Dropdown */}
                    <div className="flex-1 space-y-2">
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
                                    className="max-w-50 truncate justify-between bg-muted/50"
                                >
                                    <span className="truncate">{adminInfo.customer ? adminInfo.customer.displayName : "Select contractor..."}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
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
                                                {c.displayName}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex gap-x-2">
                                    <Label>Need Date</Label>
                                    <IconBulb className="h-5" color="gray" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div>Sale = date requested by customer</div>
                                <div>Rental = 1 week before job start</div>
                            </TooltipContent>
                        </Tooltip>
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
                            disabled
                        />
                    </div>

                    {/* Sale/Rental Checkboxes */}
                    <div className="space-y-2">
                        <Label>Order Type</Label>
                        <div className="flex space-x-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sale-checkbox"
                                    checked={adminInfo.orderType.includes('sale')}
                                    onCheckedChange={(e) => {
                                        setAdminInfo(prevState => ({
                                            ...adminInfo,
                                            orderType: e ? [...prevState.orderType, 'sale'] : prevState.orderType.filter(o => o === 'sale')
                                        }));
                                    }}
                                />
                                <Label htmlFor="sale-checkbox">Sale</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="rental-checkbox"
                                    checked={adminInfo.orderType.includes('rental')}
                                    onCheckedChange={(e) => {
                                        setAdminInfo(prevState => ({
                                            ...adminInfo,
                                            orderType:  e ? [...prevState.orderType, 'rental'] : prevState.orderType.filter(o => o === 'rental')
                                        }));
                                    }}
                                />
                                <Label htmlFor="rental-checkbox">Rental</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="perm-signs-checkbox"
                                    checked={adminInfo.orderType.includes('permanent signs')}
                                    onCheckedChange={(e) => {
                                        setAdminInfo(prevState => ({
                                            ...adminInfo,
                                            orderType: e ? [...prevState.orderType, 'permanent signs'] : prevState.orderType.filter(o => o === 'permanent signs')
                                        }));
                                    }}
                                />
                                <Label htmlFor="perm-signs-checkbox">Permanent Signs</Label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {adminInfo.orderType.includes('rental') && <div className="w-1/4 flex space-x-2 mt-4">
                    <div className="space-y-2 flex-1">
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
                </div>}
        </div>
    );
}