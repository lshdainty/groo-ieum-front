import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'

/** 년 보기의 첫 불러오기 자리 — 열두 달 상자 */
export const CalendarYearViewSkeleton = () => (
  <LoadingRegion
    pending
    className='contents'
    fallback={
      <div aria-hidden className='grid grid-cols-2 gap-x4 p-x4 min-[64rem]:grid-cols-3 min-[80rem]:grid-cols-4'>
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} radius='12' className='block h-[200px] w-full' />
        ))}
      </div>
    }
  />
)
