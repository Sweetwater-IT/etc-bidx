'use client'

import { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader } from "lucide-react";


interface ISelectJob {
    selectedJob?: any | null;
    onChange: (job: any) => void;
    onChangeQuote: (data: any) => void;
    quoteData: any
}

const SelectJob = ({ selectedJob, onChange, quoteData, onChangeQuote }: ISelectJob) => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedJob) return;
        const job = selectedJob;

        const today = new Date();
        const start = job.admin_data?.startDate ? new Date(job.admin_data.startDate) : today;
        const end = job.admin_data?.endDate ? new Date(job.admin_data.endDate) : today;
        const duration = start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        onChangeQuote((prev) => ({
            ...prev,
            customer: prev.customer || job?.customer || "",
            customer_name: prev.customer_name || job?.customer_name || "",
            customer_email: prev.customer_email || job?.customer_email || "",
            customer_phone: prev.customer_phone || job?.customer_phone || "",
            customer_address: prev.customer_address || job?.customer_address || "",
            customer_contact: prev.customer_contact || job?.customer_contact || "",
            customer_job_number: prev.customer_job_number || job?.admin_data?.contractNumber || "",
            etc_job_number: prev.etc_job_number || job.job_number || "",
            purchase_order: prev.purchase_order || "",
            township: prev.township || job.admin_data?.location || "",
            county: prev.county || job.admin_data?.county?.name || "",
            sr_route: prev.sr_route || job.admin_data?.srRoute || "",
            job_address: prev.job_address || job.admin_data?.location || "",
            ecsm_contract_number: prev.ecsm_contract_number || job.admin_data?.contractNumber || "",
            bid_date: prev.bid_date || (job.admin_data?.lettingDate ? new Date(job.admin_data.lettingDate).toISOString().slice(0, 10) : ""),
            start_date: prev.start_date || (start ? start.toISOString().slice(0, 10) : ""),
            end_date: prev.end_date || (end ? end.toISOString().slice(0, 10) : ""),
            duration: prev.duration || duration,
            job_id: job.id,
        }));
    }, [selectedJob, onChangeQuote]);


    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/jobs/simpleList/");
            const result = await response.json();

            if (result.data) {
                setJobs(result.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        if (jobs?.length > 0 && quoteData?.job_id) {
            const findJob = jobs.find((j) => j.id === quoteData?.job_id)
            if (findJob) {
                onChange(findJob)
            }
        }
    }, [jobs, quoteData?.job_id]);

    return (
        <Select
            onValueChange={(value) => {
                const job = jobs.find(j => j.id.toString() === value);
                if (job) {
                    onChange(job);
                    onChangeQuote((prev) => ({
                        ...prev,
                        customer: job?.customer || "",
                        customer_name: job?.customer_name || "",
                        customer_email: job?.customer_email || "",
                        customer_phone: job?.customer_phone || "",
                        customer_address: job?.customer_address || "",
                        customer_contact: job?.customer_contact || "",
                        customer_job_number: job?.admin_data?.contractNumber || "",
                        etc_job_number: job.job_number || "",
                        purchase_order: "",
                        township: job.admin_data?.location || "",
                        county: job.admin_data?.county?.name || "",
                        sr_route: job.admin_data?.srRoute || "",
                        job_address: job.admin_data?.location || "",
                        ecsm_contract_number: job.admin_data?.contractNumber || "",
                        bid_date: job.admin_data?.lettingDate ? new Date(job.admin_data.lettingDate).toISOString().slice(0, 10) : "",
                        start_date: job.admin_data?.startDate ? new Date(job.admin_data.startDate).toISOString().slice(0, 10) : "",
                        end_date: job.admin_data?.endDate ? new Date(job.admin_data.endDate).toISOString().slice(0, 10) : "",
                        duration: job.admin_data?.startDate && job.admin_data?.endDate
                            ? Math.ceil((new Date(job.admin_data.endDate).getTime() - new Date(job.admin_data.startDate).getTime()) / (1000 * 60 * 60 * 24))
                            : 0,
                        job_id: job.id,
                    }));
                }
            }}
            value={selectedJob?.id?.toString()}
            disabled={loading}
        >
            <SelectTrigger className="w-[300px] flex items-center justify-between">
                {loading ? (
                    <div className="flex items-center gap-2">
                        <Loader className="animate-spin w-4 h-4 text-gray-600" />
                        <span>Loading...</span>
                    </div>
                ) : (
                    <SelectValue placeholder="Choose an option" />
                )}
            </SelectTrigger>
            <SelectContent>
                {jobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                        {job?.job_number}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};


export default SelectJob;
