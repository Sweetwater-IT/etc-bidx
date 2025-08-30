"use client";

import { useEffect } from "react";
import { useQuoteForm } from "../../create/QuoteFormProvider";
import { toast } from "sonner";

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
  } = useQuoteForm();

  useEffect(() => {
    if (!quoteId) return;

    async function fetchQuote() {
      try {
        const res = await fetch(`/api/quotes/${quoteId}`);
        if (!res.ok) throw new Error("Failed to fetch quote");
        const data = await res.json();

        // 🚀 Usamos directamente lo que viene del backend
        console.log("Setting quoteId:", data.id); // log agregado
        setQuoteId(data.id);
        setQuoteNumber(data.quote_number);
        setSelectedCustomers(data.customer ? [data.customer] : []);
        setQuoteItems(data.items || []);
        setPaymentTerms(data.payment_terms || "NET30");
        setAdminData(data.admin_data || null); // 👈 ya viene de la API
        setQuoteDate(data.date_sent || data.created_at);
        setStatus(data.status || "Not Sent");
        setSubject(data.subject || "");
        setEmailBody(data.body || "");
        setCustomTerms(data.custom_terms_conditions || "");
        setIncludeTerms(data.include_terms || {});
        setIncludeFiles(data.include_files || {});
        setAssociatedContractNumber(data.associated_contract_number || "");
      } catch (err) {
        console.error(err);
        toast.error("Could not load quote for editing");
      }
    }

    fetchQuote();
  }, [quoteId]);

  return null;
}
