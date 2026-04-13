"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Search } from "lucide-react";

import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  target: string;
}

interface SearchSection {
  key: string;
  label: string;
  items: SearchResultItem[];
}

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchModal({ open, onOpenChange }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<SearchSection[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    if (!debouncedQuery.trim()) {
      setSections([]);
      setLoading(false);
      return () => controller.abort();
    }

    const runSearch = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/global-search?query=${encodeURIComponent(debouncedQuery.trim())}&limit=5`,
          { signal: controller.signal }
        );
        const result = await response.json();

        if (!controller.signal.aborted) {
          setSections(result.sections || []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("[global-search-modal] search failed", error);
          setSections([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void runSearch();

    return () => controller.abort();
  }, [debouncedQuery, open]);

  useEffect(() => {
    if (open) return;
    setQuery("");
    setSections([]);
    setLoading(false);
  }, [open]);

  const hasResults = useMemo(() => sections.some((section) => section.items.length > 0), [sections]);

  const handleSelect = (target: string) => {
    onOpenChange(false);
    router.push(target);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="text-xl">Global Search</DialogTitle>
          <DialogDescription>
            Search bids, jobs, contracts, sign orders, quotes, customers, and contacts.
          </DialogDescription>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by customer, contact, contract number, quote number, sign order, or job..."
              className="h-11 pl-10 pr-12 text-sm"
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </DialogHeader>

        <div className="max-h-[calc(85vh-160px)] overflow-y-auto px-6 py-4">
          {!query.trim() ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Start typing to search across the app.
            </div>
          ) : !loading && !hasResults ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No matches found for “{query.trim()}”.
            </div>
          ) : (
            <div className="space-y-5">
              {sections.map((section) => (
                <section key={section.key} className="space-y-2">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {section.label}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.target)}
                        className={cn(
                          "flex w-full items-start justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                          "hover:border-foreground/20 hover:bg-muted/40"
                        )}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {item.title}
                            </span>
                            {item.meta ? (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {item.meta}
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p>
                        </div>
                        <ArrowUpRight className="ml-3 mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
