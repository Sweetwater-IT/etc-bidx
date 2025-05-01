import { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  children: ReactNode;
}

export function PageContainer({ title, children }: PageContainerProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      {children}
    </div>
  );
} 