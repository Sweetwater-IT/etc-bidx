"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog"
import { Loader2 } from "lucide-react"

type JobDetails = {
    jobNumber: string
    contractNumber: string
    contractor: string
    projectStatus: string
    billingStatus: string
    startDate: string
    endDate: string
}

interface IJobNumberPicker {
    setCustomJobNumber: (value: any) => void;
    customJobNumber: number;
    validJobNumber: (value: boolean) => void;
    initialValueNumber?: any;
    setvalidatingExistJob: (value: boolean) => void;
    validatingExistJob: boolean
}

export default function JobNumberPicker({
    customJobNumber,
    setCustomJobNumber,
    validJobNumber,
    initialValueNumber,
    setvalidatingExistJob,
    validatingExistJob
}: IJobNumberPicker) {
    const [year, setYear] = useState<number | null>(null)
    const [range, setRange] = useState(100)
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
    const [jobDetails, setJobDetails] = useState<JobDetails | null>(null)
    const [modalState, setModalState] = useState(false)
    const [inputError, setInputError] = useState<string>("")

    const currentYear = new Date().getFullYear()
    const [yearStart, setYearStart] = useState(currentYear - 2)
    const years = Array.from({ length: 6 }, (_, i) => yearStart + i)

    const handlePrevYears = () => setYearStart(yearStart - 6)
    const handleNextYears = () => setYearStart(yearStart + 6)

    const toggleModal = () => setModalState((prev) => !prev)

    const numbers = Array.from({ length: 100 }, (_, i) => i + (range - 99))

    const existJobNumber = async (yr: number, sequential: number) => {
        setvalidatingExistJob(true)
        try {
            const response = await fetch(
                `/api/jobs/existJob?year=${yr}&sequential=${sequential}`
            )
            const result = await response.json()

            if (result.exist && result.data) {
                const job = result.data.jobs?.[0]

                if (job) {
                    const details: JobDetails = {
                        jobNumber: result.data.job_number,
                        contractNumber:
                            job.admin_data_entries?.contract_number ??
                            job.project_metadata?.customer_contract_number ??
                            "",
                        contractor: job.project_metadata?.contractors?.name ?? "",
                        projectStatus: job.project_status ?? "",
                        billingStatus: job.billing_status ?? "",
                        startDate: job.admin_data_entries?.start_date
                            ? new Date(job.admin_data_entries.start_date).toLocaleDateString()
                            : "",
                        endDate: job.admin_data_entries?.end_date
                            ? new Date(job.admin_data_entries.end_date).toLocaleDateString()
                            : "",
                    }

                    setCustomJobNumber(null)
                    setJobDetails(details)
                    setInputError("⚠️ Job number already exists")
                    validJobNumber(false)
                } else {
                    validJobNumber(true)
                    setJobDetails(null)
                    setInputError("")
                }
            } else {
                setJobDetails(null)
                setInputError("")
                validJobNumber(true)
            }
        } catch (error) {
            console.error(error)
            setInputError("Error validating job number")
        } finally {
            setvalidatingExistJob(false)
        }
    }

    useEffect(() => {
        if (!customJobNumber) return

        const val = customJobNumber.toString()
        if (val.length < 5) return;

        const yr = parseInt(val.substring(0, 4))
        const seq = parseInt(val.substring(4))

        if (isNaN(yr) || isNaN(seq)) return

        setYear(yr)
        setSelectedNumber(seq)

        const timer = setTimeout(() => {
            existJobNumber(yr, seq)
        }, 500)

        return () => clearTimeout(timer)
    }, [customJobNumber])

    const handleSelectNumber = (num: number) => {
        if (!year) return

        setSelectedNumber(num)
        const jobNum = parseInt(`${year}${String(num).padStart(3, "0")}`)
        setCustomJobNumber(jobNum)
    }

    const handlePrevRange = () => {
        if (range > 100) setRange(range - 100)
    }

    const handleNextRange = () => {
        if (range < 1000) setRange(range + 100)
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col items-start gap-2 w-full">
                <Input
                    placeholder="Enter job number (Ex. 2025001)"
                    onChange={(e) => setCustomJobNumber(Number(e.target.value))}
                    value={customJobNumber || initialValueNumber || ""}
                />
                {inputError && <p className="text-red-500 text-sm">{inputError}</p>}
                {jobDetails && (
                    <div className="text-sm border p-2 rounded bg-muted w-full">
                        <p>
                            <b>Job Number:</b> {jobDetails.jobNumber ?? "-"}
                        </p>
                        <p>
                            <b>Contract:</b> {jobDetails.contractNumber ?? "-"}
                        </p>
                        <p>
                            <b>Contractor:</b> {jobDetails.contractor ?? "-"}
                        </p>
                        <p>
                            <b>Status:</b> {jobDetails.projectStatus ?? "-"}
                        </p>
                        <p>
                            <b>Billing:</b> {jobDetails.billingStatus ?? "-"}
                        </p>
                        <p>
                            <b>Start:</b> {jobDetails.startDate ?? "-"}
                        </p>
                        <p>
                            <b>End:</b> {jobDetails.endDate ?? "-"}
                        </p>
                    </div>
                )}
                <Button variant="outline" onClick={toggleModal}>
                    Build number
                </Button>
            </div>

            <Dialog open={modalState} onOpenChange={setModalState}>
                <DialogContent className="max-w-2xl w-full">
                    {validatingExistJob && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50 rounded">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    )}
                    <DialogTitle className="text-lg font-semibold">Build a working number</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Select a year and a number to build a job number
                    </p>
                    <div className="flex flex-col items-center w-full">
                        <div className="p-2 w-full">
                            <div className="flex justify-between items-center mb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={handlePrevYears}
                                >
                                    &lt;
                                </Button>
                                <span className="text-sm font-medium">
                                    {years[0]} – {years[years.length - 1]}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={handleNextYears}
                                >
                                    &gt;
                                </Button>
                            </div>

                            <div className="grid grid-cols-6 gap-1 py-2 w-full">
                                {years.map((y) => (
                                    <Button
                                        key={y}
                                        size="sm"
                                        variant={year === y ? "default" : "outline"}
                                        onClick={() => setYear(y)}
                                        className="h-8 px-2 text-xs w-full"
                                    >
                                        {y}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="p-2 w-full">
                            <div className="flex justify-between items-center mb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={handlePrevRange}
                                >
                                    &lt;
                                </Button>
                                <span className="text-sm font-medium">
                                    {range - 99} – {range}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={handleNextRange}
                                >
                                    &gt;
                                </Button>
                            </div>

                            <div className="grid grid-cols-10 gap-1 w-full">
                                {numbers.map((num) => (
                                    <Button
                                        key={num}
                                        size="sm"
                                        variant={selectedNumber === num ? "default" : "outline"}
                                        onClick={() => handleSelectNumber(num)}
                                        disabled={!year}
                                        className="h-8 px-1 text-xs w-full"
                                    >
                                        {num}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {
                        jobDetails &&
                        <p className="text-center mt-2 text-red-500">
                            Sorry, this work number already exists.
                        </p>
                    }
                </DialogContent>
            </Dialog>

        </div>
    )
}
