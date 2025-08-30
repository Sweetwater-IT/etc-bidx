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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";


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
    setSelectedCustomers,
    pointOfContact,
    setPointOfContact,
    quoteId
  } = useQuoteForm();

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false); // 👈 nuevo estado


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
            label: `${customer.names?.[index] || "Unknown"} (${email}) - ${customer.name
              }`,
            customer: customer.name,
            name: customer.names?.[index] || "Unknown",
          });
        }
      });
    });

    return options;
  };

  const contactOptions = getContactOptions();

  const handleToChange = (value: string) => {
    // 👉 Si el usuario selecciona "Add New Contact"
    if (value === "__add_new__") {
      setOpen(true);
      return;
    }

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

 const handleSaveContact = async () => {
  if (!newEmail || selectedCustomers.length === 0) return;

  setSaving(true);
  try {
    const contractorId = selectedCustomers[0].id; // 👈 asegúrate de que Customer tenga `id`
    const res = await fetch("/api/customer-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractor_id: contractorId,
        name: newName,
        email: newEmail,
        quoteId: quoteId, // 👈 lo mandamos también
      }),
    });

    if (!res.ok) throw new Error("Failed to save contact");
    const newContact = await res.json();

    // ✅ actualizar estado local de customers
    const updatedCustomer = { ...selectedCustomers[0] };
    updatedCustomer.emails = [...(updatedCustomer.emails || []), newContact.email];
    updatedCustomer.names = [...(updatedCustomer.names || []), newContact.name];

    setSelectedCustomers([updatedCustomer]);
    setPointOfContact({ name: newContact.name, email: newContact.email });

    toast.success(`Contact ${newContact.name} added!`);
  } catch (err) {
    console.error(err);
    toast.error("Failed to add new contact");
  } finally {
    setSaving(false);
    setNewName("");
    setNewEmail("");
    setOpen(false);
  }
};



  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Email Details</h2>
        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)}>Add New Contact</Button>
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
              {/* 👉 Opción extra al final */}
              <SelectItem value="__add_new__">➕ Add New Contact</SelectItem>
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

      {/* Modal para añadir contacto */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveContact} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
