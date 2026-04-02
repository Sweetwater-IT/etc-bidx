"use client";

import { useEffect } from "react";
import { useQuoteForm } from "../../create/QuoteFormProvider";
import { toast } from "sonner";
import { defaultAdminObject } from "@/types/default-objects/defaultAdminData";
import { Note } from "@react-pdf/renderer";
import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";

const exclusionsText = "Arrow Panels/Changeable Message Sign/Radar Trailer unless specified\nShadow vehicles/Truck Mounted Attenuators and operators unless specified\nTraffic Signal activation/deactivation/flash (contractors responsibility)\nTemporary signals, lighting, related signage and traffic control unless specified\nAll Traffic Signal Work, modifying\nShop/plan drawings and/or layout for MPT signing – professional engineering services\nWork Zone Liquidated Damages\nHoliday or work stoppage removal of signs and/or devices\nPavement Marking and Removal\nNotification of (including permits from) officials (i.e., Police, Government, DOT)/business and property owners\nAll electrical work/line and grade work/Location of Utilities Not Covered by PA One Call\nIncidental items not specifically included above";

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
    setNotes,
    setQuoteMetadata,
    setLoadingMetadata,
    setCanAutosave
  } = useQuoteForm();

  useEffect(() => {
    setLoadingMetadata(true)
    if (!quoteId) return;

    async function fetchQuote() {
      try {
        const res = await fetch(`/api/quotes/edit/${quoteId}`);
        if (!res.ok) throw new Error("Failed to fetch quote");
        const data = await res.json();

        const hydratedCustomer =
          Array.isArray(data.customers) && data.customers.length > 0
            ? data.customers[0]
            : null;

        const hydratedPoint = data.recipients?.find((r: any) => r.point_of_contact);
        const hydratedPointContact =
          Array.isArray(hydratedPoint?.customer_contacts) &&
          hydratedPoint.customer_contacts.length > 0
            ? hydratedPoint.customer_contacts[0]
            : null;

        const hydratedCustomerAddress =
          hydratedCustomer
            ? [
                hydratedCustomer.address || "",
                hydratedCustomer.city || "",
                hydratedCustomer.state || "",
                hydratedCustomer.zip || "",
              ]
                .filter(Boolean)
                .join(", ")
            : data.customer_address;

        setQuoteMetadata({
          id: data.id,
          from_email: data.from_email,
          subject: data.subject,
          body: data.body,
          estimate_id: data.estimate_id,
          job_id: data.job_id,
          date_sent: data.date_sent,
          response_token: data.response_token,
          status: data.status,
          quote_number: data.quote_number,
          custom_terms_conditions: data.custom_terms_conditions,
          payment_terms: data.payment_terms,
          county: data.county,
          state_route: data.state_route,
          ecms_po_number: data.ecms_po_number,
          bedford_sell_sheet: data.bedford_sell_sheet,
          flagging_price_list: data.flagging_price_list,
          flagging_service_area: data.flagging_service_area,
          standard_terms: data.standard_terms,
          rental_agreements: data.rental_agreements,
          equipment_sale: data.equipment_sale,
          flagging_terms: data.flagging_terms,
          created_at: data.created_at,
          updated_at: data.updated_at,
          type_quote: data.type_quote,
          customer_job_number: data.customer_job_number,
          purchase_order: data.purchase_order,
          township: data.township,
          sr_route: data.sr_route,
          job_address: data.job_address,
          ecsm_contract_number: data.ecsm_contract_number,
          bid_date: data.bid_date,
          start_date: data.start_date,
          end_date: data.end_date,
          duration: data.duration,
          job_number: data.job_number,
          customer_name:
            hydratedCustomer?.name ||
            hydratedCustomer?.displayName ||
            data.customer_name,
          customer_email:
            hydratedPointContact?.email ||
            hydratedPoint?.email ||
            data.customer_email,
          customer_phone:
            hydratedPointContact?.phone ||
            data.customer_phone,
          customer_address: hydratedCustomerAddress || "",
          etc_point_of_contact: data.etc_point_of_contact,
          etc_poc_email: data.etc_poc_email,
          etc_poc_phone_number: data.etc_poc_phone_number,
          etc_branch: data.etc_branch,
          customer: hydratedCustomer?.id || data.customer,
          customer_contact:
            hydratedPointContact?.name ||
            data.customer_contact,
          selectedfilesids: data.selectedfilesids,
          aditionalFiles: data.aditionalFiles,
          aditionalTerms: data.aditionalTerms,
          pdf_url: data.pdf_url,
          comments: data.comments,
          digital_signature: data.digital_signature,
          etc_job_number: data.etc_job_number,
          notes: data.notes,
          exclusionsText: data.exclusionsText || exclusionsText,
          termsText: data.termsText,
          aditionalExclusions: data.aditionalExclusions,
          tax_rate: data.tax_rate
        });
        setQuoteId(data.id);
        setQuoteNumber(data.quote_number);
        setStatus(data.status || "Not Sent");
        setQuoteDate(data.date_sent || data.created_at);
        setSelectedCustomers(hydratedCustomer ? [hydratedCustomer] : []);

        setQuoteItems([
          ...(data.items || []),
          {
            id: generateUniqueId(),
            itemNumber: "",
            description: "",
            uom: "",
            quantity: 0,
            unitPrice: 0,
            discountType: "dollar",
            discount: 0,
            notes: "",
            tax: 0,
            is_tax_percentage: false,
            associatedItems: [],
            quote_id: quoteId || null,
            created: false,
          },
        ]);
        setAdminData(data.admin_data ?? defaultAdminObject);

        const point = hydratedPoint;
        const cc =
          data.recipients?.filter((r: any) => r.cc).map((r: any) => r.email) ||
          [];
        const bcc =
          data.recipients?.filter((r: any) => r.bcc).map((r: any) => r.email) ||
          [];

        if (point) {
          setPointOfContact({
            id: hydratedPointContact?.id,
            name: hydratedPointContact?.name ?? point.name ?? "",
            email: point.email ?? hydratedPointContact?.email ?? "",
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
      } finally {
        setCanAutosave(true)
        setLoadingMetadata(false)
      }

    }

    fetchQuote();
  }, [quoteId]);

  return null;
}
