import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type GlobalSearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

const SEARCH_LIMIT = 5;

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({
        success: true,
        query,
        groups: {
          customers: [],
          quotes: [],
          signShopOrders: [],
          bidEstimates: [],
          bidBoard: [],
        },
      });
    }

    const sanitized = query.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    const pattern = `%${sanitized}%`;

    const { data: customerRows, error: customersError } = await supabase
      .from("contractors")
      .select("id, name, display_name")
      .or(`display_name.ilike.${pattern},name.ilike.${pattern}`)
      .order("display_name", { ascending: true })
      .limit(SEARCH_LIMIT);

    if (customersError) {
      throw customersError;
    }

    const customerIds = (customerRows || []).map((customer) => customer.id);
    const contractorNameById = Object.fromEntries(
      (customerRows || []).map((customer) => [
        customer.id,
        customer.display_name || customer.name || `Customer ${customer.id}`,
      ])
    );

    const { data: quoteRows, error: quotesError } = await supabase
      .from("quotes")
      .select("id, quote_number, customer_name, customer_contact, type_quote, created_by_name, updated_at")
      .or(
        [
          `quote_number.ilike.${pattern}`,
          `customer_name.ilike.${pattern}`,
          `customer_contact.ilike.${pattern}`,
          `type_quote.ilike.${pattern}`,
          `created_by_name.ilike.${pattern}`,
        ].join(",")
      )
      .order("updated_at", { ascending: false })
      .limit(SEARCH_LIMIT);

    if (quotesError) {
      throw quotesError;
    }

    const { data: signOrderTextRows, error: signOrdersTextError } = await supabase
      .from("sign_orders")
      .select("id, order_number, contract_number, job_number, contractor_id, requestor, shop_status, created_at")
      .in("order_status", ["SUBMITTED", "DRAFT"])
      .or(
        [
          `order_number.ilike.${pattern}`,
          `contract_number.ilike.${pattern}`,
          `job_number.ilike.${pattern}`,
          `requestor.ilike.${pattern}`,
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(SEARCH_LIMIT);

    if (signOrdersTextError) {
      throw signOrdersTextError;
    }

    let signOrderCustomerRows: any[] = [];
    if (customerIds.length > 0) {
      const { data, error } = await supabase
        .from("sign_orders")
        .select("id, order_number, contract_number, job_number, contractor_id, requestor, shop_status, created_at")
        .in("order_status", ["SUBMITTED", "DRAFT"])
        .in("contractor_id", customerIds)
        .order("created_at", { ascending: false })
        .limit(SEARCH_LIMIT);

      if (error) {
        throw error;
      }

      signOrderCustomerRows = data || [];
    }

    const signShopOrdersMap = new Map<number, any>();
    [...(signOrderTextRows || []), ...signOrderCustomerRows].forEach((row) => {
      signShopOrdersMap.set(row.id, row);
    });

    const { data: bidRows, error: bidsError } = await supabase
      .from("estimate_complete")
      .select(`
        id,
        status,
        contractor_name,
        created_at,
        archived,
        deleted,
        admin_data->>contractNumber as contract_number,
        admin_data->>owner as owner,
        admin_data->>estimator as estimator
      `)
      .eq("deleted", false)
      .or(
        [
          `contractor_name.ilike.${pattern}`,
          `admin_data->>contractNumber.ilike.${pattern}`,
          `admin_data->>owner.ilike.${pattern}`,
          `admin_data->>estimator.ilike.${pattern}`,
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(SEARCH_LIMIT);

    if (bidsError) {
      throw bidsError;
    }

    const { data: bidBoardRows, error: bidBoardError } = await supabase
      .from("available_jobs")
      .select("id, contract_number, owner, county, requestor, status, created_at, archived")
      .or(
        [
          `contract_number.ilike.${pattern}`,
          `owner.ilike.${pattern}`,
          `county.ilike.${pattern}`,
          `requestor.ilike.${pattern}`,
          `status.ilike.${pattern}`,
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(SEARCH_LIMIT);

    if (bidBoardError) {
      throw bidBoardError;
    }

    const customers: GlobalSearchResult[] = (customerRows || []).map((customer) => {
      const displayName = customer.display_name || customer.name || `Customer ${customer.id}`;
      return {
        id: `customer-${customer.id}`,
        title: displayName,
        subtitle: "Customer",
        href: `/customers?search=${encodeURIComponent(displayName)}&customerId=${customer.id}`,
      };
    });

    const quotes: GlobalSearchResult[] = (quoteRows || []).map((quote) => {
      const queryValue = quote.quote_number || quote.customer_name || "";
      return {
        id: `quote-${quote.id}`,
        title: quote.quote_number || `Quote ${quote.id}`,
        subtitle: [quote.customer_name, quote.customer_contact, quote.type_quote].filter(Boolean).join(" • "),
        href: `/quotes?search=${encodeURIComponent(queryValue)}`,
      };
    });

    const signShopOrders: GlobalSearchResult[] = Array.from(signShopOrdersMap.values())
      .slice(0, SEARCH_LIMIT)
      .map((order) => {
        const customerName =
          contractorNameById[order.contractor_id] || `Customer ${order.contractor_id ?? "-"}`;
        const queryValue =
          order.contract_number || order.order_number || order.job_number || customerName;
        return {
          id: `sign-order-${order.id}`,
          title: order.order_number || `Sign Order ${order.id}`,
          subtitle: [customerName, order.contract_number, order.job_number].filter(Boolean).join(" • "),
          href: `/takeoffs/sign-shop-orders?search=${encodeURIComponent(queryValue)}`,
        };
      });

    const bidEstimates: GlobalSearchResult[] = (bidRows || []).map((bid: any) => {
      const queryValue = bid.contract_number || bid.contractor_name || bid.owner || "";
      return {
        id: `bid-${bid.id}`,
        title: bid.contract_number || `Bid ${bid.id}`,
        subtitle: [bid.contractor_name, bid.owner, bid.status].filter(Boolean).join(" • "),
        href: `/jobs/active-bids?search=${encodeURIComponent(queryValue)}`,
      };
    });

    const bidBoard: GlobalSearchResult[] = (bidBoardRows || []).map((row: any) => {
      const queryValue = row.contract_number || row.owner || row.requestor || row.county || "";
      return {
        id: `bid-board-${row.id}`,
        title: row.contract_number || `Bid Board ${row.id}`,
        subtitle: [row.owner, row.county, row.requestor, row.status].filter(Boolean).join(" • "),
        href: `/jobs/available?search=${encodeURIComponent(queryValue)}`,
      };
    });

    return NextResponse.json({
      success: true,
      query,
      groups: {
        customers,
        quotes,
        signShopOrders,
        bidEstimates,
        bidBoard,
      },
    });
  } catch (error) {
    console.error("Error in global search:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to run global search",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
