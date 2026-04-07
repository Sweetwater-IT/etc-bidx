import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContractManagerEmptyStateProps {
  onCreateNew: () => void;
}

export default function ContractManagerEmptyState({ onCreateNew }: ContractManagerEmptyStateProps) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-background">
      <div className="max-w-md mx-auto text-center">
        <div className="p-6 rounded-full bg-primary/5 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <FileText className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">No Contracts Yet</h2>
        <p className="text-muted-foreground mb-8">
          Get started by creating your first contract. Contracts will appear here once they are created and ready for management.
        </p>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create First Contract
        </Button>
      </div>
    </div>
  );
}
