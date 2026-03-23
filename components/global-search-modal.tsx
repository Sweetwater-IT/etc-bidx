"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type GlobalSearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

type GlobalSearchResponse = {
  success: boolean;
  groups: {
    customers: GlobalSearchResult[];
    quotes: GlobalSearchResult[];
    signShopOrders: GlobalSearchResult[];
    bidEstimates: GlobalSearchResult[];
    bidBoard: GlobalSearchResult[];
  };
};

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

const EMPTY_GROUPS = {
  customers: [] as GlobalSearchResult[],
  quotes: [] as GlobalSearchResult[],
  signShopOrders: [] as GlobalSearchResult[],
  bidEstimates: [] as GlobalSearchResult[],
  bidBoard: [] as GlobalSearchResult[],
};

export function GlobalSearchModal({
  open,
  onOpenChange,
  initialQuery = "",
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [groups, setGroups] = useState<GlobalSearchResponse["groups"]>(EMPTY_GROUPS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setDebouncedQuery(initialQuery);
  }, [initialQuery, open]);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;

    if (!debouncedQuery) {
      setGroups(EMPTY_GROUPS);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const runSearch = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/global-search?q=${encodeURIComponent(debouncedQuery)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data: GlobalSearchResponse = await response.json();
        if (!active) return;
        if (data.success) {
          setGroups(data.groups);
        } else {
          setGroups(EMPTY_GROUPS);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Global search failed:", error);
        if (active) setGroups(EMPTY_GROUPS);
      } finally {
        if (active) setLoading(false);
      }
    };

    runSearch();

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedQuery, open]);

  const sections = useMemo(
    () => [
      { key: "customers", label: "Customers", results: groups.customers },
      { key: "quotes", label: "Quotes", results: groups.quotes },
      { key: "signShopOrders", label: "Sign Shop Orders", results: groups.signShopOrders },
      { key: "bidEstimates", label: "Bid Estimates", results: groups.bidEstimates },
      { key: "bidBoard", label: "Bid Board", results: groups.bidBoard },
    ],
    [groups]
  );

  const hasResults = sections.some((section) => section.results.length > 0);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Global Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers, quotes, sign shop orders, bid estimates, or bid board..."
              className="pl-9"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-5">
            {loading ? (
              <p className="text-sm text-muted-foreground">Searching...</p>
            ) : !debouncedQuery ? (
              <p className="text-sm text-muted-foreground">Start typing to search across the system.</p>
            ) : !hasResults ? (
              <p className="text-sm text-muted-foreground">No results found.</p>
            ) : (
              sections.map((section) =>
                section.results.length > 0 ? (
                  <div key={section.key} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {section.label}
                    </h3>
                    <div className="rounded-lg border divide-y overflow-hidden">
                      {section.results.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleSelect(result.href)}
                          className="w-full px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                        >
                          <p className="text-sm font-medium text-foreground">{result.title}</p>
                          {result.subtitle ? (
                            <p className="text-xs text-muted-foreground mt-0.5">{result.subtitle}</p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
