import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ContractManagementData } from '@/types/IContractManagementData';

interface FormInputProps {
    label: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    prefix?: string;
    onChange?: (value: string) => void;
}

function FormInput({
    label,
    value,
    placeholder,
    disabled,
    className,
    prefix,
    onChange
}: FormInputProps) {
    return (
        <div className={className}>
            <Label>{label}</Label>
            <div className="mt-1 flex">
                {prefix && (
                    <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                        {prefix}
                    </div>
                )}
                <Input
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn("bg-muted/50", prefix && "rounded-l-none")}
                    onChange={(e) => onChange?.(e.target.value)}
                />
            </div>
        </div>
    );
}

interface FormSelectProps {
    label: string;
    value?: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    className?: string;
    prefix?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
}

function FormSelect({
    label,
    value,
    placeholder,
    options,
    className,
    prefix,
    disabled,
    onChange
}: FormSelectProps) {
    return (
        <div className={className}>
            <Label>{label}</Label>
            <div className="mt-1 flex">
                {prefix && (
                    <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                        {prefix}
                    </div>
                )}
                <Select disabled={disabled} value={value} onValueChange={onChange}>
                    <SelectTrigger className={cn("w-full bg-muted/50", prefix && "rounded-l-none")}>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

interface SenderInfo {
    name: string;
    email: string;
    role: string;
}

interface ContractFileManagementProps {
    // Fringe Benefit Letter props
    contractNumber: string;
    srRoute: string;
    selectedContractor: string;
    county: string;
    laborRate: string;
    fringeRate: string;
    sender: SenderInfo;
    laborGroup: string;
    onContractorChange: (value: string) => void;
    onSenderChange: (sender: SenderInfo) => void;
    onLaborGroupChange: (value: string) => void;
    onFringeBenefitsPreview: () => void;
    
    // Worker's Protection props
    onWorkersProtectionPreview: () => void;
    
    // Employment Verification props
    owner: string | null;
    evDescription: string;
    onEvDescriptionChange: (description: string) => void;
    onEmploymentVerificationPreview: () => void;
    handleDataLoaded: (data: ContractManagementData) => void;
}

const ContractFileManagement: React.FC<ContractFileManagementProps> = ({
    contractNumber,
    srRoute,
    selectedContractor,
    county,
    laborRate,
    fringeRate,
    sender,
    laborGroup,
    onContractorChange,
    onSenderChange,
    onLaborGroupChange,
    onFringeBenefitsPreview,
    onWorkersProtectionPreview,
    owner,
    evDescription,
    onEvDescriptionChange,
    onEmploymentVerificationPreview,
    handleDataLoaded
}) => {
    const signerOptions = [
        { value: 'garret', label: 'Garret Brunton' },
        // Add more signer options as needed
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const jobResponse = await fetch('/api/jobs/active-jobs/contract-management', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(contractNumber)
                });

                if (!jobResponse.ok) {
                    const errorData = await jobResponse.json();
                    toast.error(errorData.message || 'Failed to fetch contract data');
                    return;
                }

                const response = await jobResponse.json();
                handleDataLoaded(response);
            } catch (error) {
                console.error('Error fetching contract data:', error);
                toast.error('Failed to load contract data');
            }
        };

        if (contractNumber) {
            fetchData();
        }
    }, [contractNumber, handleDataLoaded]);

    return (
        <div className="space-y-6">
            {/* Fringe Benefit Letter */}
            <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold">Fringe Benefit Letter</h3>
                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormInput
                            label="Contract Number"
                            value={contractNumber}
                            disabled
                            prefix="#"
                        />
                        <FormInput
                            label="SR Route"
                            value={srRoute}
                            disabled
                            prefix="/"
                        />
                        <FormInput
                            label="Contractor"
                            value={selectedContractor}
                            disabled
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormInput
                            label="County"
                            value={county}
                            disabled
                        />
                        <FormInput
                            label="Labor Rate"
                            value={laborRate}
                            prefix="$"
                            disabled
                        />
                        <FormInput
                            label="Fringe Rate"
                            value={fringeRate}
                            prefix="$"
                            disabled
                        />
                    </div>

                    <FormSelect
                        label="Sender"
                        placeholder="Select sender"
                        options={signerOptions}
                        value={sender.name}
                        onChange={(value) => {
                            // In a real app, you'd look up the full sender info
                            onSenderChange({
                                name: value,
                                email: `${value}@company.com`,
                                role: 'Manager'
                            });
                        }}
                    />

                    <div className="space-y-2">
                        <Label>Labor Group</Label>
                        <RadioGroup
                            value={laborGroup}
                            onValueChange={onLaborGroupChange}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="labor-group-1" id="labor-group-1" />
                                <Label htmlFor="labor-group-1">Labor Group 1</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="labor-group-3" id="labor-group-3" />
                                <Label htmlFor="labor-group-3">Labor Group 3</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="custom" />
                                <Label htmlFor="custom">Custom Labor Group</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onFringeBenefitsPreview}>
                            Preview
                        </Button>
                        <Button>Generate Document</Button>
                    </div>
                </div>
            </div>

            {/* Worker's Protection Form */}
            <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold">
                    Worker&apos;s Protection Form
                </h3>
                <div className="mt-4 space-y-4">
                    <FormSelect
                        label="Signer"
                        placeholder="Select signer"
                        options={signerOptions}
                        value={sender.name}
                        onChange={(value) => {
                            // In a real app, you'd look up the full signer info
                            onSenderChange({
                                name: value,
                                email: `${value}@company.com`,
                                role: 'Manager'
                            });
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onWorkersProtectionPreview}>
                            Preview
                        </Button>
                        <Button>Generate Document</Button>
                    </div>
                </div>
            </div>

            {/* Employment Verification */}
            <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold">
                    Employment Verification
                </h3>
                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormInput
                            label="Contract Number"
                            value={contractNumber}
                            disabled
                        />
                        <FormInput
                            label="County"
                            value={county}
                            disabled
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormSelect
                            label="Signer"
                            placeholder="Select signer"
                            options={signerOptions}
                            value={sender.name}
                            onChange={(value) => {
                                // In a real app, you'd look up the full signer info
                                onSenderChange({
                                    name: value,
                                    email: `${value}@company.com`,
                                    role: 'Manager'
                                });
                            }}
                        />
                        <FormInput
                            label="Owner"
                            value={owner || ''}
                            disabled
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            className="h-24"
                            value={evDescription}
                            onChange={(e) => onEvDescriptionChange(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onEmploymentVerificationPreview}>
                            Preview
                        </Button>
                        <Button>Generate Document</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractFileManagement;