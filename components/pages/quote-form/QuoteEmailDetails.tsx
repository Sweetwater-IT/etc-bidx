"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagsInput } from "@/components/ui/tags-input";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";

export function QuoteEmailDetails() {
  const {
    ccEmails,
    setCcEmails,
    bccEmails,
    setBccEmails,
    subject,
    setSubject,
    emailBody,
    setEmailBody,
    selectedCustomers,
    pointOfContact,
    setPointOfContact,
    sending,
  } = useQuoteForm();

  // Create contact options from all selected customers
  const getContactOptions = () => {
    const options: {
      value: string;
      label: string;
      customer: string;
      name: string;
    }[] = [];

    selectedCustomers.forEach((customer) => {
      customer.emails.forEach((email, index) => {
        if (email) {
          options.push({
            value: email,
            label: `${customer.names[index] || "Unknown"} (${email}) - ${
              customer.name
            }`,
            customer: customer.name,
            name: customer.names[index] || "Unknown",
          });
        }
      });
    });

    return options;
  };

  const contactOptions = getContactOptions();

  const handleToChange = (value: string) => {
    const selectedContact = contactOptions.find(
      (option) => option.value === value
    );
    if (selectedContact) {
      setPointOfContact({
        email: selectedContact.value,
        name: selectedContact.name,
      });
    }
  };

  const handleAddContact = () => {
    // TODO: Implement adding new contact modal/form
    console.log("Add new contact");
  };

  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Email Details</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddContact}>Add New Contact</Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>To</Label>
          <Select
            value={pointOfContact?.email || ""}
            onValueChange={handleToChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select point of contact" />
            </SelectTrigger>
            <SelectContent>
              {contactOptions.map((option, idx) => (
                <SelectItem key={option.value + "-" + idx} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>CC</Label>
          <TagsInput
            value={ccEmails}
            onChange={setCcEmails}
            placeholder="Add CC emails..."
            options={contactOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>

        <div className="space-y-2">
          <Label>BCC</Label>
          <TagsInput
            value={bccEmails}
            onChange={setBccEmails}
            placeholder="Add BCC emails..."
            options={contactOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>From</Label>
          <Input value="it@establishedtraffic.com" disabled />
        </div>

        <div className="space-y-2">
          <Label>Body</Label>
          <Textarea
            placeholder="Body"
            className="min-h-[150px]"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
