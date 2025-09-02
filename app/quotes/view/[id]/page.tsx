
import QuoteViewContent from "./QuoteViewContent";

export default async function QuoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;     
  const numericId = parseInt(id, 10);

  return <QuoteViewContent quoteId={numericId} />;
}