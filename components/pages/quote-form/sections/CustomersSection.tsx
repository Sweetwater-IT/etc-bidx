import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multiselect";
import { Customer } from "@/types/Customer";

interface CustomersSectionProps {
  customers: Customer[];
  selectedCustomers: Customer[];
  handleCustomerSelection: (names: string[] | undefined) => void;
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
          value: String(customer.id),
        }))}
        selected={selectedCustomers.map((customer) => String(customer.id))}
        onChange={(ids) => {
          // mapear de vuelta los IDs seleccionados a Customer[]
          const selected = customers.filter(c => ids?.includes(String(c.id)));
          handleCustomerSelection(selected.map(c => c.name));
        }}
        placeholder="Select customers"
        disabled={isLoading}
      />
    </div>
  );
}
