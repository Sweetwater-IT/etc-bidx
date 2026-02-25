"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Search, Loader2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface EditQuoteProps {
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

export default function EditQuote({ onBack }: EditQuoteProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isEditingQuote, setIsEditingQuote] = useState(false)

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/quotes?status=DRAFT,NOT_SENT")
        const data = await response.json()
        if (data.success) {
          setQuotes(data.data || [])
        }
      } catch (error) {
        console.error("Error fetching quotes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuotes()
  }, [])

  const filteredQuotes = quotes.filter((quote) =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditQuote = (quote: Quote) => {
    setSelectedQuote(quote)
    setIsEditingQuote(true)
    // In a real implementation, you would navigate to an edit form
    // For now, this shows the quote selection interface
  }

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

  if (isEditingQuote && selectedQuote) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsEditingQuote(false)
                setSelectedQuote(null)
              }}
              className="text-primary-foreground"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Edit Quote</h1>
              <p className="text-sm opacity-90">Quote #{selectedQuote.quote_number}</p>
            </div>
          </div>
        </header>

        {/* Edit Form Content */}
        <main className="p-4 pb-20">
          <Card className="p-4 bg-accent border-accent-highlight mb-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Quote Number</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedQuote.quote_number}</p>
              </div>
              <div>
                <label className="text-sm font-semibold">Customer</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedQuote.customer_name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold">Type</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {getQuoteTypeLabel(selectedQuote.type_quote)}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold">Status</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedQuote.status}</p>
              </div>
            </div>
          </Card>

          <p className="text-sm text-muted-foreground text-center py-8">
            Full quote editing interface would integrate with the quote form content
          </p>

          <div className="flex gap-3 sticky bottom-0 p-4 bg-background border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditingQuote(false)
                setSelectedQuote(null)
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button className="flex-1">
              <Edit2 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </main>
      </div>
    )
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
            <h1 className="text-xl font-bold">Edit Existing Quote</h1>
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
      <main className="p-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <Card className="p-8 text-center bg-muted/50">
            <p className="text-muted-foreground mb-2">
              No quotes available for editing
            </p>
            <p className="text-xs text-muted-foreground">
              Only draft and unsent quotes can be edited
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.map((quote) => (
              <Card
                key={quote.id}
                className="p-4 bg-accent border-accent-highlight cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleEditQuote(quote)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-balance">
                        Quote #{quote.quote_number}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {quote.customer_name}
                      </p>
                    </div>
                    <Badge className={getStatusColor(quote.status)}>
                      {quote.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{getQuoteTypeLabel(quote.type_quote)}</span>
                    <span>{formatDate(quote.created_at)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
