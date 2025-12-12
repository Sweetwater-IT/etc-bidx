"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IconLoader2, IconCircleCheck, IconAlertCircle } from "@tabler/icons-react"
import { toast } from "sonner"

interface GetHelpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GetHelpModal({ open, onOpenChange }: GetHelpModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsSuccess(false)

    try {
      const response = await fetch("/api/send-help-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      setIsSuccess(true)
      toast.success("Message sent successfully!", {
        description: "IT will get back to you shortly.",
      })

      setTimeout(() => {
        setFormData({
          subject: "",
          message: "",
        })
        setIsSuccess(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">Get Help</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Describe your technical issue below and we&apos;ll respond as quickly as possible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject
            </Label>
            <Input
              id="subject"
              placeholder="Brief description of the issue"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              disabled={isSubmitting || isSuccess}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Detailed Description
            </Label>
            <Textarea
              id="message"
              placeholder="Please provide as much detail as possible about your issue, including any error messages or steps to reproduce the problem."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={8}
              disabled={isSubmitting || isSuccess}
              className="resize-none"
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex gap-3">
              <IconAlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">Need immediate assistance?</p>
                <p className="text-muted-foreground">
                  For urgent issues, call IT Support directly at{" "}
                  <a href="tel:+1234567890" className="text-foreground font-medium hover:underline">
                    (123) 456-7890
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isSuccess}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isSuccess} className="flex-1 h-11">
              {isSubmitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSuccess && <IconCircleCheck className="mr-2 h-4 w-4" />}
              {isSuccess ? "Request Sent!" : isSubmitting ? "Sending Request..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
