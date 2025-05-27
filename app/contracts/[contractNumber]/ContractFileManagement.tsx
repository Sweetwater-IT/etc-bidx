import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Textarea } from '../../../components/ui/textarea';
import { fetchReferenceData } from '../../../lib/api-client';
import { AdminData } from '../../../types/TAdminData';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { County } from '../../../types/TCounty';
import { Customer } from '../../../types/Customer';
import ReactPDF from '@react-pdf/renderer'
import FringeBenefitsStatement from './EmploymentBenefits';
import { toast } from 'sonner';
import WorkerProtectionCertification from './WorkersProtection';
import { GenerateEmploymentVerificationForm } from './EmploymentVerification';

interface SenderInfo {
    name: string;
    email: string;
    role: string;
}

interface ContractFileManagementProps {
    // Fringe Benefit Letter props
    adminData: AdminData;
    setAdminData: Dispatch<SetStateAction<AdminData>>;
    sender: SenderInfo;
    laborGroup: string;
    onSenderChange: (sender: SenderInfo) => void;
    onLaborGroupChange: (value: string) => void;
    onFringeBenefitsPreview: () => void;

    // Worker's Protection props
    onWorkersProtectionPreview: () => void;

    // Employment Verification props
    evDescription: string;
    onEvDescriptionChange: (description: string) => void;
    onEmploymentVerificationPreview: () => void;
    customer: Customer | null,
    setCustomer: Dispatch<SetStateAction<Customer | null>>
    allCustomers: Customer[]
    jobId : number | undefined
    setFiles : Dispatch<SetStateAction<File[]>>
}

