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
  totalCount: number;
  seeAllTarget: string;
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

function matchesCustomerName(names: string[], ...fields: unknown[]) {
  if (names.length === 0) return false;
  return fields.some((field) => {
    const normalizedField = String(field || "").toLowerCase();
    return names.some((name) => normalizedField.includes(name));
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
    const matchingCustomerNames = customers
      .map((customer) => formatCustomerName(customer).toLowerCase())
      .filter(Boolean);

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

    const allBidItems = dedupeById([
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
        .map((item) => {
          const contractNumber = String(item.admin_data?.contractNumber || "");
          const matchedByCustomer = matchesCustomerName(
            matchingCustomerNames,
            item.contractor_name,
            item.subcontractor_name
          );
          const matchedByContractNumber = includesQuery(contractNumber, normalizedQuery);

          return {
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
            target:
              matchedByCustomer && !matchedByContractNumber
                ? buildSearchTarget("/bid-list", { activeBidSearch: query })
                : buildSearchTarget("/active-bid/view", {
                    bidId: item.id,
                    tuckSidebar: "true",
                    fullscreen: "true",
                    defaultEditable: "false",
                  }),
          };
        }),
    ]);

    const allJobItems = (jobsResult.data || [])
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
      .map((item) => {
        const matchedByCustomer = matchesCustomerName(matchingCustomerNames, item.contractor_name);
        const matchedByContractNumber = includesQuery(
          item.admin_data?.contractNumber || item.customer_contract_number,
          normalizedQuery
        );

        return {
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
          target:
            matchedByCustomer && !matchedByContractNumber
              ? buildSearchTarget("/jobs/active-jobs", { activeJobSearch: query })
              : `/jobs/${item.id}`,
        };
      });

    const allContractItems = (contractsResult.data || [])
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
      .map((item) => {
        const matchedByCustomer = matchesCustomerName(matchingCustomerNames, item.customer_name);
        const matchedByContractNumber = includesQuery(item.contract_number, normalizedQuery);

        return {
          id: String(item.id),
          title: item.contract_number || item.project_name || `Contract ${item.id}`,
          subtitle:
            [item.customer_name, item.project_name, item.etc_job_number, item.county]
              .filter(Boolean)
              .join(" • ") || "Contract pipeline item",
          meta: item.contract_status || item.project_status || undefined,
          target:
            matchedByCustomer && !matchedByContractNumber
              ? buildSearchTarget("/l/contracts", { search: query })
              : `/l/contracts/view/${item.id}`,
        };
      }));

    const allSignOrderItems = (signOrdersResult.data || [])
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
      .map((item) => {
        const customerName = customerNameMap.get(item.contractor_id) || null;
        const matchedByCustomer = matchesCustomerName(matchingCustomerNames, customerName);
        const matchedByOrderNumber =
          includesQuery(item.order_number, normalizedQuery) ||
          includesQuery(item.contract_number, normalizedQuery) ||
          includesQuery(item.job_number, normalizedQuery);

        return {
          id: String(item.id),
          title: item.order_number ? `Order ${item.order_number}` : `Sign Order ${item.id}`,
          subtitle:
            [
              customerName,
              item.contract_number,
              item.job_number,
              item.requestor,
            ]
              .filter(Boolean)
              .join(" • ") || "Sign order",
          meta: item.status || undefined,
          target:
            matchedByCustomer && !matchedByOrderNumber
              ? buildSearchTarget("/takeoffs/sign-shop-orders", { search: query })
              : `/takeoffs/sign-order/view/${item.id}`,
        };
      }));

    const allQuoteItems = (quotesResult.data || [])
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
      .map((item) => {
        const matchedByCustomer = matchesCustomerName(
          matchingCustomerNames,
          item.customer_name,
          item.customer_contact
        );
        const matchedByQuoteNumber =
          includesQuery(item.quote_number, normalizedQuery) ||
          includesQuery(item.etc_job_number, normalizedQuery);

        return {
          id: String(item.id),
          title: item.quote_number ? `Quote ${item.quote_number}` : `Quote ${item.id}`,
          subtitle:
            [item.customer_name, item.customer_contact, item.etc_job_number]
              .filter(Boolean)
              .join(" • ") || "Quote",
          meta: item.status || item.type_quote || undefined,
          target:
            matchedByCustomer && !matchedByQuoteNumber
              ? buildSearchTarget("/quotes", { search: query })
              : `/quotes/view/${item.id}`,
        };
      }));

    const allCustomerItems = customers.map((item) => ({
      id: String(item.id),
      title: formatCustomerName(item),
      subtitle:
        [item.customer_number ? `#${item.customer_number}` : null, item.main_phone]
          .filter(Boolean)
          .join(" • ") || "Customer",
      target: buildSearchTarget("/customers", { search: query, selectedId: item.id }),
    }));

    const allContactItems = contacts.map((item) => ({
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
      {
        key: "bid",
        label: "Bid",
        items: allBidItems.slice(0, limit),
        totalCount: allBidItems.length,
        seeAllTarget: buildSearchTarget("/bid-list", { activeBidSearch: query }),
      },
      {
        key: "job",
        label: "Job",
        items: allJobItems.slice(0, limit),
        totalCount: allJobItems.length,
        seeAllTarget: buildSearchTarget("/jobs/active-jobs", { activeJobSearch: query }),
      },
      {
        key: "contract",
        label: "Contract",
        items: allContractItems.slice(0, limit),
        totalCount: allContractItems.length,
        seeAllTarget: buildSearchTarget("/l/contracts", { search: query }),
      },
      {
        key: "sign-order",
        label: "Sign Order",
        items: allSignOrderItems.slice(0, limit),
        totalCount: allSignOrderItems.length,
        seeAllTarget: buildSearchTarget("/takeoffs/sign-shop-orders", { search: query }),
      },
      {
        key: "quote",
        label: "Quote",
        items: allQuoteItems.slice(0, limit),
        totalCount: allQuoteItems.length,
        seeAllTarget: buildSearchTarget("/quotes", { search: query }),
      },
      {
        key: "customer",
        label: "Customer",
        items: allCustomerItems.slice(0, limit),
        totalCount: allCustomerItems.length,
        seeAllTarget: buildSearchTarget("/customers", { search: query }),
      },
      {
        key: "contact",
        label: "Contact",
        items: allContactItems.slice(0, limit),
        totalCount: allContactItems.length,
        seeAllTarget: buildSearchTarget("/customers", { search: query }),
      },
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
