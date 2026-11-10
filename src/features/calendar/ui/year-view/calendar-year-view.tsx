import { addMonths, startOfYear } from 'date-fns'
import { useMemo } from 'react'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { YearViewMonth } from '@/features/calendar/ui/year-view/year-view-month'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  allEvents: IEvent[]
  /** 달 머리 · 날을 누름 → 그 달(그 날)의 월 보기 */
  onPickMonth: (date: Date) => void
}

const CalendarYearView = ({ allEvents, onPickMonth }: IProps) => {
  const { selectedDate } = useCalendar()

  const months = useMemo(() => {
    const yearStart = startOfYear(selectedDate)
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i))
  }, [selectedDate])

  // 년 보기는 일정이 시작하는 날에만 점을 둔다 — 끝 날을 시작 날로 맞춘 사본
  const startOnly = useMemo(() => allEvents.map((event) => ({ ...event, endDate: event.startDate })), [allEvents])

  return (
    <div className='h-full w-full overflow-y-auto p-x4'>
      <div className='grid grid-cols-2 gap-x4 md:grid-cols-3 lg:grid-cols-4'>
        {months.map((month) => (
          <YearViewMonth key={month.toString()} month={month} events={startOnly} onPickMonth={onPickMonth} />
        ))}
      </div>
    </div>
  )
}

export { CalendarYearView }
