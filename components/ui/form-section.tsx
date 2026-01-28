"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    )
  }
)
FormSection.displayName = "FormSection"

interface FormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4
  gap?: "sm" | "md" | "lg"
}

export const FormGrid = React.forwardRef<HTMLDivElement, FormGridProps>(
  ({ className, columns = 2, gap = "md", children, ...props }, ref) => {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }

    const gapSize = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gridCols[columns],
          gapSize[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FormGrid.displayName = "FormGrid"