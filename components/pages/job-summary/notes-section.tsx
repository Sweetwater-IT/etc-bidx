import React, { useState } from "react";
import { StickyNote, ChevronDown } from "lucide-react";

interface Note {
  id: number;
  author: string;
  text: string;
  date: string;
}

interface NotesSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  notes: Note[];
  onAddNote: (note: Omit<Note, "id">) => void;
}

export function NotesSection({
  isOpen,
  onToggle,
  notes,
  onAddNote,
}: NotesSectionProps) {
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim()) {
      onAddNote({
        author: "You",
        text: noteText,
        date: new Date().toISOString().slice(0, 10),
      });
      setNoteText("");
      setAddingNote(false);
    }
  };

  return (
    <div className="mb-2">
      <button
        className={`flex items-center justify-between w-full text-sm font-semibold text-foreground py-2 px-3 transition-colors bg-muted hover:bg-muted/80`}
        style={{
          borderRadius: isOpen ? "12px 12px 0 0" : "12px",
        }}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <StickyNote className="w-4 h-4" /> Notes
          <span className="text-xs text-muted-foreground">{notes.length}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          className="px-3 pb-4 pt-1 bg-muted transition-all duration-300"
          style={{ borderRadius: "0 0 12px 12px" }}
        >
          {notes.length === 0 && !addingNote && (
            <div className="text-sm text-muted-foreground mb-3">
              No notes for this quote
            </div>
          )}
          <ul className="space-y-2 mb-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="p-3 rounded-lg bg-background flex flex-col gap-1 border border-border"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{note.author}</span>
                  <span className="ml-auto">{note.date}</span>
                </div>
                <span className="text-foreground text-sm">{note.text}</span>
              </li>
            ))}
          </ul>
          {addingNote ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <textarea
                className="w-full min-h-[80px] rounded-md border border-border bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Add notes here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button
                type="submit"
                className="w-full py-2 rounded-md bg-muted text-sm font-semibold text-foreground hover:bg-muted/80 border border-border transition-colors"
              >
                Save Notes
              </button>
            </form>
          ) : (
            <button
              className="w-full py-2 mt-1 rounded-lg bg-muted text-xs text-muted-foreground hover:bg-muted/70 border border-dashed border-border font-medium transition-colors"
              onClick={() => setAddingNote(true)}
            >
              + Add Note
            </button>
          )}
        </div>
      )}
    </div>
  );
}
