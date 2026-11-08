import { Skeleton } from '@/shared/ui/shadcn/skeleton'

const MonthSkeleton = () => {
  return (
    <div className='rounded-lg border p-4'>
      {/* Month title */}
      <Skeleton className='h-5 w-20 mb-3' />

      {/* Week days header */}
      <div className='grid grid-cols-7 gap-1 mb-2'>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className='h-3 w-full' />
        ))}
      </div>

      {/* Calendar grid (6 weeks) */}
      <div className='grid grid-cols-7 gap-1'>
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className='aspect-square flex items-center justify-center'>
            <Skeleton className='h-6 w-6 rounded-full' />
          </div>
        ))}
      </div>
    </div>
  )
}

export const CalendarYearViewSkeleton = () => {
  return (
    <div className='w-full h-full overflow-hidden p-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 min-[64rem]:grid-cols-3 min-[80rem]:grid-cols-4'>
        {Array.from({ length: 12 }).map((_, i) => (
          <MonthSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
