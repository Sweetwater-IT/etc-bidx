"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multiselect";
import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
export function QuoteEmailDetails() {
  const {
    selectedEmail,
    setSelectedEmail,
    ccEmails,
    setCcEmails,
    bccEmails,
    setBccEmails,
    subject,
    setSubject,
    emailBody,
    setEmailBody,
    sending,
    getContactsForSelectedCustomers
  } = useQuoteForm();

  const availableContacts = getContactsForSelectedCustomers();
  const contactOptions = availableContacts.map(contact => ({
    value: contact.value,
    label: contact.label
  }));

  const handleSendTest = async () => {
    // Handle test email sending
  };

  const handleAddContact = () => {
    // Handle adding new contact
  };

  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Email Details</h2>
        <div className="flex gap-2">
          <Button onClick={handleSendTest} disabled={sending} variant="outline">
            {sending ? "Sending..." : "Send Test Email"}
          </Button>
          <Button onClick={handleAddContact}>Add New Contact</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>To</Label>
          <MultiSelect
            options={contactOptions}
            selected={selectedEmail ? [selectedEmail] : []}
            onChange={(selected) => setSelectedEmail(selected[0] || "")}
            placeholder="Point of Contact"
          />
        </div>

        <div className="space-y-2">
          <Label>CC</Label>
          <MultiSelect
            options={contactOptions}
            selected={ccEmails}
            onChange={setCcEmails}
            placeholder="Choose CC addresses"
          />
        </div>

        <div className="space-y-2">
          <Label>BCC</Label>
          <MultiSelect
            options={contactOptions}
            selected={bccEmails}
            onChange={setBccEmails}
            placeholder="Choose BCC addresses"
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
          <Input 
            value={process.env.SENDGRID_FROM_EMAIL || "it@establishedtraffic.com"}
            disabled
          />
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