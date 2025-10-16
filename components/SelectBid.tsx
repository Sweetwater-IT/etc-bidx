'use client'

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
import { Loader } from "lucide-react"

interface Bid {
    id: number
    admin_data?: {
        contractNumber?: string
        owner?: string
        lettingDate?: string
    }
    contractor_name?: string | null
}

interface ISelectBid {
    selectedBid?: Bid | null
    onChange: (bid: Bid) => void
    quoteData: any;
    extraFunctionCall?: (bid: any) => void | Promise<void>;
}

const SelectBid = ({ selectedBid, onChange, quoteData, extraFunctionCall }: ISelectBid) => {
    const [bids, setBids] = useState<Bid[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const fetchBids = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/active-bids/simpleList/")
            const result = await response.json()
            if (result.data) {
                setBids(result.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBids()
    }, [])

    useEffect(() => {

        if (bids?.length > 0 && quoteData?.ecsm_contract_number) {
            const findBid = bids.find((b) => b?.admin_data?.contractNumber === quoteData?.ecsm_contract_number)
            if (findBid) {
                onChange(findBid)
            }
        }
    }, [bids, quoteData?.ecsm_contract_number])

    return (
        <div className="w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader className="animate-spin w-4 h-4 text-gray-600" />
                                <span>Loading...</span>
                            </div>) : (
                            selectedBid ? selectedBid.admin_data?.contractNumber : "Select bid"
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
                    <Command style={{ width: '100%' }} className="w-full">
                        <CommandInput placeholder="Search bid..." />
                        <CommandList>
                            <CommandEmpty>No bid found.</CommandEmpty>
                            <CommandGroup>
                                {bids.map((bid) => (
                                    <CommandItem
                                        key={bid.id}
                                        value={bid.id.toString()}
                                        onSelect={() => {
                                            onChange(bid)
                                            setOpen(false)
                                            if (extraFunctionCall) {
                                                extraFunctionCall(bid)
                                            }
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {bid.admin_data?.contractNumber || 'N/A'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {bid.contractor_name || bid.admin_data?.owner || "Unknown"}{" "}
                                                – {bid.admin_data?.lettingDate?.split("T")[0] || "No date"}
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

export default SelectBid
