// SignOrderAdminInfo.jsx - Updated to use custom SignOrderJobSelector
"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import { User } from "@/types/User";
import { fetchReferenceData } from "@/lib/api-client";
import { SignOrderAdminInformation } from "../sign-order/SignOrderContentSimple";
import { MPTRentalEstimating } from "@/types/MPTEquipment";
import { SignOrderJobSelector } from "./SignOrderJobSelector"; // Import the custom component
import { SignOrderDetailsSheet } from "../sign-order/SignOrderDetailsSheet";
import { useSidebar } from "@/components/ui/sidebar";
import { useCustomers } from "@/hooks/use-customers";

interface Job {
    job_number: string;
    branch: string;
    contractNumber?: string;
    mpt_rental?: MPTRentalEstimating | undefined;
    contractorName?: string;
}

interface Estimate {
    contract_number: string;
    branch: string;
    contractorName?: string;
}

export function SignOrderAdminInfo({
    adminInfo,
    setAdminInfo,
    showInitialAdminState
}: { adminInfo: SignOrderAdminInformation, setAdminInfo: Dispatch<SetStateAction<SignOrderAdminInformation>>, showInitialAdminState: boolean }) {
    const { customers, getCustomers, isLoading } = useCustomers();

    // State for local UI management
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);

    const { setOpen } = useSidebar();

    useEffect(() => {
        setOpen(false)
    }, [setOpen])

    // Job selector state
    const [selectedContractJob, setSelectedContractJob] = useState<Estimate | Job | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<'edit' | 'create'>('edit');

    // Fetch data on component mount
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

    const handleJobCreated = (newJob: Job) => {
        // Add the new job to the jobs list (optional - for immediate availability in dropdown)
        setAllJobs(prev => [...prev, newJob]);

        // Set this new job as selected
        setSelectedContractJob(newJob);

        // Clear search
        setSearchValue("");
    };

    // Fetch jobs data
    const fetchJobs = async () => {
        try {
            setIsLoadingJobs(true);
            const response = await fetch('/api/takeoffs/job-data');
            const data = await response.json();

            if (response.ok) {
                setAllJobs(data.data || []);
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

    // Handle contract/job selection
    const handleContractJobSelect = (contractJob: Estimate | Job | null) => {
        setSelectedContractJob(contractJob);

        if (contractJob) {
            // Check if it's a job or estimate
            if ('job_number' in contractJob) {
                // It's a job
                const associatedCustomer = customers.find(c => c.name === contractJob.contractorName);
                setAdminInfo(prev => ({
                    ...prev,
                    jobNumber: contractJob.job_number,
                    contractNumber: contractJob.contractNumber || '',
                    customer: associatedCustomer || null,
                    selectedBranch: contractJob.branch
                }));
            } else {
                // It's an estimate
                const associatedCustomer = customers.find(c => c.name === contractJob.contractorName);
                setAdminInfo(prev => ({
                    ...prev,
                    jobNumber: '',
                    contractNumber: contractJob.contract_number,
                    customer: associatedCustomer || null,
                    selectedBranch: contractJob.branch
                }));
            }
            setSheetOpen(true)
        } else {
            // Clear selection
            setAdminInfo(prev => ({
                ...prev,
                jobNumber: '',
                contractNumber: '',
                customer: null
            }));
        }
    };

    // Handle add new contract/job
    const handleAddNew = () => {
        setSheetMode('create');
        setSheetOpen(true);
    };

    // Handle edit contract/job
    const handleEdit = () => {
        setSheetMode('edit');
        setSheetOpen(true);
    };

    // Update branch when requestor changes
    useEffect(() => {
        if (adminInfo.requestor && adminInfo.requestor.branches) {
            setAdminInfo(prev => ({
                ...prev,
                selectedBranch: (adminInfo.requestor && adminInfo.requestor.branches) ? adminInfo.requestor.branches.name : ''
            }));
        }
    }, [adminInfo.requestor]);

    // Format dates for display
    const formatDateForDisplay = (date: Date) => {
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            {/* Job Selector */}
            <SignOrderJobSelector
                allJobs={allJobs}
                selectedContractJob={selectedContractJob}
                onSelect={handleContractJobSelect}
                onAddNew={handleAddNew}
                onEdit={handleEdit}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                customer={adminInfo.customer?.displayName}
                requestor={adminInfo.requestor?.name}
                branch={adminInfo.selectedBranch}
                orderDate={formatDateForDisplay(adminInfo.orderDate)}
                needDate={adminInfo.needDate ? formatDateForDisplay(adminInfo.needDate): undefined}
                startDate={adminInfo.startDate ? formatDateForDisplay(adminInfo.startDate) : undefined}
                endDate={adminInfo.endDate ? formatDateForDisplay(adminInfo.endDate) : undefined}
                orderType={adminInfo.orderType}
                contractNumber={adminInfo.contractNumber}
                showInitialAdminState={showInitialAdminState}
                // jobNumber={adminInfo.jobNumber}        // Add this
            />
            <SignOrderDetailsSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                adminInfo={adminInfo}
                setAdminInfo={setAdminInfo}
                allUsers={allUsers}
                customers={customers}
                mode={sheetMode}
                onJobCreated={handleJobCreated} // Add this prop
            />
        </div>
    );
}