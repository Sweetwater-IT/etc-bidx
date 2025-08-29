import QuoteViewContent from "./QuoteViewContent";

export default function QuoteViewPage({ params }: any ) {  
  return <QuoteViewContent quoteId={params.id} />;
}