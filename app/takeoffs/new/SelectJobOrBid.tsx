'use client'

import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";
import { useEstimate } from "@/contexts/EstimateContext";
import { Copy, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ISelectJobOrBid {
    currentPhase: any;
}

const SelectJobOrBid = ({ currentPhase }: ISelectJobOrBid) => {
    const { dispatch } = useEstimate();

    const [selectedPhase, setSelectedPhase] = useState<any>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const getAllJobsWithSigns = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/jobs/getSignsJobs/');
            const resp = await response.json();
            if (resp.success) setJobs(resp.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopySignsFromPhase = useCallback((phase: any) => {
        if (!phase) return;

        const allSigns = [
            ...(phase.mpt_primary_signs || []),
            ...(phase.mpt_secondary_signs || [])
        ];

        allSigns.forEach(sign => {
            dispatch({
                type: 'ADD_MPT_SIGN',
                payload: {
                    phaseNumber: currentPhase,
                    sign: { ...sign, id: generateUniqueId() }
                }
            });
        });
    }, [dispatch, currentPhase]);

    useEffect(() => { getAllJobsWithSigns(); }, []);

    const filteredJobs = jobs
        .map((job, index) => ({
            ...job,
            phases: job.phases.filter((p: any) =>
                p.name.toLowerCase().includes(search.toLowerCase())
            )
        }))
        .filter(job => job.phases.length > 0);

    return (
        <div className="flex items-center flex-row gap-2">
            <DropdownMenu >
                <DropdownMenuTrigger className="border rounded-[10px] px-2 h-10 w-[300px] text-[14px] flex items-center justify-between">
                    {selectedPhase ? selectedPhase.name : loading ? "Loading..." : "Select phase"}
                    {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                </DropdownMenuTrigger>

                {!loading && (
                    <DropdownMenuContent className="w-[300px] p-2 max-h-80 overflow-y-auto text-sm">
                        <input
                            className="border rounded px-2 mb-2 w-full h-8 text-sm focus:outline-none"
                            placeholder="Search phases..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {filteredJobs.map((job, index) => (
                            <div key={job.id + " " + index} className="mb-1">
                                <div className="text-gray-600 font-semibold px-2 py-1 flex flex-row">
                                    {job.label}
                                    <span className="mx-2 text-gray-400">{`(${job?.status})`}</span>
                                    </div>
                            
                                {job.phases.map((phase: any, index) => (
                                    <DropdownMenuItem
                                        key={phase.id}
                                        className="pl-4"
                                        onSelect={() => {
                                            setSelectedPhase(phase);
                                        }}
                                    >
                                        <span className="font-medium">
                                            {"> " + (phase.name ? phase.name : "Phase " + index)}
                                        </span>
                                        <span className="text-gray-400">
                                            ({(phase.mpt_primary_signs?.length || 0) + (phase.mpt_secondary_signs?.length || 0)}) signs
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        ))}
                        {filteredJobs.length === 0 && (
                            <div className="text-sm text-gray-400 p-2">No results</div>
                        )}
                    </DropdownMenuContent>
                )}
            </DropdownMenu>

            <button
                type="button"
                className={`flex items-center px-3 py-2 rounded-[10px] border transition-colors ${selectedPhase
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                disabled={!selectedPhase}
                onClick={() => handleCopySignsFromPhase(selectedPhase)}
            >
                <Copy className="w-4 h-4 mr-2" />
                Import signs
            </button>
        </div>
    );
};

export default SelectJobOrBid;
