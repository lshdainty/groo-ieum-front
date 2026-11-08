import { Skeleton } from '@/shared/ui/shadcn/skeleton'

export const TotalDuesWidgetSkeleton = () => {
  return (
    <div className="flex flex-col min-[64rem]:grid min-[64rem]:grid-cols-4 divide-y min-[64rem]:divide-y-0 min-[64rem]:divide-x divide-border h-full bg-card">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="p-4 h-auto min-[64rem]:h-full relative overflow-hidden min-h-[120px] shrink-0">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <div className="flex items-baseline gap-1 mb-1">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-6" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
