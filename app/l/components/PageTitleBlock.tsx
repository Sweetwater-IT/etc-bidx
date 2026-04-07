import { FileText } from "lucide-react";

interface PageTitleBlockProps {
  title: string;
  description?: string;
}

export function PageTitleBlock({ title, description }: PageTitleBlockProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-lg bg-primary">
          <FileText className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
      </div>
      {description && (
        <p className="text-muted-foreground ml-[52px]">{description}</p>
      )}
    </div>
  );
}