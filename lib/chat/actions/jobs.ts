// Jobs action implementations for chat tools

import { ActionResult, RecordSummary } from "../types";
import { supabase } from "@/lib/supabase";

const DEFAULT_PAGE_SIZE = 20;

export async function searchJobs(
  params: { search?: string; customerId?: string; status?: string; page?: number; pageSize?: number }
): Promise<ActionResult> {
  try {
    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" });

    if (params.search) {
      query = query.or(`job_number.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }
    if (params.customerId) {
      query = query.eq("customer_id", params.customerId);
    }
    if (params.status) {
      query = query.eq("status", params.status);
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
    const start = (page - 1) * pageSize;

    query = query.range(start, start + pageSize - 1).order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    const items: RecordSummary[] = (data || []).map((job) => ({
      id: job.id,
      label: job.job_number || `Job ${job.id}`,
      secondary: job.description || undefined,
      status: job.status,
    }));

    return {
      success: true,
      entityType: "job",
      operation: "search",
      summary: `Found ${count || 0} jobs`,
      data: { items, total: count || 0, page, pageSize },
    };
  } catch (err) {
    return {
      success: false,
      entityType: "job",
      operation: "search",
      summary: "Failed to search jobs",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getJob(id: string): Promise<ActionResult> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Job not found");

    return {
      success: true,
      entityType: "job",
      operation: "get",
      recordId: id,
      summary: `Job: ${data.job_number || data.id}`,
      data,
    };
  } catch (err) {
    return {
      success: false,
      entityType: "job",
      operation: "get",
      summary: "Failed to get job",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function createJob(
  input: { jobNumber?: string; customerId?: string; description?: string; startDate?: string; endDate?: string; status?: string }
): Promise<ActionResult> {
  try {
    const insertData = {
      job_number: input.jobNumber || null,
      customer_id: input.customerId || null,
      description: input.description || "",
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      status: input.status || "active",
    };

    const { data, error } = await supabase
      .from("jobs")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "job",
      operation: "create",
      recordId: data.id,
      summary: `Created job: ${data.job_number || data.id}`,
      data: { id: data.id, job_number: data.job_number },
    };
  } catch (err) {
    return {
      success: false,
      entityType: "job",
      operation: "create",
      summary: "Failed to create job",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function updateJob(
  id: string,
  input: { jobNumber?: string; customerId?: string; description?: string; startDate?: string; endDate?: string; status?: string }
): Promise<ActionResult> {
  try {
    const updateData: Record<string, unknown> = {};
    if (input.jobNumber !== undefined) updateData.job_number = input.jobNumber;
    if (input.customerId !== undefined) updateData.customer_id = input.customerId;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.startDate !== undefined) updateData.start_date = input.startDate;
    if (input.endDate !== undefined) updateData.end_date = input.endDate;
    if (input.status !== undefined) updateData.status = input.status;

    const { data, error } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      entityType: "job",
      operation: "update",
      recordId: id,
      summary: `Updated job: ${data.job_number || id}`,
      data: { id: data.id },
    };
  } catch (err) {
    return {
      success: false,
      entityType: "job",
      operation: "update",
      summary: "Failed to update job",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}