"use client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import QuoteFormProvider from "../../create/QuoteFormProvider";
import QuoteViewContent from "./QuoteViewContent";
import QuoteEditLoader from "../../edit/[id]/QuoteEditLoader";

export default function QuoteViewPage({ params }: { params: { id: string } }) {  
  return <QuoteViewContent quoteId={params.id} />;
}
