import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/** Generic table-page skeleton: header + filter bar + table rows */
export function TablePageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <Skeleton className="h-9 w-64 rounded-md" />
      <Card>
        <CardContent className="p-0">
          <div className="flex gap-4 px-4 py-3 border-b">
            {[40, 25, 20, 15].map((w, i) => (
              <Skeleton
                key={i}
                className="h-4 rounded"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 px-4 py-3 border-b last:border-b-0 items-center"
            >
              {[40, 25, 20, 15].map((w, j) => (
                <Skeleton
                  key={j}
                  className="h-4 rounded"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function CardListSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ChartPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-55 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
