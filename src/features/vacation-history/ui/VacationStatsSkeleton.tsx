import { Skeleton } from '@/shared/ui/shadcn/skeleton'

export const VacationStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 min-[64rem]:grid-cols-3 divide-y min-[64rem]:divide-y-0 min-[64rem]:divide-x divide-border h-full bg-card">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="p-4 h-full">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}
