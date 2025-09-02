import { BidProposalReactPDF } from '@/components/pages/quote-form/BidProposalReactPDF';
import { renderToBuffer } from '@react-pdf/renderer';

export async function generateQuotePDF(props: any) {
  return await renderToBuffer(<BidProposalReactPDF {...props} />);
}