import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'

/** 주 보기의 첫 불러오기 자리 — 요일 머리 일곱 + 시간 칸 막대 몇 개 */
export const CalendarWeekViewSkeleton = () => (
  <LoadingRegion
    pending
    className='contents'
    fallback={
      <div aria-hidden className='grid h-full grid-cols-7 gap-x2 p-x4'>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className='flex flex-col gap-x3'>
            <Skeleton text='t3' className='mx-auto w-x8' />
            <Skeleton radius='8' className='h-x12 w-full' />
            {i % 2 === 0 && <Skeleton radius='8' className='h-x16 w-full' />}
          </div>
        ))}
      </div>
    }
  />
)
