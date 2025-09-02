import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multiselect";
import { Customer } from "@/types/Customer";

interface CustomersSectionProps {
  customers: Customer[];
  selectedCustomers: Customer[];
  handleCustomerSelection: (ids: string[] | undefined) => void;
  isLoading: boolean;
}

export function CustomersSection({
  customers,
  selectedCustomers,
  handleCustomerSelection,
  isLoading,
}: CustomersSectionProps) {
  return (
    <div className="md:col-span-2 space-y-2">
      <Label>Customers</Label>
      <MultiSelect
        options={customers.map((customer) => ({
          label: customer.name,
          value: customer.id.toString(),   // 👈 Usamos id único
        }))}
        selected={selectedCustomers.map((customer) => customer.id.toString())} // 👈 Selección por id
        onChange={handleCustomerSelection}
        placeholder="Select customers"
        disabled={isLoading}
      />
    </div>
  );
}
