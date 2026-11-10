import { Skeleton } from '@/shared/ds/skeleton'

/** 근무 일정 기다림 — 사람 줄 틀(이름 칸 + 막대 자리). 제목 줄 · 안내 줄은 처음부터 그린다 */
export const ScheduleSkeleton = ({ desktop }: { desktop: boolean }) => (
  <div aria-hidden className='flex flex-col'>
    {Array.from({ length: 5 }).map((_, i) =>
      desktop ? (
        <div key={i} className='flex h-[64px] items-center gap-x3 border-b border-stroke-neutral-subtle px-x6 last:border-b-0'>
          <Skeleton radius='full' className='block size-[36px] shrink-0' />
          <div className='flex w-[130px] flex-col gap-x1'>
            <Skeleton text='t4' className='block w-3/5' />
            <Skeleton text='t3' className='block w-4/5' />
          </div>
          <Skeleton radius='12' className='ml-x6 block h-[32px] w-[40%]' />
        </div>
      ) : (
        <div key={i} className='flex items-center gap-x3 px-x6 py-x3'>
          <Skeleton radius='full' className='block size-[42px] shrink-0' />
          <div className='flex flex-1 flex-col gap-x1'>
            <Skeleton text='t5' className='block w-1/3' />
            <Skeleton text='t3' className='block w-1/2' />
          </div>
        </div>
      ),
    )}
  </div>
)
