"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
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
import { saveSignOrder } from "@/lib/api-client";
import isEqual from 'lodash/isEqual';

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

    // Autosave states
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());
    const [firstSaveTimestamp, setFirstSaveTimestamp] = useState<Date | null>(null);
    
    const saveTimeoutRef = useRef<number | null>(null);
    const updateTimeoutRef = useRef<number | null>(null);
    const lastSavedTime = useRef<number | null>(null);
    
    const prevStateRef = useRef({
        adminInfo,
        mptRental
    });

    // Initialize MPT rental data
    useEffect(() => {
        dispatch({ type: 'ADD_MPT_RENTAL' });
        dispatch({ type: 'ADD_MPT_PHASE' });
    }, [dispatch]);

    // Autosave effect
    useEffect(() => {
        // Check if there were any changes
        const hasAdminInfoChanged = !isEqual(adminInfo, prevStateRef.current.adminInfo);
        const hasMptRentalChanged = !isEqual(mptRental, prevStateRef.current.mptRental);

        const hasAnyStateChanged = hasAdminInfoChanged || hasMptRentalChanged;

        // Don't autosave if no contract number, no changes, or if it's never been saved
        if (!hasAnyStateChanged) {
            return;
        }

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for autosave
        saveTimeoutRef.current = window.setTimeout(() => {
            autosave();
        }, 5000);

    }, [adminInfo, mptRental]);

    // Timer for updating display text
    useEffect(() => {
        const updateTimer = () => {
            setCurrentTime(Date.now());
            updateTimeoutRef.current = window.setTimeout(updateTimer, 60000); // Update every minute
        };

        updateTimer();

        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    const autosave = async () => {
        setIsSaving(true);
        
        // Update the previous state reference
        prevStateRef.current = {
            adminInfo,
            mptRental
        };

        try {
            await handleSave('DRAFT', true); // Pass true to indicate this is an autosave
            lastSavedTime.current = Date.now();
        } catch (error) {
            console.error('Autosave failed:', error);
            // Don't show toast for autosave failures to avoid annoying the user
        } finally {
            setIsSaving(false);
        }
    };

    // Generate save status message
    const getSaveStatusMessage = () => {
        if (isSaving) return 'Saving...';

        if (!lastSavedTime.current && !firstSaveTimestamp) return 'Draft has not been saved';

        const saveTime = lastSavedTime.current || firstSaveTimestamp!.getTime();
        const secondsAgo = Math.floor((currentTime - saveTime) / 1000);

        if (secondsAgo < 60) {
            return `Saved just now`;
        } else if (secondsAgo < 3600) {
            const minutesAgo = Math.floor(secondsAgo / 60);
            return `Draft saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
        } else {
            const hoursAgo = Math.floor(secondsAgo / 3600);
            return `Draft saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
        }
    };

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
    const handleSave = async (status: 'DRAFT' | 'SUBMITTED', isAutosave = false) => {
        // Prevent multiple submissions
        if (adminInfo.isSubmitting && !isAutosave) return;

        try {
            if (!isAutosave) {
                setAdminInfo(prev => ({ ...prev, isSubmitting: true }));
            }

            const signOrderData = {
                requestor: adminInfo.requestor ? adminInfo.requestor : undefined,
                contractor_id: adminInfo.customer ? adminInfo.customer.id : undefined,
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
            const response = await saveSignOrder(signOrderData);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save sign order');
            }

            // Set first save timestamp if this is the first save
            if (!firstSaveTimestamp) {
                setFirstSaveTimestamp(new Date());
            }

            // Show success message only for manual saves
            if (!isAutosave) {
                toast.success("Sign order saved successfully");
                
                // Only redirect on submitted orders
                if (status === 'SUBMITTED') {
                    router.push('/takeoffs/load-sheet');
                }
            }

        } catch (error) {
            console.error('Error saving sign order:', error);
            if (!isAutosave) {
                toast.error(error as string || 'Failed to save sign order');
            }
            throw error; // Re-throw for autosave error handling
        } finally {
            if (!isAutosave) {
                setAdminInfo(prev => ({ ...prev, isSubmitting: false }));
            }
        }
    };

    return (
        <div className="flex flex-1 flex-col">
            <PageHeaderWithSaving
                heading='Create Sign Order'
                handleSubmit={() => handleSave('DRAFT')}
                showX
                saveButtons={
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                            {getSaveStatusMessage()}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => handleSave('SUBMITTED')}
                                disabled={adminInfo.isSubmitting || mptRental.phases[0].signs.length === 0}
                            >
                                {adminInfo.isSubmitting ? "Saving..." : "Submit Order"}
                            </Button>
                            {/* <Button variant="outline" onClick={() => exportSignListToExcel('', mptRental)}>Export</Button> */}
                        </div>
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