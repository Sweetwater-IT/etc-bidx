import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-8 py-2">
        {children}
      </main>
    </div>
  );
} 