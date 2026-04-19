import * as React from "react";

export function FullPageWorkflowFrame({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-svh w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export default function SignOrderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
