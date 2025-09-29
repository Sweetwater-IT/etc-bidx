'use client'

import { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader } from "lucide-react";

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

const SelectJob = ({ selectedJob, onChange, quoteData, onChangeQuote }: ISelectJob) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);

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
                if (job) onChange(job);
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
