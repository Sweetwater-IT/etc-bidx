'use client'

import { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Job {
    id: number;
    jobNumber: string;
    contractor: string;
    contractNumber: string;
}

interface ISelectJob {
    selectedJob?: any | null;
    onChange: (job: any) => void;
    onChangeQuote: (data: any) => void;
    quoteData: any
}

const SelectBid = ({ selectedJob, onChange, quoteData, onChangeQuote }: ISelectJob) => {
    const [bids, setBids] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchBids = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/active-bids/simpleList/");
            const result = await response.json();

            if (result.data) {
                setBids(result.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBids();
    }, []);

    useEffect(() => {
        if (bids?.length > 0 && quoteData?.job_id) {
            const findBid = bids.find((j) => j.id === quoteData?.job_id)
            if (findBid) {
                onChange(findBid)
            }
        }
    }, [bids, quoteData?.job_id]);

    return (
        <Select
            onValueChange={(value) => {
                const job = bids.find(j => j.id.toString() === value);
                if (job) onChange(job);
            }}
            value={selectedJob?.id?.toString()}
            disabled={loading}
        >
            <SelectTrigger className="w-[300px]">
                <SelectValue placeholder={loading ? "Loading..." : "Choose an option"} />
            </SelectTrigger>
            <SelectContent>
                {bids.map((bid: any) => (
                    <SelectItem key={bid.id} value={bid.id.toString()}>
                        {bid?.admin_data?.contractNumber ?? '-'}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};


export default SelectBid;
