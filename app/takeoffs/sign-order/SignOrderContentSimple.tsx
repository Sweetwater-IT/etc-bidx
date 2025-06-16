"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { exportSignListToExcel } from "@/lib/exportSignListToExcel";
import { SignOrderList } from "../new/SignOrderList";
import { SignOrderAdminInfo } from "../new/SignOrderAdminInfo";
import { toast } from "sonner";
import { User } from "@/types/User";
import { Customer } from "@/types/Customer";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/dropzone";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import PageHeaderWithSaving from "@/components/PageContainer/PageHeaderWithSaving";

export type OrderTypes = 'sale' | 'rental' | 'permanent signs'

export interface SignOrderAdminInformation {
    requestor: User | null
    customer: Customer | null
    orderDate: Date
    needDate: Date
    orderType: OrderTypes[]
    selectedBranch: string
    jobNumber: string
    isSubmitting: boolean
    contractNumber: string
    startDate?: Date
    endDate?: Date
}

export default function SignOrderContentSimple() {
    const { dispatch, mptRental } = useEstimate();
    const router = useRouter();

    // Set up admin info state in the parent component
    const [adminInfo, setAdminInfo] = useState<SignOrderAdminInformation>({
        requestor: null,
        customer: null,
        orderDate: new Date(),
        needDate: new Date(),
        orderType: [],
        selectedBranch: "All",
        jobNumber: "",
        isSubmitting: false,
        contractNumber: ''
    });
    const [localFiles, setLocalFiles] = useState<File[]>([]);
    const [localNotes, setLocalNotes] = useState<string>();
    const [savedNotes, setSavedNotes] = useState<string>();

    // Initialize MPT rental data
    useEffect(() => {
        dispatch({ type: 'ADD_MPT_RENTAL' });
        dispatch({ type: 'ADD_MPT_PHASE' });
    }, [dispatch]);

    const fileUploadProps = useFileUpload({
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10, // Allow multiple files to be uploaded
        uniqueIdentifier: 100000,
        apiEndpoint: '/api/files/sign-orders',
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'application/zip': ['.zip'],
            'text/plain': ['.txt'],
            'text/csv': ['.csv']
        }
    });

    // Destructure needed properties
    const { files, successes, isSuccess } = fileUploadProps;

    // Use useEffect to update parent component's files state when upload is successful
    useEffect(() => {
        if (isSuccess && files.length > 0) {
            const successfulFiles = files.filter(file =>
                successes.includes(file.name)
            );

            if (successfulFiles.length > 0) {
                setLocalFiles(prevFiles => {
                    // Filter out duplicates
                    const filteredPrevFiles = prevFiles.filter(
                        prevFile => !successfulFiles.some(newFile => newFile.name === prevFile.name)
                    );
                    return [...filteredPrevFiles, ...successfulFiles];
                });
            }
        }
    }, [isSuccess, files, successes, setLocalFiles]);

    // Handle saving the sign order
    const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
        // Prevent multiple submissions
        if (adminInfo.isSubmitting) return;

        try {
            setAdminInfo(prev => ({ ...prev, isSubmitting: true }));

            // Validate required fields
            // if (!adminInfo.requestor) {
            //     toast.error("Please select a requestor");
            //     return;
            // }

            // if (!adminInfo.customer) {
            //     toast.error("Please select a contractor");
            //     return;
            // }

            // if (!adminInfo.orderType) {
            //     toast.error("Please select a job type");
            //     return;
            // }

            // Prepare data for submission
            const signOrderData = {
                requestor: adminInfo.requestor ? adminInfo.requestor : '',
                contractor_id: adminInfo.customer ? adminInfo.customer : undefined,
                contract_number: adminInfo.contractNumber,
                order_date: new Date(adminInfo.orderDate).toISOString(),
                need_date: new Date(adminInfo.needDate).toISOString(),
                start_date: adminInfo.startDate ? new Date(adminInfo.startDate).toISOString() : '',
                end_date: adminInfo.endDate ? new Date(adminInfo.endDate).toISOString() : '',
                order_type: adminInfo.orderType,
                job_number: adminInfo.jobNumber,
                signs: mptRental.phases[0].signs || {}, // Access the signs from mptRental context
                status
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

            // Redirect to sign order list page
            router.push('/takeoffs/load-sheet');

        } catch (error) {
            console.error('Error saving sign order:', error);
            toast.error(error as string || 'Failed to save sign order');
        } finally {
            setAdminInfo(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    return (
        <div className="flex flex-1 flex-col">
            <PageHeaderWithSaving
                heading='Create Sign Order'
                handleSubmit={() => handleSave('DRAFT')}
                showX
                saveButtons={
                    <div className="flex items-center gap-2">
                        {/**This should be a save and submit */}
                        <Button
                            onClick={() => handleSave('SUBMITTED')}
                            disabled={adminInfo.isSubmitting || mptRental.phases[0].signs.length === 0}
                        >
                            {adminInfo.isSubmitting ? "Saving..." : "Submit Order"}
                        </Button>
                        {/* <Button variant="outline" onClick={() => exportSignListToExcel('', mptRental)}>Export</Button> */}
                    </div>
                }
            />

            <div className="flex gap-6 p-6 max-w-full">
                {/* Main Form Column (3/4) */}
                <div className="w-3/4 space-y-6">
                    <SignOrderAdminInfo
                        adminInfo={adminInfo}
                        setAdminInfo={setAdminInfo}
                    />
                    <SignOrderList />
                </div>

                {/* Right Column (1/4) */}
                <div className="w-1/4 space-y-6">
                    <div className="border rounded-lg p-4">
                        <h2 className="mb-2 text-lg font-semibold">Files</h2>
                        <Dropzone {...fileUploadProps} className="p-8 cursor-pointer space-y-4">
                            <DropzoneContent />
                            <DropzoneEmptyState />
                        </Dropzone>
                    </div>
                    <div className="rounded-lg border p-4">
                        <h2 className="mb-2 text-lg font-semibold">Notes</h2>
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                                {savedNotes ? savedNotes : 'No notes saved for this takeoff'}
                            </div>
                            <Textarea
                                placeholder="Add notes here..."
                                value={localNotes}
                                onChange={(e) => setLocalNotes(e.target.value)}
                            />
                            <Button className="w-full" onClick={() => setSavedNotes(prevState => prevState ? prevState + ' ' + localNotes : localNotes)}>
                                Save Notes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
