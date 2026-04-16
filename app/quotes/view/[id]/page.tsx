
import { SiteHeader } from "@/components/site-header";
import QuoteViewContent from "./QuoteViewContent";

export default async function QuoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;     
  const numericId = parseInt(id, 10);

  return (
    <>
      <SiteHeader showTitleBlock={false} />
      <QuoteViewContent quoteId={numericId} />
    </>
  );
}
