"use client"

import { useEffect, useState } from "react"
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface Job {
    id: number
    job_number: string
    admin_data?: {
        contractNumber?: string
        owner?: string
    }
    contractor_name?: string | null
}

interface ISelectJob {
    selectedJob?: Job | null
    onChange: (job: Job) => void
    onChangeQuote: (data: any) => void
    quoteData: any
}

const SelectJob = ({ selectedJob, onChange, quoteData }: ISelectJob) => {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const fetchJobs = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/jobs/simpleList/")
            const result = await response.json()
            if (result.data) {
                setJobs(result.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchJobs()
    }, [])

    useEffect(() => {
        if (jobs?.length > 0 && quoteData?.job_id) {
            const findJob = jobs.find((j) => j.id === quoteData?.job_id)
            if (findJob) {
                onChange(findJob)
            }
        }
    }, [jobs, quoteData?.job_id])

    return (
        <div className="w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                    >
                        {selectedJob ? selectedJob.job_number : "Select job..."}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
                    <Command style={{ width: '100%' }} className="w-full">
                        <CommandInput placeholder="Search job..." />
                        <CommandList>
                            <CommandEmpty>No job found.</CommandEmpty>
                            <CommandGroup>
                                {jobs.map((job) => (
                                    <CommandItem
                                        key={job.id}
                                        value={job.job_number}
                                        onSelect={() => {
                                            onChange(job)
                                            setOpen(false)
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{job.job_number}</span>
                                            <span className="text-xs text-gray-500">
                                                {job.contractor_name ||
                                                    job.admin_data?.owner ||
                                                    "Unknown"}{" "}
                                                – {job.admin_data?.contractNumber || "N/A"}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

        </div>
    )
}

export default SelectJob
