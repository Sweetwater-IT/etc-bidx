import React, { useRef, useState } from "react";
import { FileText, ChevronDown, X } from "lucide-react";

const ATTACH_OPTIONS = [
  "Flagging Price List",
  "Flagging Service Area",
  "Bedford Branch Sell Sheet",
];

interface File {
  id: number;
  name: string;
  attachedOptions: string[];
}

interface FilesSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  files: File[];
  onAddFile: (file: Omit<File, "id">) => void;
  onUpdateFileOptions: (id: number, options: string[]) => void;
}

export function FilesSection({
  isOpen,
  onToggle,
  files,
  onAddFile,
  onUpdateFileOptions,
}: FilesSectionProps) {
  const [addingFile, setAddingFile] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [checkedOptions, setCheckedOptions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop or selection
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0]; // Só permite um por vez para UX melhor
    setPendingFile({ id: 0, name: file.name, attachedOptions: [] });
    setCheckedOptions([]);
  };

  // Toggle static option
  const handleToggleOption = (option: string) => {
    setCheckedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  // Adicionar arquivo
  const handleAddPendingFile = () => {
    if (pendingFile) {
      onAddFile({ name: pendingFile.name, attachedOptions: checkedOptions });
      setPendingFile(null);
      setCheckedOptions([]);
      setAddingFile(false);
    }
  };

  // Cancelar adição
  const handleCancel = () => {
    setPendingFile(null);
    setCheckedOptions([]);
    setAddingFile(false);
  };

  return (
    <div className="mb-2">
      <button
        className={`flex items-center justify-between w-full text-sm font-semibold py-2 px-3 transition-colors bg-muted hover:bg-muted/80 text-foreground dark:text-white`}
        style={{
          borderRadius: isOpen ? "12px 12px 0 0" : "12px",
        }}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4" /> Files
          <span className="text-xs text-muted-foreground">{files.length}</span>
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
          {addingFile ? (
            <>
              {!pendingFile ? (
                <div
                  className="w-full mb-4 p-4 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-center text-muted-foreground cursor-pointer select-none bg-background dark:bg-zinc-900"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFiles(e.dataTransfer.files);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  Drop files here to send as attachments to the quote
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={false}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4 items-center mb-4">
                  <div className="w-full rounded-lg border border-border bg-background dark:bg-zinc-900 p-3 text-foreground dark:text-white font-semibold text-sm flex items-center justify-between">
                    <span>{pendingFile.name}</span>
                    <button
                      className="ml-2 p-1 rounded hover:bg-muted"
                      onClick={handleCancel}
                      title="Cancel"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    {ATTACH_OPTIONS.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 text-sm text-foreground dark:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={checkedOptions.includes(option)}
                          onChange={() => handleToggleOption(option)}
                          className="accent-primary h-4 w-4 rounded border border-border bg-background"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 w-full mt-2">
                    <button
                      className="flex-1 py-2 rounded-lg bg-muted text-xs text-muted-foreground border border-border font-medium hover:bg-muted/70 transition-colors"
                      onClick={handleCancel}
                      type="button"
                    >
                      Cancel
                    </button>

                    <button
                      className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                      onClick={handleAddPendingFile}
                      type="button"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <ul className="space-y-2 mb-2">
                {files.map((file) => (
                  <li key={file.id}>
                    <div className="w-full text-left p-3 rounded-lg border border-border bg-background dark:bg-zinc-900 text-foreground dark:text-white font-semibold text-[12px] hover:bg-muted transition-colors">
                      {file.name}
                    </div>
                  </li>
                ))}
              </ul>
              <button
                className="w-full py-2 rounded-lg bg-muted text-xs text-muted-foreground hover:bg-muted/70 border border-dashed border-border font-medium transition-colors"
                onClick={() => setAddingFile(true)}
              >
                + Add File
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
