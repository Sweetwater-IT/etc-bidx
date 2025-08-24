import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Customer } from '../../../types/Customer';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useCustomers } from '../../../hooks/use-customers';
import { validateEmail } from '@/lib/emailValidation';
import { handlePhoneInput } from '@/lib/phone-number-functions';
import { ContactSelector } from '@/components/SelectContacts';

interface FormInputProps {
    label: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    prefix?: string;
    type?: 'text' | 'email' | 'phone';
    error?: string;
    onChange?: (value: string) => void;
    isReadOnly?: boolean;
}


function FormInput({
    label,
    value,
    placeholder,
    disabled,
    className,
    prefix,
    type = 'text',
    error,
    onChange,
    isReadOnly = false
}: FormInputProps) {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type === 'phone') {
            const ev = e.nativeEvent as InputEvent;
            const { inputType } = ev;
            const data = ev.data || "";
            const newValue = handlePhoneInput(inputType, data, value || "");
            onChange?.(newValue);
        } else {
            onChange?.(e.target.value);
        }
    };

    return (
        <div className={className}>
            <Label className={error ? "text-red-600" : ""}>{label}</Label>
            <div className="mt-1 flex">
                {prefix && (
                    <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                        {prefix}
                    </div>
                )}
                <Input
                    readOnly={isReadOnly}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    type={type === 'phone' ? 'text' : type}
                    inputMode={type === 'phone' ? 'tel' : type === 'email' ? 'email' : 'text'}
                    className={cn(
                        prefix && "rounded-l-none",
                        "bg-muted/50",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    onChange={handleChange}
                />
                {error && (
                    <div className="ml-2 flex items-center">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
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
    const [localContact, setLocalContact] = useState<any | null>(null);

    // State para manejar apertura del drawer de nuevo contacto
    const [contactModalOpen, setContactModalOpen] = useState(false);

    // State for popover open
    const [openCustomer, setOpenCustomer] = useState(false);

    // State for validation errors
    const [emailError, setEmailError] = useState<string>();

    // Handle email change with validation
    const handleEmailChange = (value: string) => {
        onPmEmailChange(value);

        // Validate email on blur or when complete
        const validation = validateEmail(value);
        setEmailError(validation.isValid ? undefined : validation.message);
    };

    // Handle phone change
    const handlePhoneChange = (formattedValue: string) => {
        onPmPhoneChange(formattedValue);
    };

    React.useEffect(() => {        
        if (localContact && localContact?.id) {
            onProjectManagerChange(localContact.name)
            onPmEmailChange(localContact.email)
            onPmPhoneChange(localContact.phone)
        }
    }, [localContact])


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

                <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <ContactSelector
                        localCustomer={customer}
                        setLocalCustomer={(customer: any) => onCustomerChange(customer)}
                        localContact={localContact}
                        setLocalContact={setLocalContact}
                        contactModalOpen={contactModalOpen}
                        setContactModalOpen={setContactModalOpen}
                    />
                </div>

                <FormInput
                    label="Customer Contract Number"
                    value={customerContractNumber}
                    onChange={(value) => onCustomerContractNumberChange(value.toUpperCase())}
                    placeholder="Contract number"
                />

                <FormInput
                    isReadOnly={true}
                    label="Project Manager"
                    value={projectManager}
                    onChange={onProjectManagerChange}
                    placeholder="Manager name"
                />

                <FormInput
                    isReadOnly={true}
                    label="PM Email"
                    type="email"
                    value={pmEmail}
                    onChange={handleEmailChange}
                    placeholder="Project manager email"
                    error={emailError}
                />

                <FormInput
                    isReadOnly={true}
                    label="PM Phone"
                    type="phone"
                    value={pmPhone}
                    onChange={handlePhoneChange}
                    placeholder="Phone number"
                />
            </div>
        </div>
    );
};

export default CustomerInformationSection;