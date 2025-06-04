'use client'
import { EstimateProvider } from "@/contexts/EstimateContext";
import ActiveBidHeader from "../ActiveBidHeader";
import BidViewOnlyContainer from "@/components/pages/active-bid/steps/bid-view-only-container";
import StepsMain from "@/components/pages/steps-main";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function ActiveBidContent({ mode }: { mode: string }) {

    const [bidStatus, setBidStatus] = useState<string>();

    const searchParams = useSearchParams();

    const contractNumber = searchParams?.get('contractNumber')

    useEffect(() => {

        const getEstimateMetadata = async () => {
            if(contractNumber && contractNumber !== ''){
                const estimateResponse = await fetch('/api/active-bids/' + contractNumber);

                if(!estimateResponse.ok){
                    toast.error('Error retrieving estimate status and contractor')
                }
                else {
                    const data = await estimateResponse.json();
                    setBidStatus(data.data.status)
                }
            }
        }

        if(mode !== 'new'){
            getEstimateMetadata();
        }
    }, [mode])

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div>
                        <EstimateProvider>
                            <div className="mb-6 px-6">
                                <ActiveBidHeader status={bidStatus ?? ''} mode={mode as 'view' | 'new' | 'edit'} />
                            </div>
                            {mode === 'view' ? <BidViewOnlyContainer /> : <StepsMain />}
                        </EstimateProvider>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActiveBidContent