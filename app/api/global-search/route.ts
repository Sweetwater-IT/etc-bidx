import { NextRequest, NextResponse } from "next/server";

import { sanitizePostgrestSearchTerm } from "@/lib/postgrest-search";
import { supabase } from "@/lib/supabase";

type SearchSectionKey =
  | "bid"
  | "job"
  | "contract"
  | "sign-order"
  | "quote"
  | "customer"
  | "contact";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  target: string;
}

interface SearchSection {
  key: SearchSectionKey;
  label: string;
  items: SearchResultItem[];
}

function buildSearchTarget(pathname: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function includesQuery(value: unknown, query: string) {
  return String(value || "").toLowerCase().includes(query);
}

function formatCustomerName(customer: { display_name?: string | null; name?: string | null; id?: number | string }) {
  return customer.display_name?.trim() || customer.name?.trim() || `Customer #${customer.id}`;
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const rawQuery = request.nextUrl.searchParams.get("query") || "";
    const query = sanitizePostgrestSearchTerm(rawQuery);
    const normalizedQuery = query.toLowerCase();
    const limit = Math.min(Math.max(Number.parseInt(request.nextUrl.searchParams.get("limit") || "5", 10) || 5, 1), 10);

    if (!query) {
      return NextResponse.json({ success: true, query: "", sections: [] as SearchSection[] });
    }

    const customerResult = await supabase
      .from("contractors")
      .select("id, name, display_name, customer_number, main_phone")
      .eq("is_deleted", false)
      .order("display_name", { ascending: true })
      .limit(250);

    const customers = (customerResult.data || []).filter((customer) =>
      [
        customer.name,
        customer.display_name,
        customer.customer_number,
        customer.main_phone,
      ].some((field) => includesQuery(field, normalizedQuery))
    );

    const contactResult = await supabase
      .from("customer_contacts")
      .select("id, contractor_id, name, role, email, phone")
      .eq("is_deleted", false)
      .order("name", { ascending: true })
      .limit(250);

    const contacts = (contactResult.data || []).filter((contact) =>
      [contact.name, contact.role, contact.email, contact.phone].some((field) =>
        includesQuery(field, normalizedQuery)
      )
    );

    const customerNameMap = new Map<number, string>();
    customers.forEach((customer) => {
      customerNameMap.set(customer.id, formatCustomerName(customer));
    });

    if (contacts.length > 0) {
      const missingCustomerIds = Array.from(
        new Set(
          contacts
            .map((contact) => contact.contractor_id)
            .filter((value): value is number => typeof value === "number" && !customerNameMap.has(value))
        )
      );

      if (missingCustomerIds.length > 0) {
        const missingCustomersResult = await supabase
          .from("contractors")
          .select("id, name, display_name")
          .in("id", missingCustomerIds);

        (missingCustomersResult.data || []).forEach((customer) => {
          customerNameMap.set(customer.id, formatCustomerName(customer));
        });
      }
    }

    const matchingCustomerIds = Array.from(
      new Set([
        ...customers.map((customer) => customer.id),
        ...contacts
          .map((contact) => contact.contractor_id)
          .filter((value): value is number => typeof value === "number"),
      ])
    );

    const [matchingAdminRowsResult, matchingQuoteIdsResult] = await Promise.all([
      supabase
        .from("admin_data_entries")
        .select("bid_estimate_id, job_id, contract_number")
        .ilike("contract_number", `%${query}%`)
        .limit(200),
      matchingCustomerIds.length > 0
        ? supabase
            .from("quotes_customers")
            .select("quote_id")
            .in("contractor_id", matchingCustomerIds)
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const matchingEstimateIds = Array.from(
      new Set(
        (matchingAdminRowsResult.data || [])
          .map((row) => row.bid_estimate_id)
          .filter((value): value is number => typeof value === "number")
      )
    );
    const matchingJobIds = Array.from(
      new Set(
        (matchingAdminRowsResult.data || [])
          .map((row) => row.job_id)
          .filter((value): value is number => typeof value === "number")
      )
    );
    const matchingQuoteIds = Array.from(
      new Set(
        (matchingQuoteIdsResult.data || [])
          .map((row) => row.quote_id)
          .filter((value): value is number => typeof value === "number")
      )
    );

    const [availableBidsResult, activeBidsResult, jobsResult, contractsResult, signOrdersResult, quotesResult] =
      await Promise.all([
        supabase
          .from("available_jobs")
          .select("id, contract_number, owner, county, location, requestor, status, archived")
          .eq("archived", false)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("estimate_complete")
          .select("id, status, contractor_name, subcontractor_name, admin_data, archived, deleted")
          .eq("deleted", false)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("jobs_complete")
          .select("id, job_number, bid_number, contractor_name, customer_contract_number, project_status, admin_data, archived, deleted")
          .eq("deleted", false)
          .eq("archived", false)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("jobs_l")
          .select("id, project_name, contract_number, customer_name, etc_job_number, project_owner, county, contract_status, project_status, archived")
          .eq("archived", false)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("sign_orders")
          .select("id, order_number, contract_number, job_number, requestor, contractor_id, status, created_at")
          .neq("status", "DRAFT")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("quotes")
          .select("id, quote_number, status, type_quote, customer_name, customer_contact, etc_job_number, estimate_id, job_id, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

    const bidItems = dedupeById([
      ...(availableBidsResult.data || [])
        .filter((item) =>
          [
            item.contract_number,
            item.owner,
            item.county,
            item.location,
            item.requestor,
            item.status,
          ].some((field) => includesQuery(field, normalizedQuery))
        )
        .map((item) => ({
          id: `available-${item.id}`,
          title: item.contract_number || `Bid ${item.id}`,
          subtitle: [item.owner, item.county, item.location].filter(Boolean).join(" • ") || "Open bid",
          meta: "Open Bid",
          target: buildSearchTarget("/bid-board", { availableSearch: query }),
        })),
      ...(activeBidsResult.data || [])
        .filter((item) => item.archived !== true)
        .filter((item) => {
          const contractNumber = item.admin_data?.contractNumber;
          return (
            matchingEstimateIds.includes(item.id) ||
            [
              contractNumber,
              item.contractor_name,
              item.subcontractor_name,
              item.admin_data?.owner,
              item.admin_data?.county?.name,
              item.admin_data?.estimator,
              item.status,
            ].some((field) => includesQuery(field, normalizedQuery))
          );
        })
        .map((item) => ({
          id: `active-${item.id}`,
          title: item.admin_data?.contractNumber || `Bid ${item.id}`,
          subtitle:
            [
              item.contractor_name || item.subcontractor_name,
              item.admin_data?.county?.name,
              item.status,
            ]
              .filter(Boolean)
              .join(" • ") || "Active bid",
          meta: "Active Bid",
          target: buildSearchTarget("/bid-list", { activeBidSearch: query }),
        })),
    ]).slice(0, limit);

    const jobItems = (jobsResult.data || [])
      .filter((item) => {
        const contractNumber = item.admin_data?.contractNumber || item.customer_contract_number;
        return (
          matchingJobIds.includes(item.id) ||
          [
            item.job_number,
            item.bid_number,
            contractNumber,
            item.contractor_name,
            item.project_status,
            item.admin_data?.location,
            item.admin_data?.county?.name,
          ].some((field) => includesQuery(field, normalizedQuery))
        );
      })
      .slice(0, limit)
      .map((item) => ({
        id: String(item.id),
        title: item.job_number || `Job ${item.id}`,
        subtitle:
          [
            item.admin_data?.contractNumber || item.customer_contract_number,
            item.contractor_name,
            item.admin_data?.county?.name,
          ]
            .filter(Boolean)
            .join(" • ") || "Active job",
        meta: item.project_status || undefined,
        target: buildSearchTarget("/jobs/active-jobs", { activeJobSearch: query }),
      }));

    const contractItems = (contractsResult.data || [])
      .filter((item) =>
        [
          item.contract_number,
          item.project_name,
          item.customer_name,
          item.etc_job_number,
          item.project_owner,
          item.county,
          item.contract_status,
          item.project_status,
        ].some((field) => includesQuery(field, normalizedQuery))
      )
      .slice(0, limit)
      .map((item) => ({
        id: String(item.id),
        title: item.contract_number || item.project_name || `Contract ${item.id}`,
        subtitle:
          [item.customer_name, item.project_name, item.etc_job_number, item.county]
            .filter(Boolean)
            .join(" • ") || "Contract pipeline item",
        meta: item.contract_status || item.project_status || undefined,
        target: buildSearchTarget("/l/contracts", { search: query }),
      }));

    const signOrderItems = (signOrdersResult.data || [])
      .filter((item) => {
        const customerName = customerNameMap.get(item.contractor_id);
        return (
          matchingCustomerIds.includes(item.contractor_id) ||
          [
            item.order_number,
            item.contract_number,
            item.job_number,
            item.requestor,
            customerName,
            item.status,
          ].some((field) => includesQuery(field, normalizedQuery))
        );
      })
      .slice(0, limit)
      .map((item) => ({
        id: String(item.id),
        title: item.order_number ? `Order ${item.order_number}` : `Sign Order ${item.id}`,
        subtitle:
          [
            customerNameMap.get(item.contractor_id) || null,
            item.contract_number,
            item.job_number,
            item.requestor,
          ]
            .filter(Boolean)
            .join(" • ") || "Sign order",
        meta: item.status || undefined,
        target: buildSearchTarget("/takeoffs/sign-shop-orders", { search: query }),
      }));

    const quoteItems = (quotesResult.data || [])
      .filter((item) => {
        return (
          matchingQuoteIds.includes(item.id) ||
          matchingEstimateIds.includes(item.estimate_id) ||
          matchingJobIds.includes(item.job_id) ||
          [
            item.quote_number,
            item.status,
            item.type_quote,
            item.customer_name,
            item.customer_contact,
            item.etc_job_number,
          ].some((field) => includesQuery(field, normalizedQuery))
        );
      })
      .slice(0, limit)
      .map((item) => ({
        id: String(item.id),
        title: item.quote_number ? `Quote ${item.quote_number}` : `Quote ${item.id}`,
        subtitle:
          [item.customer_name, item.customer_contact, item.etc_job_number]
            .filter(Boolean)
            .join(" • ") || "Quote",
        meta: item.status || item.type_quote || undefined,
        target: buildSearchTarget("/quotes", { search: query }),
      }));

    const customerItems = customers.slice(0, limit).map((item) => ({
      id: String(item.id),
      title: formatCustomerName(item),
      subtitle:
        [item.customer_number ? `#${item.customer_number}` : null, item.main_phone]
          .filter(Boolean)
          .join(" • ") || "Customer",
      target: buildSearchTarget("/customers", { search: query, selectedId: item.id }),
    }));

    const contactItems = contacts.slice(0, limit).map((item) => ({
      id: String(item.id),
      title: item.name || `Contact ${item.id}`,
      subtitle:
        [
          customerNameMap.get(item.contractor_id) || null,
          item.role,
          item.email,
          item.phone,
        ]
          .filter(Boolean)
          .join(" • ") || "Customer contact",
      target: buildSearchTarget("/customers", {
        search: query,
        selectedId: item.contractor_id,
        selectedContactId: item.id,
      }),
    }));

    const sections = [
      { key: "bid", label: "Bid", items: bidItems },
      { key: "job", label: "Job", items: jobItems },
      { key: "contract", label: "Contract", items: contractItems },
      { key: "sign-order", label: "Sign Order", items: signOrderItems },
      { key: "quote", label: "Quote", items: quoteItems },
      { key: "customer", label: "Customer", items: customerItems },
      { key: "contact", label: "Contact", items: contactItems },
    ] satisfies SearchSection[];

    const populatedSections: SearchSection[] = sections.filter((section) => section.items.length > 0);

    return NextResponse.json({ success: true, query, sections: populatedSections });
  } catch (error) {
    console.error("[global-search] Failed to search", error);
    return NextResponse.json(
      { success: false, error: "Failed to search" },
      { status: 500 }
    );
  }
}
