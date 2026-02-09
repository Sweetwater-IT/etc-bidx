"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          // Default toast styling
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          
          // Success toast styling (green)
          "--success-bg": "hsl(142.1, 76.2%, 36.3%)", // Green color
          "--success-text": "hsl(0, 0%, 100%)", // White text
          "--success-border": "hsl(142.1, 76.2%, 36.3%)",
          
          // Error toast styling (red)
          "--error-bg": "hsl(0, 84.2%, 60.2%)", // Red color
          "--error-text": "hsl(0, 0%, 100%)", // White text
          "--error-border": "hsl(0, 84.2%, 60.2%)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
