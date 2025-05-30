import { useRef, useState } from "react";

interface Estimate {
  contract_number: string;
  branch: string;
}

interface Job {
  job_number: string;
  branch: string;
}

interface ContractJobSelectorProps {
  allEstimates: Estimate[];
  allJobs: Job[];
  selectedContractJob: Estimate | Job | null;
  onSelect: (job: Estimate | Job | null) => void;
  onAddNew: () => void;
  onEdit: () => void;
  searchValue: string;
  setSearchValue: (v: string) => void;
}

export function ContractJobSelector({
  allEstimates = [],
  allJobs = [],
  selectedContractJob,
  onSelect,
  onAddNew,
  onEdit,
  searchValue,
  setSearchValue,
}: ContractJobSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef(null);

  // Fecha dropdown ao clicar fora
  const handleBlur = (e) => {
    setTimeout(() => setDropdownOpen(false), 150);
  };

  // Renderização dos itens
  const filteredEstimates = allEstimates.filter(
    (e) => !searchValue || e.contract_number.includes(searchValue)
  );
  // (Opcional) Filtrar jobs também
  const filteredJobs = allJobs.filter(
    (j) => !searchValue || j.job_number.includes(searchValue)
  );

  return (
    <div className="w-full max-w-xl">
      <div className="text-2xl font-semibold mb-4">Admin Information</div>
      <div className="mb-2 font-medium">Contract / Job</div>
      <div className="relative">
        <input
          ref={inputRef}
          className="w-full border rounded-lg px-3 py-2 mb-1"
          placeholder="Search or add a contract/job..."
          value={selectedContractJob ? ("contract_number" in selectedContractJob ? selectedContractJob.contract_number : selectedContractJob.job_number) : searchValue}
          onChange={e => {
            setSearchValue(e.target.value);
            setDropdownOpen(true);
            if (selectedContractJob) onSelect(null); // Limpa seleção ao digitar
          }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={handleBlur}
          readOnly={!!selectedContractJob}
        />
        {/* Ícone de editar se houver item selecionado */}
        {selectedContractJob && (
          <button
            className="absolute right-3 top-2 text-gray-500 hover:text-black"
            onClick={onEdit}
            title="Edit"
            tabIndex={-1}
            type="button"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6v-3.586a1 1 0 01.293-.707l9-9a1 1 0 011.414 0l3.586 3.586a1 1 0 010 1.414l-9 9A1 1 0 016 19H3a1 1 0 01-1-1z"></path>
            </svg>
          </button>
        )}
        {/* Dropdown */}
        {dropdownOpen && !selectedContractJob && (
          <div
            className="absolute left-0 right-0 z-10 bg-popover border border-border rounded shadow max-h-64 overflow-auto mt-1"
          >
            <div
              className="cursor-pointer px-3 py-2 hover:bg-muted border-b font-medium"
              onMouseDown={onAddNew}
            >
              + Add new
            </div>
            <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">
              Estimates
            </div>
            {filteredEstimates.map((e) => (
              <div
                key={e.contract_number}
                className="px-3 py-2 cursor-pointer hover:bg-muted"
                onMouseDown={() => onSelect(e)}
              >
                {e.contract_number}{" "}
                <span className="text-xs text-muted-foreground">
                  ({e.branch})
                </span>
              </div>
            ))}
            <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">
              Jobs
            </div>
            {filteredJobs.map((j) => (
              <div
                key={j.job_number}
                className="px-3 py-2 cursor-pointer hover:bg-muted"
                onMouseDown={() => onSelect(j)}
              >
                {j.job_number}{" "}
                <span className="text-xs text-muted-foreground">
                  ({j.branch})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
