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
    const { dispatch, mptRental } = useEstimate();
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
                ...(phase.mpt_primary_signs.map((e) => ({ ...e, displayStructure: e.display_structure || e.displayStructure })) || []),
                ...(phase.mpt_secondary_signs.map((e) => ({ ...e, displayStructure: e.display_structure || e.displayStructure })) || [])
            ]
             
            allSigns.forEach(sign => {
                dispatch({
                    type: 'ADD_MPT_SIGN',
                    payload: {
                        phaseNumber: currentPhase,
                        sign: {
                            ...sign,
                            id: generateUniqueId(),
                            displayStructure: sign.displayStructure || `${sign.height}' ${sign.associatedStructure.toUpperCase()}`
                        }
                    }
                });
            });

            const sumEquipment = {
                BLights: allSigns.reduce((acc, s) => acc + (s.bLights || 0), 0),
                covers: allSigns.reduce((acc, s) => acc + (s.cover ? 1 : 0), 0),
                sandbag: allSigns.reduce((acc, s) => acc + (s.associatedStructure === 'sandbag' ? 1 : 0), 0),
                fourFootTypeIII: allSigns.reduce((acc, s) => acc + (s.associatedStructure === 'fourFootTypeIII' ? 1 : 0), 0),
                sixFootWings: allSigns.reduce((acc, s) => acc + (s.associatedStructure === 'sixFootWings' ? 1 : 0), 0),
                hStand: allSigns.reduce((acc, s) => acc + (s.associatedStructure === 'hStand' ? 1 : 0), 0),
                metalStands: allSigns.reduce((acc, s) => acc + (s.associatedStructure === 'metalStands' ? 1 : 0), 0),
                post: allSigns.reduce((acc, s) => acc + (s.associatedStructure === 'post' ? 1 : 0), 0),
                sharps: allSigns.reduce((acc, s) => acc + (s.associatedStructure === 'sharps' ? 1 : 0), 0),
                ACLights: allSigns.reduce((acc, s) => acc + (s.associatedStructure === 'ACLights' ? 1 : 0), 0),
                HIVP: allSigns.reduce((acc, s) => acc + (s.associatedStructure === 'HIVP' ? 1 : 0), 0),
                TypeXIVP: allSigns.reduce((acc, s) => acc + (s.associatedStructure === 'TypeXIVP' ? 1 : 0), 0)
            };

            dispatch({
                type: 'UPDATE_MPT_PHASE',
                payload: {
                    phaseNumber: currentPhase,
                    updatedPhaseData: {
                        ...phase,
                        standardEquipment: {
                            BLights: {
                                quantity: (phase.BLights?.quantity || 0) + (mptRental.phases[currentPhase].standardEquipment?.BLights?.quantity || 0) + sumEquipment.BLights,
                                emergencyRate: (phase.BLights?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.BLights?.emergencyRate || 0)
                            },
                            covers: {
                                quantity: (phase.covers?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.covers?.quantity || 0) + sumEquipment.covers,
                                emergencyRate: (phase.covers?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.covers?.emergencyRate || 0)
                            },
                            sandbag: {
                                quantity: (phase.sandbag?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.sandbag?.quantity || 0) + sumEquipment.sandbag,
                                emergencyRate: (phase.sandbag?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.sandbag?.emergencyRate || 0)
                            },
                            fourFootTypeIII: {
                                quantity: (phase.fourFootTypeIII?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.fourFootTypeIII?.quantity || 0) + sumEquipment.fourFootTypeIII,
                                emergencyRate: (phase.fourFootTypeIII?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.fourFootTypeIII?.emergencyRate || 0)
                            },
                            sixFootWings: {
                                quantity: (phase.sixFootWings?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.sixFootWings?.quantity || 0) + sumEquipment.sixFootWings,
                                emergencyRate: (phase.sixFootWings?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.sixFootWings?.emergencyRate || 0)
                            },
                            hStand: {
                                quantity: (phase.hStand?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.hStand?.quantity || 0) + sumEquipment.hStand,
                                emergencyRate: (phase.hStand?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.hStand?.emergencyRate || 0)
                            },
                            metalStands: {
                                quantity: (phase.metalStands?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.metalStands?.quantity || 0) + sumEquipment.metalStands,
                                emergencyRate: (phase.metalStands?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.metalStands?.emergencyRate || 0)
                            },
                            post: {
                                quantity: (phase.post?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.post?.quantity || 0) + sumEquipment.post,
                                emergencyRate: (phase.post?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.post?.emergencyRate || 0)
                            },
                            sharps: {
                                quantity: (phase.sharps?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.sharps?.quantity || 0) + sumEquipment.sharps,
                                emergencyRate: (phase.sharps?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.sharps?.emergencyRate || 0)
                            },
                            ACLights: {
                                quantity: (phase.ACLights?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.ACLights?.quantity || 0) + sumEquipment.ACLights,
                                emergencyRate: (phase.ACLights?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.ACLights?.emergencyRate || 0)
                            },
                            HIVP: {
                                quantity: (phase.HIVP?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.HIVP?.quantity || 0) + sumEquipment.HIVP,
                                emergencyRate: (phase.HIVP?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.HIVP?.emergencyRate || 0)
                            },
                            TypeXIVP: {
                                quantity: (phase.TypeXIVP?.quantity || 0) + (mptRental.phases[currentPhase]?.standardEquipment.TypeXIVP?.quantity || 0) + sumEquipment.TypeXIVP,
                                emergencyRate: (phase.TypeXIVP?.emergencyRate || 0) + (mptRental.phases[currentPhase]?.standardEquipment.TypeXIVP?.emergencyRate || 0)
                            }
                        }
                    }
                }
            });

        });
    }, [dispatch, currentPhase, selectedPhases, mptRental.phases]);

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
                const phaseName = p.name || `Phase ${phaseIndex + 1}`;
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
                                    const phaseName = phase.name || `Phase ${phaseIndex + 1}`;
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