"use client";

import { useQuoteForm } from "@/app/quotes/create/QuoteFormProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function QuoteNotes() {
  const [localNotes, setLocalNotes] = useState<string>('');


  const  { notes, setNotes } = useQuoteForm();

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Notes</h2>
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {notes === '' ? 'No notes for this quote' : notes }
        </div>
        <Textarea 
          placeholder="Add notes here..."
          className="min-h-[150px]"
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
        />
        <Button className="w-full" onClick={() => setNotes(localNotes)}>
          Save Notes
        </Button>
      </div>
    </div>
  );
}