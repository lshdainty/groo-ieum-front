import { Skeleton } from '@/shared/ui/shadcn/skeleton'

export const UserCompanyStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 min-[64rem]:grid-cols-5 divide-y min-[64rem]:divide-y-0 min-[64rem]:divide-x divide-border h-full bg-card">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="p-6 h-full">
          <div className="flex flex-col h-full justify-between">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="w-8 h-8 rounded" />
            </div>
            <div>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
