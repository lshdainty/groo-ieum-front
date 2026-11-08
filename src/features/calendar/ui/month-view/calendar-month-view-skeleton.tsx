import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { useTranslation } from 'react-i18next'

const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

const DayCellSkeleton = ({ isSunday }: { isSunday: boolean }) => {
  return (
    <div className={`flex h-full flex-col gap-1 border-l border-t py-1.5 min-[64rem]:pb-2 min-[64rem]:pt-1 ${isSunday ? 'border-l-0' : ''}`}>
      {/* 날짜 영역 */}
      <div className='flex items-center justify-between px-1'>
        <div className='flex items-center gap-1 flex-1 min-w-0'>
          <Skeleton className='size-6 rounded-full' />
        </div>
      </div>

      {/* 이벤트 영역 */}
      <div className='flex flex-1 h-6 gap-1 px-2 min-[64rem]:flex-col min-[64rem]:gap-2 min-[64rem]:px-0'>
        {[0, 1, 2].map(position => (
          <div key={position} className='min-[64rem]:min-h-[28px]'>
            {position === 0 && (
              <>
                <Skeleton className='size-2 rounded-full min-[64rem]:hidden' />
                <Skeleton className='hidden min-[64rem]:block h-5 w-full rounded mx-1' />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export const CalendarMonthViewSkeleton = () => {
  const { i18n } = useTranslation()
  const weekDays = i18n.language === 'ko' ? WEEK_DAYS_KO : WEEK_DAYS_EN

  // 6주 x 7일 = 42개 셀
  const cells = Array.from({ length: 42 }, (_, i) => i)

  return (
    <div className='flex flex-col h-full'>
      {/* 요일 헤더 */}
      <div className='grid grid-cols-7 divide-x border-b flex-shrink-0'>
        {weekDays.map((day, index) => {
          const isSunday = index === 0
          const isSaturday = index === 6

          return (
            <div key={day} className='flex items-center justify-center py-2'>
              <span
                className='text-xs font-medium'
                style={{ color: isSunday ? '#ff6767' : isSaturday ? '#6767ff' : undefined }}
              >
                {day}
              </span>
            </div>
          )
        })}
      </div>

      {/* 캘린더 그리드 스켈레톤 */}
      <div className='flex-1 overflow-y-auto scrollbar-hide'>
        <div className='grid grid-cols-7 auto-rows-fr h-full'>
          {cells.map(index => (
            <DayCellSkeleton key={index} isSunday={index % 7 === 0} />
          ))}
        </div>
      </div>
    </div>
  )
}
