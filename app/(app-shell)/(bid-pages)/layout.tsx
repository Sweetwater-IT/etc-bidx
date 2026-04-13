import { SiteHeader } from "@/components/site-header";

export default function BidPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader showTitleBlock={false} />
      {children}
    </>
  );
}
