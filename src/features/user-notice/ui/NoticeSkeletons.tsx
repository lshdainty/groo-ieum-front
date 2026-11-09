import { Skeleton } from '@/shared/ds/skeleton'

/** 공지 줄 셋 자리(배지 · 제목 · 메타) — 불러오는 중(U 절) */
export const NoticeRowsSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className='flex flex-col'>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className='flex flex-col items-start gap-x1 px-x6 py-x3'>
        <Skeleton radius='full' className='block h-x5 w-x12' />
        <Skeleton text='t5' className='block w-3/4' />
        <Skeleton text='t3' className='block w-1/2' />
      </div>
    ))}
  </div>
)

/** 공지 상세 자리 — 배지 + 제목 두 줄 + 본문 네 줄 */
export const NoticeDetailSkeleton = () => (
  <div className='flex flex-col items-start gap-x2'>
    <Skeleton radius='full' className='block h-x5 w-x12' />
    <Skeleton text='t8' className='block w-full' />
    <Skeleton text='t8' className='block w-2/3' />
    <div className='mt-x5 flex w-full flex-col gap-x2'>
      <Skeleton text='t5' className='block w-full' />
      <Skeleton text='t5' className='block w-full' />
      <Skeleton text='t5' className='block w-5/6' />
      <Skeleton text='t5' className='block w-2/3' />
    </div>
  </div>
)
