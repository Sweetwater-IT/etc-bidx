import { JobType } from "./jobs-data";

export interface CardData {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  description?: string;
  subtitle?: string;
}

const baseCards: Record<JobType, CardData[]> = {
  'available': [
    {
      title: "Total Available",
      value: "24",
      change: 12,
      trend: "up",
      description: "New jobs this week"
    },
    {
      title: "Average Budget",
      value: "$115,000",
      change: 5,
      trend: "up",
      description: "Average budget for available jobs"
    },
    {
      title: "Remote Jobs",
      value: "65%",
      change: 8,
      trend: "up",
      description: "Percentage of jobs that are remote"
    },
    {
      title: "Response Rate",
      value: "89%",
      change: -2,
      trend: "down",
      description: "Response rate to job postings"
    }
  ],
  'active-bids': [
    {
      title: "Active Bids",
      value: "18",
      change: 4,
      trend: "up",
      description: "Bids currently being evaluated"
    },
    {
      title: "Success Rate",
      value: "72%",
      change: 15,
      trend: "up",
      description: "Percentage of successful bids"
    },
    {
      title: "Average Bid",
      value: "$125,000",
      change: 3,
      trend: "up",
      description: "Average value of active bids"
    },
    {
      title: "Response Time",
      value: "2.4 days",
      change: -1,
      trend: "down",
      description: "Average time to respond to bids"
    }
  ],
  'active-jobs': [
    {
      title: "Current Jobs",
      value: "12",
      change: 2,
      trend: "up",
      description: "Jobs currently in progress"
    },
    {
      title: "Completion Rate",
      value: "94%",
      change: 5,
      trend: "up",
      description: "Percentage of jobs completed on time"
    },
    {
      title: "Total Value",
      value: "$1.2M",
      change: 8,
      trend: "up",
      description: "Total value of active jobs"
    },
    {
      title: "Client Rating",
      value: "4.8/5",
      change: 0,
      trend: "neutral",
      description: "Average client satisfaction rating"
    }
  ],
  'job-list': [
    {
      title: "Total Jobs",
      value: "36",
      change: 15,
      trend: "up",
      description: "Jobs in the system"
    },
    {
      title: "Average Salary",
      value: "$107,500",
      change: 8,
      trend: "up",
      description: "Average job budget"
    },
    {
      title: "Remote Positions",
      value: "45%",
      change: 12,
      trend: "up",
      description: "Jobs with remote work"
    },
    {
      title: "Urgent Positions",
      value: "5",
      change: -2,
      trend: "down",
      description: "Jobs marked as urgent"
    }
  ]
};

export function getJobCards(type: JobType): CardData[] {
  return baseCards[type];
} 