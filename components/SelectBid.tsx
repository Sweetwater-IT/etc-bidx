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


interface ISelectBid {
    selectedBid?: any | null
    onChange: (bid: any) => void
    quoteData: any;
    extraFunctionCall?: (bid: any) => void | Promise<void>;
    onChangeQuote: React.Dispatch<any>;
}

const normalizeText = (text: string = "") => {
    const map: Record<string, string> = {
        А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H", О: "O", Р: "P", С: "C", Т: "T", У: "Y", Х: "X",
        а: "a", в: "b", е: "e", к: "k", м: "m", н: "h", о: "o", р: "p", с: "c", т: "t", у: "y", х: "x",
    };
    return text
        .split("")
        .map((ch) => map[ch] || ch)
        .join("")
        .toLowerCase()
        .normalize("NFKD");
};

const SelectBid = ({ selectedBid, onChange, quoteData, extraFunctionCall, onChangeQuote }: ISelectBid) => {
    const [bids, setBids] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!selectedBid) return;

        const admin = selectedBid.admin_data || {};
        const start = admin.startDate ? new Date(admin.startDate) : null;
        const end = admin.endDate ? new Date(admin.endDate) : null;
        const duration = start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        onChangeQuote((prev: any) => ({
            ...prev,
            customer: prev.customer || selectedBid?.customer || "",
            customer_name: prev.customer_name || selectedBid?.customer_name || "",
            customer_email: prev.customer_email || selectedBid?.customer_email || "",
            customer_phone: prev.customer_phone || selectedBid?.customer_phone || "",
            customer_address: prev.customer_address || selectedBid?.customer_address || "",
            customer_contact: prev.customer_contact || selectedBid?.customer_contact || "",
            customer_job_number: prev.customer_job_number || admin.contractNumber || "",
            township: prev.township || admin.location || "",
            county: prev.county || admin.county?.name || "",
            sr_route: prev.sr_route || admin.srRoute || "",
            job_address: prev.job_address || admin.location || "",
            ecsm_contract_number: prev.ecsm_contract_number || admin.contractNumber || "",
            bid_date: prev.bid_date || (admin.lettingDate ? new Date(admin.lettingDate).toISOString().slice(0, 10) : ""),
            start_date: prev.start_date || (start ? start.toISOString().slice(0, 10) : ""),
            end_date: prev.end_date || (end ? end.toISOString().slice(0, 10) : ""),
            duration: prev.duration || duration,
            estimate_id: selectedBid?.id,
        }));
    }, [selectedBid, onChangeQuote]);

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

    const handleSelectBid = (bid: any) => {
        onChange(bid)

        const admin = bid.admin_data || {};
        const start = admin.startDate ? new Date(admin.startDate) : null;
        const end = admin.endDate ? new Date(admin.endDate) : null;
        const duration = start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        onChangeQuote((prev) => ({
            ...prev,
            customer: bid?.customer || "",
            customer_name: bid?.customer_name || "",
            customer_email: bid?.customer_email || "",
            customer_phone: bid?.customer_phone || "",
            customer_address: bid?.customer_address || "",
            customer_contact: bid?.customer_contact || "",
            customer_job_number: admin.contractNumber || "",
            township: admin.location || "",
            county: admin.county?.name || "",
            sr_route: admin.srRoute || "",
            job_address: admin.location || "",
            ecsm_contract_number: admin.contractNumber || "",
            bid_date: admin.lettingDate ? new Date(admin.lettingDate).toISOString().slice(0, 10) : "",
            start_date: start ? start.toISOString().slice(0, 10) : "",
            end_date: end ? end.toISOString().slice(0, 10) : "",
            duration,
            estimate_id: bid?.id,
        }))

        if (extraFunctionCall) extraFunctionCall(bid)
        setOpen(false)
    }

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
                    <Command
                        filter={(value, search) => {
                            const normalizedValue = normalizeText(value);
                            const normalizedSearch = normalizeText(search);
                            return normalizedValue.includes(normalizedSearch) ? 1 : 0;
                        }}
                    >
                        <CommandInput placeholder="Search bid..." />
                        <CommandList>
                            <CommandEmpty>No bid found.</CommandEmpty>
                            <CommandGroup>
                                {bids.map((bid) => {
                                    const contract = bid.admin_data?.contractNumber || "";
                                    const contractor = bid.contractor_name || bid.admin_data?.owner || "";
                                    const date = bid.admin_data?.lettingDate?.split("T")[0] || "";

                                    return (
                                        <CommandItem
                                            key={bid.id}
                                            value={`${contract} ${contractor} ${date}`}
                                            onSelect={() => handleSelectBid(bid)}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{contract || "N/A"}</span>
                                                <span className="text-xs text-gray-500">
                                                    {contractor || "Unknown"} – {date || "No date"}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default SelectBid
