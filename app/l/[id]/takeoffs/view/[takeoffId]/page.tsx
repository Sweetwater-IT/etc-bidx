'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import TakeoffViewContent from '../../create/[takeoffId]/TakeoffViewContent';

export default function TakeoffViewPage() {
  console.log('🔧 TakeoffViewPage: Component initialized');

  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  const takeoffId = params?.takeoffId as string;

  console.log('🔧 TakeoffViewPage: Params received:', { jobId, takeoffId });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 TakeoffViewPage: useEffect triggered, setting loading to false');
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading takeoff…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/l/${jobId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Button>
          <div className="flex items-center gap-3" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <TakeoffViewContent jobId={jobId} takeoffId={takeoffId} />
      </div>
    </div>
  );
}