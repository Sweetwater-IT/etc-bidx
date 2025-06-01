import { useState } from "react";

type StatusTabsProps = {
  tabs: {
    label: string;
    value: string;
  }[];
  onChange?: (value: string) => void;
  value?: string;
  counts?: Record<string, number>;
};

export function StatusTabs({ tabs, onChange, value, counts }: StatusTabsProps) {
  const [internalValue, setInternalValue] = useState(tabs[0]?.value);
  
  const activeTab = value !== undefined ? value : internalValue;

  const handleTabChange = (tabValue: string) => {
    if (value === undefined) {
      setInternalValue(tabValue);
    }
    
    if (onChange) {
      onChange(tabValue);
    }
  };

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.value
                ? "border-indigo-500 text-indigo-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
