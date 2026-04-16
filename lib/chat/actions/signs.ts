// Signs catalog action implementations for chat tools

import { ActionResult, RecordSummary } from "../types";
import { supabase } from "@/lib/supabase";

const DEFAULT_PAGE_SIZE = 20;

type SignSearchInput = {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};

export async function searchSigns(params: SignSearchInput): Promise<ActionResult> {
  console.info("[chat/actions/signs] searchSigns called", {
    params,
    timestamp: new Date().toISOString(),
  });

  try {
    let query = supabase
      .from("signs_all")
      .select("id, designation, description, category, sizes, sheeting, created_at", { count: "exact" });

    // Apply category filter
    if (params.category?.trim()) {
      query = query.ilike("category", params.category.trim());
    }

    // Apply search filter
    if (params.search?.trim()) {
      const search = params.search.trim();
      query = query.or(
        `designation.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
    const start = (page - 1) * pageSize;

    query = query.range(start, start + pageSize - 1).order("designation", { ascending: true });

    const { data, error, count } = await query;

    console.info("[chat/actions/signs] searchSigns query completed", {
      error,
      count,
      resultCount: data?.length || 0,
      params,
    });

    if (error) throw error;

    const items: RecordSummary[] = (data || []).map((sign) => ({
      id: String(sign.id),
      label: String(sign.designation || `Sign ${sign.id}`),
      secondary: sign.description || undefined,
      status: sign.category || undefined,
    }));

    console.info("[chat/actions/signs] returning items", {
      itemCount: items.length,
      total: count || 0,
    });

    return {
      success: true,
      entityType: "sign",
      operation: "search",
      capabilityStatus: "read_only",
      summary: `Found ${count ?? items.length} signs`,
      data: { items, total: count ?? items.length, page, pageSize },
    };
  } catch (error) {
    console.error("[chat/actions/signs] searchSigns failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      params,
    });

    return {
      success: false,
      entityType: "sign",
      operation: "search",
      capabilityStatus: "read_only",
      summary: "Failed to search signs",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getSign(id: string): Promise<ActionResult> {
  console.info("[chat/actions/signs] getSign called", { id });

  try {
    const { data, error } = await supabase
      .from("signs_all")
      .select("*")
      .eq("id", Number(id))
      .single();

    console.info("[chat/actions/signs] getSign query completed", { id, error, found: !!data });

    if (error) throw error;

    return {
      success: true,
      entityType: "sign",
      operation: "get",
      capabilityStatus: "read_only",
      recordId: String(data.id),
      summary: `Sign: ${data.designation || data.id}`,
      data: {
        id: data.id,
        designation: data.designation,
        description: data.description,
        category: data.category,
        sizes: data.sizes,
        sheeting: data.sheeting,
        kits: data.kits,
        imageUrl: data.image_url,
      },
    };
  } catch (error) {
    console.error("[chat/actions/signs] getSign failed", {
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      entityType: "sign",
      operation: "get",
      capabilityStatus: "read_only",
      summary: "Failed to get sign",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}