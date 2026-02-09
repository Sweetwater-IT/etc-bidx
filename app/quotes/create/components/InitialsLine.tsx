// components/InitialsLine.tsx
import React from 'react';

interface InitialsLineProps {
  label?: string;
  width?: string;
}

export const InitialsLine: React.FC<InitialsLineProps> = ({
  label = "Initials",
  width = "w-[80px]",
}) => {
  return (
    <div className="flex items-end gap-2 mt-2">
      <span>{label}</span>
      <span className={`border-b border-black ${width} inline-block`}></span>
    </div>
  );
};
