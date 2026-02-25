"use client"

import { useState, useEffect } from "react"
import { Plus, Eye, Edit3, Menu, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import CreateQuote from "../components/create-quote"
import ViewQuotes from "../components/view-quote"
import EditQuote from "../components/edit-quote"

interface Quote {
  id: number
  quote_number: string
  customer_name: string
  status: string
  created_at: string
  total_items?: number
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "create" | "view" | "edit">("home")
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch quotes on component mount
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/quotes?limit=10&page=1')
        const result = await response.json()

        if (result.success) {
          setQuotes(result.data)
        } else {
          setError(result.message || 'Failed to fetch quotes')
        }
      } catch (err) {
        setError('Network error')
        console.error('Failed to fetch quotes:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuotes()
  }, [])

  // Calculate stats
  const totalQuotes = quotes.length

  // Get recent quotes (last 3)
  const recentQuotes = quotes.slice(0, 3)

  if (activeTab === "create") {
    return (
      <CreateQuote onBack={() => setActiveTab("home")} />
    )
  }

  if (activeTab === "view") {
    return (
      <ViewQuotes onBack={() => setActiveTab("home")} />
    )
  }

  if (activeTab === "edit") {
    return (
      <EditQuote onBack={() => setActiveTab("home")} />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold">Quote Manager</h1>
            <p className="text-sm opacity-90">Manage your quotes</p>
          </div>
          <Button variant="ghost" size="icon" className="text-primary-foreground">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <div className="bg-accent border-b border-border p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Project Quotes</p>
            <h2 className="text-lg font-bold text-balance">Manage all your quotes</h2>
            <p className="text-sm text-muted-foreground mt-1">Create, view, and edit quotes</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-muted rounded-lg p-4 text-center inline-block w-full">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Total Quotes</p>
          <p className="text-4xl font-bold text-primary">{totalQuotes}</p>
        </div>
      </div>

      {/* Main Navigation */}
      <main className="p-4 pb-20 space-y-4">
        <Card
          className="p-6 bg-accent border border-border cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => setActiveTab("create")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Create New Quote</h2>
                <p className="text-sm text-muted-foreground">Start a new quote</p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </div>
        </Card>

        <Card
          className="p-6 bg-accent border border-border cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => setActiveTab("view")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Eye className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">View Quotes</h2>
                <p className="text-sm text-muted-foreground">Browse existing quotes</p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </div>
        </Card>

        <Card
          className="p-6 bg-accent border border-border cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => setActiveTab("edit")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Edit3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Edit Existing Quote</h2>
                <p className="text-sm text-muted-foreground">Modify a saved quote</p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </div>
        </Card>

        {/* Recent Quotes Table */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Recent Quotes</h3>
          <Card className="overflow-hidden bg-card border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Quote #</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map((quote) => (
                    <tr key={quote.id} className="border-b border-border hover:bg-muted transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-primary whitespace-nowrap">{quote.quote_number}</td>
                      <td className="px-4 py-3 text-foreground">{quote.customer_name}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{quote.total_items || 0} items</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(quote.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Button variant="outline" className="w-full mt-4">View All Quotes</Button>
        </div>
      </main>
    </div>
  )
}
