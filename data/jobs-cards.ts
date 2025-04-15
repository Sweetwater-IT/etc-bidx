interface CardData {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  description: string
  subtitle: string
}

export const jobsCards: CardData[] = [
  {
    title: "Total Revenue",
    value: "$1,250.00",
    change: "+12.5%",
    trend: "up",
    description: "Trending up this month",
    subtitle: "Visitors for the last 6 months"
  },
  {
    title: "New Customers",
    value: "1,234",
    change: "-20%",
    trend: "down",
    description: "Down 20% this period",
    subtitle: "Acquisition needs attention"
  },
  {
    title: "Active Accounts",
    value: "45,678",
    change: "+12.5%",
    trend: "up",
    description: "Strong user retention",
    subtitle: "Engagement exceed targets"
  },
  {
    title: "Growth Rate",
    value: "4.5%",
    change: "+4.5%",
    trend: "up",
    description: "Steady performance",
    subtitle: "Meets growth projections"
  }
] 