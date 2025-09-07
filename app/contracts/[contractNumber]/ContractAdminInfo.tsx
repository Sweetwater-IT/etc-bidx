import React, { useState } from "react";
import { AdminData } from "@/types/TAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchReferenceData } from "@/lib/api-client";
import { County } from "@/types/TCounty";
import { toast } from "sonner";

const ownerOptions = ["PENNDOT", "TURNPIKE", "PRIVATE", "SEPTA", "OTHER"]
const divisionOptions = ["PUBLIC 22", "PRIVATE 21"]

interface AdminInfoItemProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange?: (val: string) => void;
  disabled?: boolean;
  type?: string; // <- tipo de input opcional
}

function AdminInfoItem({ label, value, isEditing, onChange, disabled = false, type = "text" }: AdminInfoItemProps) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {isEditing ? (
        <Input
          type={type} // <- aquí se usa
          disabled={disabled}
          value={value || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="font-medium"
        />
      ) : (
        <div className="font-medium">{value || "N/A"}</div>
      )}
    </div>
  );
}

interface AdminInformationSectionProps {
  adminData: AdminData;
  canEdit?: boolean;
}

const AdminInformationSection: React.FC<AdminInformationSectionProps> = ({
  adminData,
  canEdit = false
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [localValues, setLocalValues] = React.useState<AdminData>(adminData);
  const [counties, setCounties] = React.useState<County[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [saving, setSaving] = React.useState<boolean>(false)
  const [popOvers, setPopOvers] = React.useState({
    county: false,
    owner: false,
    division: false,
  });

  const togglePopOver = (key: keyof typeof popOvers, value?: boolean) => {
    setPopOvers(prev => ({
      ...prev,
      [key]: value !== undefined ? value : !prev[key],
    }));
  };

  React.useEffect(() => {
    setLocalValues({
      ...adminData,
      startDate: adminData.startDate ? new Date(adminData.startDate) : null,
      endDate: adminData.endDate ? new Date(adminData.endDate) : null,
      lettingDate: adminData.lettingDate ? new Date(adminData.lettingDate) : null,
    });
  }, [adminData]);


  React.useEffect(() => {
    const loadCounties = async () => {
      try {
        setIsLoading(true);

        const data = await fetchReferenceData("counties");
        setCounties(data);
      } catch (err) {
        console.error("Error fetching counties:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCounties();
  }, []);

  const handleChange = (field: keyof AdminData, value: any) => {
    setLocalValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountyChange = (countyId: string) => {
    const selectedCounty = counties.find((c) => c.id.toString() === countyId);
    if (selectedCounty) {
      setLocalValues((prev) => ({
        ...prev,
        county: selectedCounty,
      }));
      togglePopOver('county');
    }
  };

  const getCountyName = () => {
    return localValues.county?.name || "Select county...";
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const handleDateChange = (field: keyof AdminData, val: string) => {
    const [year, month, day] = val.split("-").map(Number);
    const date = new Date(year, month - 1, day); // mes base 0
    handleChange(field, date);
  };

  const calculateTotalDays = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return "N/A";
    const diffTime = Math.abs(
      new Date(endDate).getTime() - new Date(startDate).getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { contractNumber, ...updates } = localValues;
      const resp = await fetch('/api/jobs/contract-management', {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractNumber, updates })
      });

      const response = await resp.json();
      if (response.message === 'Admin data updated successfully') {
        toast.success('Information successfully updated');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.log(error);
      toast.error('Error updating data');
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setLocalValues({
      ...adminData,
      startDate: adminData.startDate ? new Date(adminData.startDate) : null,
      endDate: adminData.endDate ? new Date(adminData.endDate) : null,
      lettingDate: adminData.lettingDate ? new Date(adminData.lettingDate) : null,
    });
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Admin Information</h3>
        {canEdit && (
          !isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <div className="space-x-2">
              <Button disabled={saving} onClick={handleSave}>
                {
                  saving ?
                    <div className="flex flex-row items-center gap-2">
                      <span className="text-white">Saving </span>
                      <div className="w-4 h-4 border-2 border-t-transparent border-gray-300 rounded-full animate-spin"></div>
                    </div>
                    :
                    "Save"
                }
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AdminInfoItem
          label="Contract #"
          value={localValues.contractNumber}
          isEditing={isEditing}
          disabled={true}
          onChange={(val) => handleChange("contractNumber", val)}
        />

        <div>
          <Label className="text-sm text-muted-foreground ">Owner</Label>
          {isEditing ? (
            <Popover open={popOvers.owner} onOpenChange={() => togglePopOver('owner')}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {localValues.owner || "Select owner"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder="Search owner..." />
                  <CommandEmpty>No owner found.</CommandEmpty>
                  <CommandGroup>
                    {ownerOptions.map((owner) => (
                      <CommandItem
                        key={owner}
                        onSelect={() => {
                          handleChange("owner", owner);
                          togglePopOver('owner');
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            localValues.owner === owner ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {owner}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <span className="font-medium">{localValues.owner || "-"}</span>
          )}
        </div>


        <div>
          <Label className="text-sm text-muted-foreground ">County</Label>
          {isEditing ? (
            <Popover open={popOvers.county} onOpenChange={() => togglePopOver('county')}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popOvers.county}
                  className="w-full justify-between h-10 border-gray-200"
                >
                  {getCountyName()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder="Search county..." />
                  <CommandEmpty>No county found.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-y-auto">
                    {isLoading ? (
                      <CommandItem disabled>Loading...</CommandItem>
                    ) : counties.length > 0 ? (
                      counties.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => handleCountyChange(c.id.toString())}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              localValues.county?.id === c.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {c.name}
                        </CommandItem>
                      ))
                    ) : (
                      <CommandItem disabled>No counties found</CommandItem>
                    )}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="font-medium">{getCountyName()}</div>
          )}
        </div>

        <AdminInfoItem
          label="Branch"
          value={localValues.county?.branch || ""}
          disabled={true}
          isEditing={isEditing}
        />

        <AdminInfoItem
          label="Township"
          value={localValues.location || ""}
          isEditing={isEditing}
          onChange={(val) => handleChange("location", val)}
        />

        <div>
          <Label className="text-sm text-muted-foreground ">Division</Label>
          {isEditing ? (
            <Popover open={popOvers.division} onOpenChange={() => togglePopOver('division')}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {localValues.division || "Select division"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder="Search division..." />
                  <CommandEmpty>No division found.</CommandEmpty>
                  <CommandGroup>
                    {divisionOptions.map((division) => (
                      <CommandItem
                        key={division}
                        onSelect={() => {
                          handleChange("division", division);
                          togglePopOver('division')
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            localValues.division === division ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {division}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <span className="font-medium">{localValues.division || "-"}</span>
          )}
        </div>

        <AdminInfoItem
          label="Start Date"
          value={
            isEditing
              ? localValues.startDate
                ? localValues.startDate.toISOString().slice(0, 10)
                : ""
              : formatDate(localValues.startDate)
          }
          type="date"
          isEditing={isEditing}
          onChange={(val) => handleDateChange("startDate", val)}
        />

        <AdminInfoItem
          label="End Date"
          type="date"
          value={
            isEditing
              ? localValues.endDate
                ? localValues.endDate.toISOString().slice(0, 10)
                : ""
              : formatDate(localValues.endDate)
          }
          isEditing={isEditing}
          onChange={(val) => handleDateChange("endDate", val)}

        />

        <AdminInfoItem
          label="Total Days"
          value={calculateTotalDays(localValues.startDate, localValues.endDate)}
          isEditing={isEditing}
          disabled={true}
        />

        <AdminInfoItem
          label="Bid Date"
          type="date"
          value={
            isEditing && localValues.lettingDate
              ? localValues.lettingDate.toISOString().split("T")[0]
              : formatDate(localValues.lettingDate)
          }
          isEditing={isEditing}
          onChange={(val) => handleChange("lettingDate", new Date(val))}
        />

        <AdminInfoItem
          label="SR Route"
          value={localValues.srRoute || ""}
          isEditing={isEditing}
          onChange={(val) => handleChange("srRoute", val)}
        />

        <AdminInfoItem
          label="DBE %"
          value={localValues.dbe?.toString() || "0"}
          isEditing={isEditing}
          onChange={(val) => handleChange("dbe", parseFloat(val) || 0)}
        />
      </div>
    </div>
  );
};

export default AdminInformationSection;
