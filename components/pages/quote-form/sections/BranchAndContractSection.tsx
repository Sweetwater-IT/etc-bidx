import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BRANCHES = [
  { value: "All", label: "All" },
  { value: "Turbotville", label: "Turbotville" },
  { value: "Hatfield", label: "Hatfield" },
  { value: "Bedford", label: "Bedford" },
];

interface Estimate {
  contract_number: string;
  branch: string;
}

interface Job {
  job_number: string;
  branch: string;
}

interface BranchAndContractSectionProps {
  quoteType: "new" | "estimate" | "job";
  selectedBranch: string;
  setSelectedBranch: (value: string) => void;
  associatedContractNumber: string | undefined;
  setAssociatedContractNumber: (value: string) => void;
  isLoadingEstimatesJobs: boolean;
  allEstimates: Estimate[];
  allJobs: Job[];
}

export function BranchAndContractSection({
  quoteType,
  selectedBranch,
  setSelectedBranch,
  associatedContractNumber,
  setAssociatedContractNumber,
  isLoadingEstimatesJobs,
  allEstimates,
  allJobs,
}: BranchAndContractSectionProps) {
  if (quoteType === "new") return null;

  return (
    <>
      <div className="space-y-2">
        <Label>Branch</Label>
        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger>
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {BRANCHES.map((branch) => (
              <SelectItem key={branch.value} value={branch.value}>
                {branch.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>
          {quoteType === "estimate" ? "Contract Number" : "Job Number"}
        </Label>
        <Select
          value={associatedContractNumber || ""}
          onValueChange={setAssociatedContractNumber}
          disabled={isLoadingEstimatesJobs}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={`Select ${
                quoteType === "estimate" ? "contract" : "job"
              } number`}
            />
          </SelectTrigger>
          <SelectContent>
            {quoteType === "estimate"
              ? allEstimates
                  .filter((estimate) =>
                    selectedBranch === "All"
                      ? true
                      : estimate.branch === selectedBranch
                  )
                  .filter(
                    (estimate) =>
                      estimate.contract_number &&
                      estimate.contract_number.trim() !== ""
                  )
                  .map((estimate, index) => (
                    <SelectItem key={index} value={estimate.contract_number}>
                      {estimate.contract_number}
                    </SelectItem>
                  ))
              : allJobs
                  .filter((job) =>
                    selectedBranch === "All"
                      ? true
                      : job.branch === selectedBranch
                  )
                  .filter(
                    (job) => job.job_number && job.job_number.trim() !== ""
                  )
                  .map((job) => (
                    <SelectItem key={job.job_number} value={job.job_number}>
                      {job.job_number}
                    </SelectItem>
                  ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
