export type JobType = 'available' | 'active-bids' | 'active-jobs';

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

export const jobsData: Record<JobType, JobData[]> = {
  'available': [
    {
      id: 'job-001',
      title: 'Software Engineer - Cloud Infrastructure',
      company: 'TechCorp',
      location: 'Remote',
      type: 'Full-time',
      status: 'Open',
      budget: 120000,
      deadline: '2024-04-30',
      description: 'Looking for a senior engineer to lead cloud infrastructure projects',
      requirements: ['5+ years experience', 'AWS certification', 'Terraform expertise'],
      skills: ['AWS', 'Terraform', 'Kubernetes', 'Docker']
    },
    {
      id: 'job-002',
      title: 'Frontend Developer',
      company: 'DesignHub',
      location: 'San Francisco',
      type: 'Contract',
      status: 'Urgent',
      budget: 95000,
      deadline: '2024-04-15',
      description: 'Seeking a frontend developer for a design system project',
      requirements: ['3+ years experience', 'React expertise', 'UI/UX knowledge'],
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Figma']
    }
  ],
  'active-bids': [
    {
      id: 'bid-001',
      title: 'DevOps Engineer',
      company: 'CloudScale',
      location: 'New York',
      type: 'Full-time',
      status: 'Under Review',
      budget: 140000,
      deadline: '2024-04-20',
      description: 'DevOps position for scaling cloud infrastructure',
      requirements: ['4+ years experience', 'CI/CD expertise', 'Cloud platforms'],
      skills: ['Jenkins', 'GitLab', 'AWS', 'Docker']
    },
    {
      id: 'bid-002',
      title: 'Backend Developer',
      company: 'DataFlow',
      location: 'Remote',
      type: 'Contract',
      status: 'Bid Submitted',
      budget: 110000,
      deadline: '2024-04-25',
      description: 'Backend role for data processing platform',
      requirements: ['3+ years experience', 'Python expertise', 'API design'],
      skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis']
    }
  ],
  'active-jobs': [
    {
      id: 'active-001',
      title: 'Full Stack Developer',
      company: 'WebTech',
      location: 'Austin',
      type: 'Full-time',
      status: 'In Progress',
      budget: 130000,
      deadline: '2024-05-15',
      description: 'Full stack role for e-commerce platform',
      requirements: ['4+ years experience', 'Full stack expertise', 'E-commerce'],
      skills: ['React', 'Node.js', 'MongoDB', 'Redis']
    },
    {
      id: 'active-002',
      title: 'Mobile Developer',
      company: 'AppWorks',
      location: 'Remote',
      type: 'Contract',
      status: 'Started',
      budget: 100000,
      deadline: '2024-05-01',
      description: 'Mobile app development for fitness platform',
      requirements: ['3+ years experience', 'React Native', 'Mobile design'],
      skills: ['React Native', 'TypeScript', 'Firebase', 'Redux']
    }
  ]
}; 