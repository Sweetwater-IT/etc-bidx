import { supabase } from './supabase';
import { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];

/**
 * Get all available jobs with optional filters
 */
export async function getAvailableJobs(options?: {
  status?: 'Bid' | 'No Bid' | 'Unset';
  limit?: number;
  orderBy?: {
    column: keyof Tables['available_jobs']['Row'];
    ascending?: boolean;
  };
}) {
  let query = supabase.from('available_jobs').select('*');

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? false,
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching available jobs:', error);
    throw error;
  }

  return data;
}

/**
 * Get a single available job by ID
 */
export async function getAvailableJobById(id: number) {
  const { data, error } = await supabase
    .from('available_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching job with ID ${id}:`, error);
    throw error;
  }

  return data;
}

/**
 * Create a new available job
 */
export async function createAvailableJob(
  job: Tables['available_jobs']['Insert']
) {
  const { data, error } = await supabase
    .from('available_jobs')
    .insert(job)
    .select();

  if (error) {
    console.error('Error creating available job:', error);
    throw error;
  }

  return data[0];
}

/**
 * Update an existing available job
 */
export async function updateAvailableJob(
  id: number,
  updates: Tables['available_jobs']['Update']
) {
  const { data, error } = await supabase
    .from('available_jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();

  if (error) {
    console.error(`Error updating job with ID ${id}:`, error);
    throw error;
  }

  return data[0];
}

/**
 * Archive an available job
 */
export async function archiveJob(id: number) {
  // First, get the job to archive
  const job = await getAvailableJobById(id);
  
  if (!job) {
    throw new Error(`Job with ID ${id} not found`);
  }
  
  // Begin a transaction
  const { error: archiveError } = await supabase.rpc('archive_job', { job_id: id });
  
  if (archiveError) {
    console.error(`Error archiving job with ID ${id}:`, archiveError);
    throw archiveError;
  }
  
  return true;
}

/**
 * Get archived jobs with optional filters
 */
export async function getArchivedJobs(options?: {
  limit?: number;
  orderBy?: {
    column: keyof Tables['archived_available_jobs']['Row'];
    ascending?: boolean;
  };
}) {
  let query = supabase.from('archived_available_jobs').select('*');

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? false,
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching archived jobs:', error);
    throw error;
  }

  return data;
}
