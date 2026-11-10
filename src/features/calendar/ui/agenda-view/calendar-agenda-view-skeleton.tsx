import { List, ListHeader, ListItem } from '@/shared/ds/list'
import { LoadingRegion, Skeleton } from '@/shared/ds/skeleton'

/** 목록 보기의 첫 불러오기 자리 — 날 머리 + 줄 둘 셋 묶음. 다시 받는 중에는 쓰지 않는다 */
export const CalendarAgendaViewSkeleton = () => (
  <LoadingRegion
    pending
    className='contents'
    fallback={
      <div aria-hidden className='flex flex-col'>
        {[2, 1, 2].map((rows, g) => (
          <div key={g}>
            <ListHeader as='h3'>
              <Skeleton text='t3' className='w-x16' />
            </ListHeader>
            <List>
              {Array.from({ length: rows }, (_, i) => (
                <ListItem key={i} prefix={<Skeleton radius='full' className='h-x8 w-[3px]' />} title={<Skeleton text='t5' className='w-32 max-w-full' />} detail={<Skeleton text='t3' className='w-24 max-w-full' />} />
              ))}
            </List>
          </div>
        ))}
      </div>
    }
  />
)
