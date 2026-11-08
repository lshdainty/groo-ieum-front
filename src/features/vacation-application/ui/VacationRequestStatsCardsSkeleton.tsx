import { Card, CardContent } from '@/shared/ui/shadcn/card'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'

const VacationRequestStatsContentSkeleton = () => {
  return (
    <div className='grid grid-cols-2 min-[64rem]:grid-cols-7 gap-4 mb-8'>
      {[...Array(7)].map((_, i) => (
        <Card key={i} className='py-0'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <Skeleton className='w-12 h-12 rounded-lg' />
              <Skeleton className='h-5 w-12 rounded-full' />
            </div>
            <div>
              <Skeleton className='h-4 w-16 mb-1' />
              <Skeleton className='h-8 w-12 mb-1' />
              <Skeleton className='h-3 w-24 mt-1' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { VacationRequestStatsContentSkeleton }
