"use client"

import { useState } from "react"
import { ChevronLeft, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ViewQuotesProps {
  onBack: () => void
}

interface Quote {
  id: string
  quote_number: string
  type_quote: string
  status: string
  customer_name: string
  date_sent: string
  created_at: string
}

// Mock data
const mockQuotes: Quote[] = [
  { id: "1", quote_number: "Q-001", type_quote: "straight_sale", status: "SENT", customer_name: "Acme Corp", date_sent: "2025-02-20", created_at: "2025-02-20" },
  { id: "2", quote_number: "Q-002", type_quote: "to_project", status: "ACCEPTED", customer_name: "Tech Solutions Inc", date_sent: "2025-02-19", created_at: "2025-02-19" },
  { id: "3", quote_number: "Q-003", type_quote: "estimate_bid", status: "DRAFT", customer_name: "BuildPro Ltd", date_sent: "2025-02-18", created_at: "2025-02-18" },
  { id: "4", quote_number: "Q-004", type_quote: "straight_sale", status: "SENT", customer_name: "Urban Designs", date_sent: "2025-02-17", created_at: "2025-02-17" },
  { id: "5", quote_number: "Q-005", type_quote: "to_project", status: "REJECTED", customer_name: "Coast Builders", date_sent: "2025-02-16", created_at: "2025-02-16" },
]

export default function ViewQuotes({ onBack }: ViewQuotesProps) {
  const [quotes] = useState<Quote[]>(mockQuotes)
  const [isLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredQuotes = quotes.filter((quote) =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800"
      case "SENT":
        return "bg-blue-100 text-blue-800"
      case "ACCEPTED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getQuoteTypeLabel = (type: string) => {
    switch (type) {
      case "straight_sale":
        return "Straight Sale"
      case "to_project":
        return "To Project"
      case "estimate_bid":
        return "Estimate/Bid"
      default:
        return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">View Quotes</h1>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-4 bg-accent border-b border-accent-highlight sticky top-16 z-5">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by quote number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-4 text-center">
            <Card className="p-8 bg-muted/50">
              <p className="text-muted-foreground mb-2">
                {quotes.length === 0 ? "No quotes found" : "No matching quotes"}
              </p>
              <p className="text-xs text-muted-foreground">
                {quotes.length === 0 ? "Create a new quote to get started" : "Try adjusting your search"}
              </p>
            </Card>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="font-semibold text-muted-foreground px-4 py-3">Quote #</TableHead>
                  <TableHead className="font-semibold text-muted-foreground px-4 py-3">Customer</TableHead>
                  <TableHead className="font-semibold text-muted-foreground px-4 py-3">Type</TableHead>
                  <TableHead className="font-semibold text-muted-foreground px-4 py-3">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <TableCell className="font-mono font-medium text-primary px-4 py-3">
                      {quote.quote_number}
                    </TableCell>
                    <TableCell className="text-foreground px-4 py-3">
                      {quote.customer_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground px-4 py-3">
                      {getQuoteTypeLabel(quote.type_quote)}
                    </TableCell>
                    <TableCell className="text-muted-foreground px-4 py-3">
                      {formatDate(quote.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  )
}
