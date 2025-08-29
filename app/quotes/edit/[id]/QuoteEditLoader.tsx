"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuoteForm } from "../../create/QuoteFormProvider";
import { toast } from "sonner";

export default function QuoteEditLoader() {
    const { id } = useParams() as { id: string }
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
        async function fetchQuote() {
            try {
                const res = await fetch(`/api/quotes/${id}`);
                if (!res.ok) throw new Error("Failed to fetch quote");
                const data = await res.json();

                // precargar datos en el contexto
                setQuoteId(data.id);
                setSelectedCustomers(data.customers || []);
                setQuoteItems(data.items || []);
                setPaymentTerms(data.paymentTerms || "NET30");
                setAdminData(data.adminData);
                setQuoteDate(data.quoteDate);
                setStatus(data.status || "Not Sent");
                setSubject(data.subject || "");
                setEmailBody(data.emailBody || "");
                setCustomTerms(data.customTerms || "");
                setIncludeTerms(data.includeTerms || {});
                setIncludeFiles(data.includeFiles || {});
                setAssociatedContractNumber(data.associatedContractNumber || "");
            } catch (err) {
                console.error(err);
                toast.error("Could not load quote for editing");
            }
        }

        fetchQuote();
    }, [id]);

    return null; // este loader solo hidrata el contexto
}
