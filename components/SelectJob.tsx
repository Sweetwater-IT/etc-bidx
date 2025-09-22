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
            value={selectedJob?.id?.toString()} // <-- usar el ID, no job_number
            disabled={loading}
        >
            <SelectTrigger className="w-[300px]">
                <SelectValue placeholder={loading ? "Loading..." : "Choose an option"} />
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
