import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  options?: Option[];
  className?: string;
}

export function TagsInput({
  value,
  onChange,
  placeholder = "Add tags...",
  options = [],
  className,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on input
  const filteredOptions = options.filter(
    option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.value.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowOptions(true);
    setSelectedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
        addTag(filteredOptions[selectedIndex].value);
      } else if (inputValue.trim()) {
        // Allow adding custom email if it looks like a valid email
        if (inputValue.includes("@") || options.length === 0) {
          addTag(inputValue.trim());
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowOptions(false);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInputValue("");
    setShowOptions(false);
    setSelectedIndex(-1);
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleOptionClick = (option: Option) => {
    addTag(option.value);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] cursor-text"
           onClick={() => inputRef.current?.focus()}>
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded"
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="hover:bg-primary/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowOptions(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 outline-none min-w-[120px] bg-transparent"
        />
      </div>

      {showOptions && (filteredOptions.length > 0 || inputValue) && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              onClick={() => handleOptionClick(option)}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100",
                selectedIndex === index && "bg-gray-100"
              )}
            >
              {option.label}
            </div>
          ))}
          {inputValue && !filteredOptions.some(opt => opt.value === inputValue) && (
            <div
              onClick={() => addTag(inputValue)}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100 text-gray-600",
                selectedIndex === filteredOptions.length && "bg-gray-100"
              )}
            >
              Add "{inputValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}