const ContractFileManagement: React.FC<ContractFileManagementProps> = ({
    jobId,
    adminData,
    setAdminData,
    sender,
    laborGroup,
    onSenderChange,
    onLaborGroupChange,
    onFringeBenefitsPreview,
    onWorkersProtectionPreview,
    evDescription,
    onEvDescriptionChange,
    customer,
    setCustomer,
    onEmploymentVerificationPreview,
    allCustomers,
    setFiles
}) => {
    // State for dropdown options
    const [counties, setCounties] = useState<County[]>([]);
    const [users, setUsers] = useState<{ id: number; name: string; email: string; role: string }[]>([]);
    const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);
    const [customLaborSelected, setCustomLaborSelected] = useState<boolean>(false);

    const [saving, setSaving] = useState<boolean>(false);

    // State for popover open states
    const [openStates, setOpenStates] = useState({
        county: false,
        countyEv: false, // For Employment Verification county dropdown
        sender: false,
        senderWp: false, // For Worker's Protection sender dropdown
        senderEv: false, // For Employment Verification sender dropdown
        owner: false,
        contractor: false, // For contractor dropdown
    });

    // Fetch reference data and customers
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch counties
                const countiesData = await fetchReferenceData("counties");
                setCounties(countiesData)

                const ownersData = await fetchReferenceData("owners");
                setOwners(ownersData);

                // Fetch users
                const usersData = await fetchReferenceData("users");
                console.log(usersData)
                setUsers(usersData.map((user: any) => ({
                    id: user.id,
                    name: user.name,
                    email: user.email || 'gbrunton@establishedtraffic.com',
                    role: user.role || 'Chief Operating Officer'
                })));
            } catch (error) {
                console.error("Error fetching reference data:", error);
            }
        };

        fetchData();
    }, []);

    const handleCountyChange = (countyId: string, fieldName: 'county' | 'countyEv' = 'county') => {
        const selectedCounty = counties.find(c => c.id.toString() === countyId);
        if (selectedCounty) {
            setAdminData(prev => ({
                ...prev,
                county: {
                    ...selectedCounty
                }
            }));
            setOpenStates(prev => ({ ...prev, [fieldName]: false }));
        }
    };

    const handleSenderChange = (senderName: string, fieldName: 'sender' | 'senderWp' | 'senderEv' = 'sender') => {
        const selectedUser = users.find(u => u.name === senderName);
        if (selectedUser) {
            onSenderChange({
                name: selectedUser.name,
                email: selectedUser.email,
                role: selectedUser.role
            });
        }
        setOpenStates(prev => ({ ...prev, [fieldName]: false }));
    };

    const handleOwnerChange = (owner) => {
        setAdminData(prev => ({
            ...prev,
            owner: owner as 'PRIVATE' | 'TURNPIKE' | 'SEPTA' | 'OTHER' | 'PENNDOT'
        }));
        setOpenStates(prev => ({ ...prev, owner: false }));
    };

    const handleDocSave = async (type : 'fringe-benefits' | 'employment-verification' | 'workers-protection') => {
        if(!jobId){
            toast.error('Job id is not set yet, plase wait');
            return;
        }
        setSaving(true)
        let blob : Blob;
        let filename : string;
        if (type === 'fringe-benefits'){
            blob = await ReactPDF.pdf(<FringeBenefitsStatement laborGroup={laborGroup} sender={sender} adminData={adminData} />).toBlob();
            filename = 'Fringe Benefits Letter'
        } if(type === 'workers-protection'){
            blob = await ReactPDF.pdf(<WorkerProtectionCertification sender={sender} />).toBlob()
            filename = "Worker's Protection Form"
        } else {
            blob = await ReactPDF.pdf(<GenerateEmploymentVerificationForm user={sender} description={evDescription} adminData={adminData} />).toBlob();
            filename = 'Employment Verification Form'
        }

        const file = new File([blob], filename, {type: 'application/pdf'})

        const formData = new FormData();
        formData.append('file', file)
        formData.append('jobId', jobId.toString())

        const fileResponse = await fetch('/api/files/contract-management', {
            method: 'POST',
            body: formData
        })

        if(!fileResponse.ok){
            const fileError = await fileResponse.json();
            toast.error("Couldn't save files: " + fileError.message)
        }
        else {
            toast.success('Successfully saved files')
        }

        setFiles(prevState => [...prevState, file])

        setSaving(false)
    }

    return (
        <div className="space-y-6">
            {/* Fringe Benefit Letter */}
            <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Fringe Benefit Letter</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Contract Number</Label>
                            <div className="mt-1 flex">
                                <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                                    #
                                </div>
                                <Input
                                    value={adminData.contractNumber}
                                    disabled
                                    className="bg-muted/50 rounded-l-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>SR Route</Label>
                            <div className="mt-1 flex">
                                <Input
                                    value={adminData.srRoute}
                                    onChange={(e) => setAdminData(prevState => ({...prevState, srRoute: e.target.value}))}
                                    className="bg-muted/50 rounded-l-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Contractor</Label>
                            <Popover
                                open={openStates.contractor}
                                onOpenChange={(open) => setOpenStates(prev => ({ ...prev, contractor: open }))}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openStates.contractor}
                                        className="w-full justify-between bg-muted/50"
                                    >
                                        {customer ? customer.name : "Select contractor..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search contractor..." />
                                        <CommandEmpty>No contractor found.</CommandEmpty>
                                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                                            {allCustomers.map((c) => (
                                                <CommandItem
                                                    key={c.id}
                                                    value={c.name}
                                                    onSelect={() => setCustomer(c)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            (customer && customer.name === c.name) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {c.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>County</Label>
                            <Popover
                                open={openStates.countyEv}
                                onOpenChange={(open) => setOpenStates(prev => ({ ...prev, countyEv: open }))}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openStates.countyEv}
                                        className="w-full justify-between bg-muted/50"
                                    >
                                        {adminData.county?.name || "Select county..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search county..." />
                                        <CommandEmpty>No county found.</CommandEmpty>
                                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                                            {counties.map((county) => (
                                                <CommandItem
                                                    key={county.id}
                                                    value={county.name}
                                                    onSelect={() => handleCountyChange(county.id.toString(), 'countyEv')}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            adminData.county?.name === county.name ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {county.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Labor Rate</Label>
                            <div className="mt-1 flex">
                                <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                                    $
                                </div>
                                <Input
                                    value={adminData.county?.laborRate || ''}
                                    onChange={(e) => setAdminData(prev => ({
                                        ...prev,
                                        county: {
                                            ...prev.county,
                                            laborRate: Number(e.target.value)
                                        }
                                    }))}
                                    className="bg-muted/50 rounded-l-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Fringe Rate</Label>
                            <div className="mt-1 flex">
                                <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                                    $
                                </div>
                                <Input
                                    value={adminData.county?.fringeRate || ''}
                                    onChange={(e) => setAdminData(prev => ({
                                        ...prev,
                                        county: {
                                            ...prev.county,
                                            fringeRate: Number(e.target.value)
                                        }
                                    }))}
                                    className="bg-muted/50 rounded-l-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Sender</Label>
                        <Popover
                            open={openStates.sender}
                            onOpenChange={(open) => setOpenStates(prev => ({ ...prev, sender: open }))}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openStates.sender}
                                    className="w-full justify-between bg-muted/50"
                                >
                                    {sender.name || "Select sender..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                    <CommandInput placeholder="Search sender..." />
                                    <CommandEmpty>No sender found.</CommandEmpty>
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                        {users.map((user) => (
                                            <CommandItem
                                                key={user.id}
                                                value={user.name}
                                                onSelect={() => handleSenderChange(user.name)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        sender.name === user.name ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {user.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>Labor Group</Label>
                        <RadioGroup
                            value={laborGroup}
                            onValueChange={(value) => {
                                onLaborGroupChange(value);
                                setCustomLaborSelected(value !== "Labor Group 1" && value !== "Labor Group 3");
                            }}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Labor Group 1" id="Labor Group 1" />
                                <Label htmlFor="Labor Group 1">Labor Group 1</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Labor Group 3" id="Labor Group 3" />
                                <Label htmlFor="Labor Group 3">Labor Group 3</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem checked={customLaborSelected} value="custom" id="custom" />
                                <Label htmlFor="custom">Custom Labor Group</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    {customLaborSelected && (
                        <div className="space-y-2">
                            <Label>Custom Labor Group</Label>
                            <Input
                                value={laborGroup === "custom" ? "" : laborGroup}
                                onChange={(e) => onLaborGroupChange(e.target.value)}
                                className="bg-muted/50"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onFringeBenefitsPreview}>
                            Preview
                        </Button>
                        <Button 
                        disabled={saving}
                        onClick={() => handleDocSave('fringe-benefits')}>Generate Document</Button>
                    </div>
                </div>
            </div>

            {/* Worker's Protection Form */}
            <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Worker&apos;s Protection Form
                </h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Signer</Label>
                        <Popover
                            open={openStates.senderWp}
                            onOpenChange={(open) => setOpenStates(prev => ({ ...prev, senderWp: open }))}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openStates.senderWp}
                                    className="w-full justify-between bg-muted/50"
                                >
                                    {sender.name || "Select signer..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                    <CommandInput placeholder="Search signer..." />
                                    <CommandEmpty>No signer found.</CommandEmpty>
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                        {users.map((user) => (
                                            <CommandItem
                                                key={user.id}
                                                value={user.name}
                                                onSelect={() => handleSenderChange(user.name, 'senderWp')}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        sender.name === user.name ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {user.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onWorkersProtectionPreview}>
                            Preview
                        </Button>
                        <Button
                        disabled={saving}
                        onClick={() => handleDocSave('workers-protection')}>Generate Document</Button>
                    </div>
                </div>
            </div>

            {/* Employment Verification */}
            <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Employment Verification
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Contract Number</Label>
                            <Input
                                value={adminData.contractNumber}
                                disabled
                                className="bg-muted/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>County</Label>
                            <Popover
                                open={openStates.county}
                                onOpenChange={(open) => setOpenStates(prev => ({ ...prev, county: open }))}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openStates.county}
                                        className="w-full justify-between bg-muted/50"
                                    >
                                        {adminData.county?.name || "Select county..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search county..." />
                                        <CommandEmpty>No county found.</CommandEmpty>
                                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                                            {counties.map((county) => (
                                                <CommandItem
                                                    key={county.id}
                                                    value={county.name}
                                                    onSelect={() => handleCountyChange(county.id.toString())}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            adminData.county?.name === county.name ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {county.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Signer</Label>
                            <Popover
                                open={openStates.senderEv}
                                onOpenChange={(open) => setOpenStates(prev => ({ ...prev, senderEv: open }))}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openStates.senderEv}
                                        className="w-full justify-between bg-muted/50"
                                    >
                                        {sender.name || "Select signer..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search signer..." />
                                        <CommandEmpty>No signer found.</CommandEmpty>
                                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                                            {users.map((user) => (
                                                <CommandItem
                                                    key={user.id}
                                                    value={user.name}
                                                    onSelect={() => handleSenderChange(user.name, 'senderEv')}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            sender.name === user.name ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {user.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Owner</Label>
                            <Popover
                                open={openStates.owner}
                                onOpenChange={(open) => setOpenStates(prev => ({ ...prev, owner: open }))}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openStates.owner}
                                        className="w-full justify-between bg-muted/50"
                                    >
                                        {adminData.owner || "Select owner..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search owner..." />
                                        <CommandEmpty>No owner found.</CommandEmpty>
                                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                                            {owners.map((owner) => (
                                                <CommandItem
                                                    key={owner.id}
                                                    value={owner.name}
                                                    onSelect={() => handleOwnerChange(owner.name)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            adminData.owner === owner.name ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {owner.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            className="h-24 bg-muted/50"
                            value={evDescription}
                            onChange={(e) => onEvDescriptionChange(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onEmploymentVerificationPreview}>
                            Preview
                        </Button>
                        <Button 
                        disabled={saving}
                        onClick={() => handleDocSave('employment-verification')}>Generate Document</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractFileManagement;