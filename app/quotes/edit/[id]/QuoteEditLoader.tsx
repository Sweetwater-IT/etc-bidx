"use client";

import { useEffect } from "react";
import { useQuoteForm } from "../../create/QuoteFormProvider";
import { toast } from "sonner";
import { defaultAdminObject } from "@/types/default-objects/defaultAdminData";

export default function QuoteEditLoader({ quoteId }: { quoteId: number }) {
  const {
    setQuoteId,
    setQuoteNumber,
    setSelectedCustomers,
    setQuoteItems,
    setPaymentTerms,
    setAdminData,
    setQuoteDate,
    setStatus,
    setSubject,
    setEmailBody,
    setCustomTerms,
    setIncludeTerms,
    setIncludeFiles,
    setAssociatedContractNumber,
    setPointOfContact,
    setCcEmails,
    setBccEmails,
  } = useQuoteForm();

  useEffect(() => {
    if (!quoteId) return;

    async function fetchQuote() {
      try {
        const res = await fetch(`/api/quotes/edit/${quoteId}`);
        if (!res.ok) throw new Error("Failed to fetch quote");
        const data = await res.json();

        console.log("🚀 [QuoteEditLoader] Loaded quote:", data);

        
        setQuoteId(data.id);
        setQuoteNumber(data.quote_number);
        setStatus(data.status || "Not Sent");
        setQuoteDate(data.date_sent || data.created_at);

     
        setSelectedCustomers(data.customers || []);

        
        setQuoteItems(data.items || []);

      
       setAdminData(data.admin_data ?? defaultAdminObject);


       
        const point = data.recipients?.find((r: any) => r.point_of_contact);
        const cc =
          data.recipients?.filter((r: any) => r.cc).map((r: any) => r.email) ||
          [];
        const bcc =
          data.recipients?.filter((r: any) => r.bcc).map((r: any) => r.email) ||
          [];

        if (point) {
          setPointOfContact({
            name:
              point.customer_contacts?.name ??
              point.name ??
              "", 
            email:
              point.email ??
              point.customer_contacts?.email ??
              "",
          });
        } else {
          setPointOfContact(undefined);
        }

        setCcEmails(cc);
        setBccEmails(bcc);

       
        setSubject(data.subject || "");
        setEmailBody(data.body || "");

      
        setCustomTerms(data.custom_terms_conditions || "");
        setIncludeTerms(data.include_terms || {});
        setIncludeFiles(data.include_files || {});
        setAssociatedContractNumber(data.associated_contract_number || "");

       
        setPaymentTerms(data.payment_terms || "NET30");
      } catch (err) {
        console.error("💥 [QuoteEditLoader] Error loading quote:", err);
        toast.error("Could not load quote for editing");
      }
    }

    fetchQuote();
  }, [quoteId]);

  return null;
}
