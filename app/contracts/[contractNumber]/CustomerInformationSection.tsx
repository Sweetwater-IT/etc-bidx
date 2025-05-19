import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Customer } from '@/types/Customer';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/use-customers';

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
                    className={cn(prefix && "rounded-l-none", "bg-muted/50")}
                    onChange={(e) => onChange?.(e.target.value)}
                />
            </div>
        </div>
    );
}

interface CustomerInformationSectionProps {
    customer: Customer | null;
    customerContractNumber: string;
    projectManager: string;
    pmEmail: string;
    pmPhone: string;
    onCustomerChange: (customer: Customer | null) => void;
    onCustomerContractNumberChange: (value: string) => void;
    onProjectManagerChange: (value: string) => void;
    onPmEmailChange: (value: string) => void;
    onPmPhoneChange: (value: string) => void;
}

const CustomerInformationSection: React.FC<CustomerInformationSectionProps> = ({
    customer,
    customerContractNumber,
    projectManager,
    pmEmail,
    pmPhone,
    onCustomerChange,
    onCustomerContractNumberChange,
    onProjectManagerChange,
    onPmEmailChange,
    onPmPhoneChange
}) => {
    // Get customers from the context or hook
    const { customers = [] } = useCustomers();
    
    // State for popover open
    const [openCustomer, setOpenCustomer] = useState(false);

    return (
        <div className="rounded-lg border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                    Customer Information
                </h3>
                {/* <Button variant="outline" size="sm">
                    Edit
                </Button> */}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Contractor</Label>
                    <Popover
                        open={openCustomer}
                        onOpenChange={setOpenCustomer}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCustomer}
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
                                    {customers.map((c) => (
                                        <CommandItem
                                            key={c.id}
                                            value={c.name}
                                            onSelect={() => {
                                                onCustomerChange(c);
                                                setOpenCustomer(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    (customer && customer.id === c.id) ? "opacity-100" : "opacity-0"
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
                <FormInput
                    label="Customer Contract Number"
                    value={customerContractNumber}
                    onChange={onCustomerContractNumberChange}
                />
                <FormInput
                    label="Project Manager"
                    value={projectManager}
                    onChange={onProjectManagerChange}
                />
                <FormInput
                    label="PM Email"
                    value={pmEmail}
                    onChange={onPmEmailChange}
                />
                <FormInput
                    label="PM Phone"
                    value={pmPhone}
                    onChange={onPmPhoneChange}
                />
            </div>
        </div>
    );
};

export default CustomerInformationSection;