import { ClipboardCheck } from "lucide-react";

interface ChecklistHeaderProps {
  title?: string;
  description?: string;
}

export const ChecklistHeader = ({
  title = "Contract Review Checklist",
  description = "Track and verify all contract requirements for awarded construction projects.",
}: ChecklistHeaderProps) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2.5 rounded-lg bg-primary">
        <ClipboardCheck className="h-6 w-6 text-primary-foreground" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
        {title}
      </h1>
    </div>
    <p className="text-muted-foreground ml-[52px]">
      {description}
    </p>
  </div>
);
