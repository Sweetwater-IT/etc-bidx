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
    jobNumber?: any
    needJobNumber?: boolean;
    currentJob: any | null;
}



const SelectJobOrBid = ({ currentPhase, jobNumber, needJobNumber = false, currentJob = null }: ISelectJobOrBid) => {
    const { dispatch , mptRental} = useEstimate();
    const [selectedPhases, setSelectedPhases] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const getAllJobsWithSigns = async () => {
        setLoading(true);
        try {
            const url = needJobNumber ? `/api/jobs/getSignsJobs/${jobNumber ?? 0}` : '/api/jobs/getSignsJobs';
            const response = await fetch(url);
            const resp = await response.json();

            if (resp.success) {
                setJobs(Array.isArray(resp.data) ? resp.data : [resp.data]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopySignsFromPhases = useCallback(() => {
        selectedPhases.forEach(phase => {
            const allSigns = [
                ...(phase.mpt_primary_signs.map((e)=> ({...e, bLights: e.b_lights, displayStructure: e.display_structure}))  || []),
                ...(phase.mpt_secondary_signs.map((e)=> ({...e, bLights: e.b_lights, displayStructure: e.display_structure})) || [])
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
        });
    }, [dispatch, currentPhase, selectedPhases]);

    useEffect(() => {
        if (needJobNumber && jobNumber) getAllJobsWithSigns();
    }, [jobNumber, needJobNumber]);

    useEffect(() => {
        if (currentJob) {
            setJobs([currentJob])
        }
    }, [currentPhase, mptRental.phases]);

    const togglePhaseSelection = (phase: any) => {
        setSelectedPhases(prev => {
            if (prev.find(p => p.id === phase.id)) {
                return prev.filter(p => p.id !== phase.id);
            } else {
                return [...prev, phase];
            }
        });
    };

    const filteredJobs = jobs
        .map((job, jobIndex) => ({
            ...job,
            phases: job.phases.filter((p: any, phaseIndex: number) => {
                const phaseName = p.name || `Phase ${phaseIndex}`;
                return phaseName.toLowerCase().includes(search.toLowerCase());
            })
        }))
        .filter(job => job.phases.length > 0);    

    return (
        <div className="flex items-center flex-row gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger className="border rounded-[10px] px-2 h-10 w-[300px] text-[14px] flex items-center justify-between">
                    {selectedPhases.length > 0
                        ? `${selectedPhases.length} phase(s) selected`
                        : loading
                            ? "Loading..."
                            : "Select a phase"}
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
                        {filteredJobs.map((job, jobIndex) => (
                            <div key={job.id + " " + jobIndex} className="mb-1">
                                {job.phases.map((phase: any, phaseIndex: number) => {
                                    const phaseName = phase.name || `Phase ${phaseIndex}`;
                                    const checked = selectedPhases.find(p => p.id === phase.id);
                                    return (
                                        <DropdownMenuItem
                                            key={phase.id}
                                            className="pl-4 flex justify-between items-center"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                togglePhaseSelection({ ...phase, index: phaseIndex });
                                            }}
                                        >
                                            <span>{phaseName}</span>
                                            <input
                                                type="checkbox"
                                                checked={!!checked}
                                                readOnly
                                            />
                                        </DropdownMenuItem>
                                    )
                                })}
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
                className={`flex items-center px-3 py-2 rounded-[10px] border transition-colors ${selectedPhases.length > 0
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                disabled={selectedPhases.length === 0}
                onClick={handleCopySignsFromPhases}
            >
                <Copy className="w-4 h-4 mr-2" />
                Import signs
            </button>
        </div>
    );
};

export default SelectJobOrBid