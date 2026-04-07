import { redirect } from "next/navigation";

export default async function TakeoffViewPage({ params }: any) {
  const resolvedParams = await params;
  const jobId = resolvedParams.id;
  const takeoffId = resolvedParams.takeoffId;

  redirect(`/l/${jobId}/takeoffs/view/${takeoffId}`);
}
