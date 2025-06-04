'use client'
import { EstimateProvider } from "@/contexts/EstimateContext";
import ActiveBidHeader from "../ActiveBidHeader";
import BidViewOnlyContainer from "@/components/pages/active-bid/steps/bid-view-only-container";
import StepsMain from "@/components/pages/steps-main";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useLoading } from "@/hooks/use-loading";

function formatCreatedAt(value: string) {
    const dateStr = value.split("T")[0]; // Gets "2025-05-26"
    const [year, month, day] = dateStr.split("-");
    const utcDate = new Date(
        Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
    );

    // Use native JavaScript methods to format in UTC
    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const monthName = monthNames[utcDate.getUTCMonth()];
    const dayNum = utcDate.getUTCDate();
    const yearNum = utcDate.getUTCFullYear();

    const hoursValue = parseInt(value.split("T")[1].split(':')[0])
    const amOrPm = hoursValue > 12 ? 'PM' : 'AM'
    const hoursFormatted = hoursValue > 12 ? hoursValue - 12 : hoursValue
    const timestamp = ', ' + hoursFormatted + ':' + value.split("T")[1].split(':')[1] + amOrPm

    return `${monthName} ${dayNum}, ${yearNum}${timestamp}`;
}

function ActiveBidContent({ mode }: { mode: string }) {

    const [bidStatus, setBidStatus] = useState<string>();
    const [createdAt, setCreatedAt] = useState<string>();

    const { startLoading, stopLoading } = useLoading()

    const searchParams = useSearchParams();

    const contractNumber = searchParams?.get('contractNumber')

    useEffect(() => {

        const getEstimateMetadata = async () => {
            startLoading();
            if (contractNumber && contractNumber !== '') {
                const estimateResponse = await fetch('/api/active-bids/' + contractNumber);

                if (!estimateResponse.ok) {
                    toast.error('Error retrieving estimate status and contractor')
                }
                else {
                    const data = await estimateResponse.json();
                    setBidStatus(data.data.status)
                    setCreatedAt(data.data.created_at)
                }
            }
            stopLoading();
        }

        if (mode !== 'new') {
            getEstimateMetadata();
        }
    }, [mode])

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div className="relative">
                        <EstimateProvider>
                            <ActiveBidHeader createdAt={createdAt ? formatCreatedAt(createdAt) : ''} status={bidStatus ?? ''} mode={mode as 'view' | 'new' | 'edit'} />
                            {mode === 'view' ? <BidViewOnlyContainer /> : <StepsMain />}
                        </EstimateProvider>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActiveBidContent