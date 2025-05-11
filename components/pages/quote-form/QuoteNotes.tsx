"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function QuoteNotes() {
  const [notes, setNotes] = useState("");

  const handleSaveNotes = () => {
    // Logic to save notes
    console.log("Saving notes:", notes);
  };

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Notes</h2>
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          No notes for this job
        </div>
        <Textarea 
          placeholder="Add notes here..."
          className="min-h-[150px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button className="w-full" onClick={handleSaveNotes}>
          Save Notes
        </Button>
      </div>
    </div>
  );
}