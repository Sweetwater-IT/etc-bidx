"use client"

import { ReactNode } from "react"

import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface SheetFrameProps {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  bodyClassName?: string
  headerClassName?: string
  footerClassName?: string
}

export function SheetFrame({
  title,
  description,
  children,
  footer,
  className,
  bodyClassName,
  headerClassName,
  footerClassName,
}: SheetFrameProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-background", className)}>
      <div className="relative z-10 bg-background">
        <SheetHeader className={cn("px-6 pb-4 pt-6", headerClassName)}>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <Separator />
      </div>

      <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-4", bodyClassName)}>
        {children}
      </div>

      {footer ? (
        <div className={cn("border-t px-6 py-4", footerClassName)}>
          {footer}
        </div>
      ) : null}
    </div>
  )
}
