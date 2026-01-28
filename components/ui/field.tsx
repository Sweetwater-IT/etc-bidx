"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FieldContextValue {
  name?: string
  error?: string
  required?: boolean
  disabled?: boolean
  description?: string
}

const FieldContext = React.createContext<FieldContextValue>({})

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  error?: string
  required?: boolean
  disabled?: boolean
  description?: string
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, name, error, required, disabled, description, ...props }, ref) => {
    const contextValue = React.useMemo(
      () => ({ name, error, required, disabled, description }),
      [name, error, required, disabled, description]
    )

    return (
      <FieldContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("space-y-2", className)}
          {...props}
        />
      </FieldContext.Provider>
    )
  }
)
Field.displayName = "Field"

interface FieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  asChild?: boolean
}

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FieldLabelProps
>(({ className, asChild, ...props }, ref) => {
  const { required } = React.useContext(FieldContext)

  if (asChild) {
    return <Slot ref={ref} {...props} />
  }

  return (
    <Label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {props.children}
      {required && <span className="text-red-600 ml-1">*</span>}
    </Label>
  )
})
FieldLabel.displayName = "FieldLabel"

interface FieldControlProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const FieldControl = React.forwardRef<HTMLDivElement, FieldControlProps>(
  ({ className, asChild, ...props }, ref) => {
    if (asChild) {
      return <Slot ref={ref} {...props} />
    }

    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
FieldControl.displayName = "FieldControl"

interface FieldDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean
}

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  FieldDescriptionProps
>(({ className, asChild, ...props }, ref) => {
  const { description } = React.useContext(FieldContext)

  if (asChild) {
    return <Slot ref={ref} {...props} />
  }

  if (!description && !props.children) {
    return null
  }

  return (
    <p
      ref={ref}
      className={cn(
        "text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {props.children || description}
    </p>
  )
})
FieldDescription.displayName = "FieldDescription"

interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean
}

const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, asChild, ...props }, ref) => {
    const { error } = React.useContext(FieldContext)

    if (asChild) {
      return <Slot ref={ref} {...props} />
    }

    if (!error && !props.children) {
      return null
    }

    return (
      <p
        ref={ref}
        className={cn(
          "text-sm font-medium text-red-600",
          className
        )}
        {...props}
      >
        {props.children || error}
      </p>
    )
  }
)
FieldError.displayName = "FieldError"

export {
  Field,
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldError,
  type FieldProps,
  type FieldLabelProps,
  type FieldControlProps,
  type FieldDescriptionProps,
  type FieldErrorProps,
}