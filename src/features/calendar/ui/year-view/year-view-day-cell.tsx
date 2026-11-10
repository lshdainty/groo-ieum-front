import { isToday } from 'date-fns'
import dayjs from 'dayjs'

import { cn } from '@/shared/lib/cn'
import { eventTone } from '@/features/calendar/lib/helpers'
import { useCalendar } from '@/features/calendar/model/calendar-context'
import { dayTone } from '@/features/calendar/ui/month-view/day-tone'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  day: number
  date: Date
  events: IEvent[]
  /** 누르면 그 날의 월 보기 */
  onPick: (date: Date) => void
}

const MAX_DOTS = 3

const YearViewDayCell = ({ day, date, events, onPick }: IProps) => {
  const { findHolidayByDate, setSelectedDate } = useCalendar()
  const holiday = findHolidayByDate(dayjs(date).format('YYYY-MM-DD'))
  const tone = dayTone({ currentMonth: true, sunday: date.getDay() === 0, saturday: date.getDay() === 6, holiday })

  return (
    <button
      onClick={() => {
        setSelectedDate(date)
        onPick(date)
      }}
      type='button'
      className='flex h-11 flex-1 flex-col items-center justify-start gap-x0_5 rounded-r2 border-0 bg-transparent pt-x1 hover:bg-bg-neutral-weak focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring'
    >
      <div className={cn('flex size-6 items-center justify-center rounded-full text-t2 font-medium', tone, isToday(date) && 'bg-bg-neutral-weak font-bold')}>{day}</div>
      {events.length > 0 && (
        <div className='mt-x0_5 flex items-center gap-x0_5'>
          {events.slice(0, events.length <= MAX_DOTS ? MAX_DOTS : 1).map((event) => (
            <span key={`${event.kind}-${event.id}`} aria-hidden className='size-[6px] rounded-full' style={{ background: eventTone(event).color }} />
          ))}
          {events.length > MAX_DOTS && <span className='text-t1 text-fg-neutral-muted'>+{events.length - 1}</span>}
        </div>
      )}
    </button>
  )
}

export { YearViewDayCell }
