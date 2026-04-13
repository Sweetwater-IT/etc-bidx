import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type BidPageLoadingSkeletonProps = {
  showSearch?: boolean;
  showControls?: boolean;
  cardCount?: number;
  rowCount?: number;
};

export function BidPageLoadingSkeleton({
  showSearch = true,
  showControls = true,
  cardCount = 5,
  rowCount = 8,
}: BidPageLoadingSkeletonProps) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {showControls && (
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-10 w-[240px] rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      )}

      <div className="px-4 lg:px-6">
        <div
          className={cn(
            "grid gap-3",
            cardCount >= 5
              ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
              : cardCount === 4
                ? "grid-cols-2 xl:grid-cols-4"
                : "grid-cols-1 md:grid-cols-3"
          )}
        >
          {Array.from({ length: cardCount }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <Skeleton className="mx-auto h-8 w-20 rounded-md" />
              <Skeleton className="mx-auto mt-3 h-3 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {showSearch && (
        <div className="px-4 lg:px-6">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      )}

      <div className="space-y-4">
        <div className="px-6 mb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-24 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>

        <div className="px-6">
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="border-b bg-muted/30 px-4 py-3">
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-3 w-20 rounded-md" />
                ))}
              </div>
            </div>

            <div className="divide-y">
              {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-6 gap-4 px-4 py-4"
                >
                  {Array.from({ length: 6 }).map((_, cellIndex) => (
                    <Skeleton
                      key={cellIndex}
                      className={cn(
                        "h-4 rounded-md",
                        cellIndex === 0 ? "w-24" : "w-full"
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
