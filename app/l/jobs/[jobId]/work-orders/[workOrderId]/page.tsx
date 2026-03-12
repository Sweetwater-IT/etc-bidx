import { redirect } from "next/navigation";
export default async function WorkOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string; workOrderId: string }>;
  searchParams: Promise<{ takeoffId?: string }>;
}) {
  const { jobId, workOrderId } = await params;
  const { takeoffId } = await searchParams;

  const qs = takeoffId ? `?takeoffId=${encodeURIComponent(takeoffId)}` : "";
  redirect(`/l/jobs/${jobId}/work-orders/${workOrderId}/view${qs}`);
}
