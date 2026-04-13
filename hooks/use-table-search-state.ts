"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

interface UseTableSearchStateOptions {
  paramName?: string;
  defaultValue?: string;
  debounceMs?: number;
}

export function useTableSearchState({
  paramName = "search",
  defaultValue = "",
  debounceMs = 300,
}: UseTableSearchStateOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentParams = useMemo(
    () => new URLSearchParams(searchParams?.toString() ?? ""),
    [searchParams]
  );
  const urlValue = currentParams.get(paramName) ?? defaultValue;
  const [search, setSearch] = useState(urlValue);
  const lastSyncedValueRef = useRef(urlValue);

  useEffect(() => {
    lastSyncedValueRef.current = urlValue;
    setSearch(prev => (prev === urlValue ? prev : urlValue));
  }, [urlValue]);

  const debouncedSearch = useDebounce(search, debounceMs);

  useEffect(() => {
    if (lastSyncedValueRef.current === debouncedSearch) return;

    const params = new URLSearchParams(currentParams.toString());
    if (debouncedSearch) {
      params.set(paramName, debouncedSearch);
    } else {
      params.delete(paramName);
    }

    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const currentPathname = pathname ?? "/";
    lastSyncedValueRef.current = debouncedSearch;
    router.replace(params.toString() ? `${currentPathname}?${params.toString()}` : currentPathname, {
      scroll: false,
    });

    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "auto" });
      });
    }
  }, [currentParams, debouncedSearch, paramName, pathname, router]);

  return {
    search,
    setSearch,
    debouncedSearch,
    clearSearch: () => setSearch(""),
  };
}
