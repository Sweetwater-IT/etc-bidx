"use client";

import { Button } from "@/components/ui/button";
import SignSummaryAccordion from "@/components/pages/active-bid/sign-summary-accordion/sign-summary-accordion";
import { useEffect, useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { exportSignListToExcel } from "@/lib/exportSignListToExcel";
import { SignOrderList } from "./SignOrderList";
import { SignOrderAdminInfo } from "./SignOrderAdminInfo";
import { toast } from "sonner";
import { User } from "@/types/User";
import { Customer } from "@/types/Customer";

interface AdminInfo {
    requestor : User | null
    customer: Customer | null
    orderDate: string
    needDate: string
    jobType: string
    sale: boolean
    rental: boolean
    selectedBranch: string
    prevBranch: string
    jobNumber: string
    isSubmitting: boolean
}

export default function SignFormContent() {
    const { dispatch, mptRental } = useEstimate();

    // Set up admin info state in the parent component
    const [adminInfo, setAdminInfo] = useState<AdminInfo>({
        requestor: null,
        customer: null,
        orderDate: new Date().toISOString().split('T')[0],
        needDate: new Date().toISOString().split('T')[0],
        jobType: "",
        sale: false,
        rental: false,
        selectedBranch: "All",
        prevBranch: "All", // Used to track branch changes
        jobNumber: "",
        isSubmitting: false
    });

    // Initialize MPT rental data
    useEffect(() => {
        dispatch({type: 'ADD_MPT_RENTAL'});
        dispatch({type: 'ADD_MPT_PHASE'});
    }, []);

    // Handle saving the sign order
    const handleSave = async () => {
        // Prevent multiple submissions
        if (adminInfo.isSubmitting) return;
        
        try {
            setAdminInfo(prev => ({ ...prev, isSubmitting: true }));
            
            // Validate required fields
            if (!adminInfo.requestor) {
                toast.error("Please select a requestor");
                return;
            }
            
            if (!adminInfo.customer) {
                toast.error("Please select a contractor");
                return;
            }
            
            if (!adminInfo.jobType) {
                toast.error("Please select a job type");
                return;
            }
            
            if (!adminInfo.sale && !adminInfo.rental) {
                toast.error("Please select at least one order type (Sale or Rental)");
                return;
            }
            
            // Prepare data for submission
            const signOrderData = {
                requestor: adminInfo.requestor.name!,
                contractor_id: adminInfo.customer.id!,
                order_date: new Date(adminInfo.orderDate).toISOString(),
                need_date: new Date(adminInfo.needDate).toISOString(),
                job_type: adminInfo.jobType,
                sale: adminInfo.sale,
                rental: adminInfo.rental,
                job_number: adminInfo.jobNumber,
                signs: mptRental.phases[0].signs || {} // Access the signs from mptRental context
            };
            
            // Submit data to the API
            const response = await fetch('/api/sign-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signOrderData),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save sign order');
            }
            
            // Show success message
            toast.success("Sign order saved successfully");
            
        } catch (error) {
            console.error('Error saving sign order:', error);
            toast.error(error as string || 'Failed to save sign order');
        } finally {
            setAdminInfo(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex items-center justify-between border-b px-6 py-3">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold">Sign Order</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={handleSave}
                        disabled={adminInfo.isSubmitting}
                    >
                        {adminInfo.isSubmitting ? "Saving..." : "Save Order"}
                    </Button>
                    <Button>
                        Send Order
                    </Button>
                    <Button variant="outline" onClick={() => exportSignListToExcel('', mptRental)}>Export</Button>
                </div>
            </div>

            <div className="flex gap-6 p-6 max-w-full">
                {/* Main Form Column (2/3) */}
                <div className="flex-3/4 space-y-6">
                    <SignOrderAdminInfo 
                        adminInfo={adminInfo}
                        setAdminInfo={setAdminInfo}
                    />
                    <SignOrderList/>
                </div>

                {/* Right Column (1/3) */}
                <div className="flex-1/4 space-y-6">
                    <SignSummaryAccordion currentPhase={0} currentStep={3} />
                </div>
            </div>
        </div>
    );
}