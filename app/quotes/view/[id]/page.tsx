import QuoteViewContent from "./QuoteViewContent";

export default function QuoteViewPage({ params }: { params: { id: string } }) {  
  return <QuoteViewContent quoteId={params.id} />;
}