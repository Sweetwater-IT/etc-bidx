import { FileText } from "lucide-react";

export const ChecklistHeader = () => {
  return (
    <div className="text-center py-6">
      <div className="flex items-center justify-center gap-3 mb-4">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Contract Checklist</h1>
      </div>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Complete all required information for this contract. This checklist ensures all necessary details are captured before finalizing the contract.
      </p>
    </div>
  );
};