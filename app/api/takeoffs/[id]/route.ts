"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CreateWorkOrderPageContentProps {
  params: { id: string } | null;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function CreateWorkOrderPageContent({
  params,
  searchParams,
}: CreateWorkOrderPageContentProps) {
  const searchParamsObj = useSearchParams();

  const takeoffIdFromParams = params?.id;
  const takeoffIdFromQuery = searchParamsObj?.get("takeoffId") || null;
  const takeoffId = takeoffIdFromParams || takeoffIdFromQuery;

  if (!takeoffId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Missing Takeoff ID
          </h2>
          <p className="text-muted-foreground mb-6">
            This page requires a valid takeoff ID in the URL path (e.g. /l/[takeoffId]/work-orders/create) 
            or as a query parameter (e.g. ?takeoffId=xxx).
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const [takeoff, setTakeoff] = useState<any | null>(null);
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const takeoffRes = await fetch(`/api/takeoffs/${takeoffId}`);
        if (!takeoffRes.ok) throw new Error("Failed to fetch takeoff");
        const takeoffData = await takeoffRes.json();
        setTakeoff(takeoffData.takeoff);

        if (takeoffData.takeoff?.job_id) {
          const jobRes = await fetch(`/api/jobs/${takeoffData.takeoff.job_id}`);
          if (jobRes.ok) {
            const jobData = await jobRes.json();
            setJob(jobData.job || null);
          }
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [takeoffId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center text-destructive">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">
        Create Work Order for Takeoff: {takeoff?.title || takeoffId}
      </h1>

      <div className="grid gap-6">
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Takeoff Details</h2>
          <p><strong>Title:</strong> {takeoff?.title || "N/A"}</p>
          <p><strong>Work Type:</strong> {takeoff?.work_type || "N/A"}</p>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Job Details</h2>
          {job ? (
            <>
              <p><strong>Project Name:</strong> {job.project_name || "N/A"}</p>
              <p><strong>ETC Job #:</strong> {job.etc_job_number || "N/A"}</p>
            </>
          ) : (
            <p className="text-muted-foreground">No job information available</p>
          )}
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Work Order Form</h2>
          <Button>Create Work Order</Button>
        </div>
      </div>
    </div>
  );
}
