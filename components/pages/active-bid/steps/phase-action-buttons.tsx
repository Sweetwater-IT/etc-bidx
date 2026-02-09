import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface PhaseActionButtonsProps {
  phaseIndex: number;
  totalPhases: number;
  onEdit: (phaseIndex: number) => void;
  onDelete: (phaseIndex: number) => void;
}

const PhaseActionButtons: React.FC<PhaseActionButtonsProps> = ({
  phaseIndex,
  totalPhases,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(phaseIndex)}
        className="flex items-center gap-2"
      >
        <Edit className="h-4 w-4" />
        Edit Phase
      </Button>
      {totalPhases > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(phaseIndex)}
          className="flex items-center gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete Phase
        </Button>
      )}
    </div>
  );
};

export default PhaseActionButtons;