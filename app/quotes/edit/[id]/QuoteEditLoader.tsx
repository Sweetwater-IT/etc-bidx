"use client";

import { useEffect } from "react";
import { useQuoteForm } from "../../create/QuoteFormProvider";
import { toast } from "sonner";

export default function QuoteEditLoader({ quoteId }: { quoteId: number }) {
  const {
    setQuoteId,
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

        // 👇 Mapear snake_case → camelCase
        const mappedData = {
          id: data.id,
          quoteNumber: data.quote_number,
          status: data.status,
          createdAt: data.created_at,
          dateSent: data.date_sent,
          jobId: data.job_id,
          estimateId: data.estimate_id,
          notes: data.notes,
          ecmsPoNumber: data.contract_number, // alias que devolvimos en la API
          adminData: data.admin_data,
          customers: data.customer ? [data.customer] : [],
          items: data.items || [],
          subject: data.subject || "",
          body: data.body || "",
          customTerms: data.custom_terms_conditions || "",
          includeTerms: data.include_terms || {},
          includeFiles: data.include_files || {},
          associatedContractNumber: data.associated_contract_number || "",
        };

        // 👇 Cargar en el provider
        setQuoteId(mappedData.id);
        setSelectedCustomers(mappedData.customers);
        setQuoteItems(mappedData.items);
        setPaymentTerms(data.payment_terms || "NET30");
        setAdminData(mappedData.adminData);
        setQuoteDate(mappedData.dateSent || mappedData.createdAt);
        setStatus(mappedData.status || "Not Sent");
        setSubject(mappedData.subject);
        setEmailBody(mappedData.body);
        setCustomTerms(mappedData.customTerms);
        setIncludeTerms(mappedData.includeTerms);
        setIncludeFiles(mappedData.includeFiles);
        setAssociatedContractNumber(mappedData.associatedContractNumber);
      } catch (err) {
        console.error(err);
        toast.error("Could not load quote for editing");
      }
    }

    fetchQuote();
  }, [quoteId]);

  return null;
}
