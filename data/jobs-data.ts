export type JobType = "available" | "active-bids" | "active-jobs" | "job-list";

export interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  status: string;
  budget: number;
  deadline: string;
  description: string;
  requirements: string[];
  skills: string[];
}