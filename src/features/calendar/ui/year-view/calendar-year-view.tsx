import { addMonths, startOfYear } from 'date-fns'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { datePickerLabels } from '@/shared/ds/date-picker'
import { cn } from '@/shared/lib/cn'
import { WEEK_GRID_TEXT } from '@/shared/ui/groo/week-grid-text'
import { YearViewMonth } from '@/features/calendar/ui/year-view/year-view-month'
import { useYearColumns } from '@/features/calendar/ui/year-view/use-year-columns'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  allEvents: IEvent[]
  /** 달 머리 · 날을 누름 → 그 달(그 날)의 월 보기 */
  onPickMonth: (date: Date) => void
}

/** 가장 짧은 꼴의 요일(작은 달 머리가 칸에 들지 않을 때 쓰는 글) — 언어를 열쇠로 받아 언어가 바뀌면 다시 읽는다 */
const weekdaysFor = (language: string) => {
  void language
  return datePickerLabels().weekdaysNarrow
}

const CalendarYearView = ({ allEvents, onPickMonth }: IProps) => {
  const { selectedDate } = useCalendar()
  const { i18n } = useTranslation()
  // 한 줄 달 수 — 날짜 칸이 요일 · 날짜 글보다 좁아지면 줄인다(groo-design #257)
  const { gridRef, probeRef, columns } = useYearColumns()
  const narrowWeekdays = weekdaysFor(i18n.language)

  const months = useMemo(() => {
    const yearStart = startOfYear(selectedDate)
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i))
  }, [selectedDate])

  // 년 보기는 일정이 시작하는 날에만 점을 둔다 — 끝 날을 시작 날로 맞춘 사본
  const startOnly = useMemo(() => allEvents.map((event) => ({ ...event, endDate: event.startDate })), [allEvents])

  return (
    <div className='relative h-full w-full overflow-y-auto p-x4'>
      <div ref={gridRef} data-year-grid data-columns={columns} className='grid gap-x4' style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {months.map((month) => (
          <YearViewMonth key={month.toString()} month={month} events={startOnly} onPickMonth={onPickMonth} />
        ))}
      </div>
      {/* 날짜 칸에 들어야 하는 글의 견본 — 요일(가장 짧은 꼴, 작은 달 머리와 같은 글자 — 200% 에서 멈춘 크기, WEEK_GRID_TEXT) · 날짜 1 ~ 31(오늘은 굵게). 보이지 않는다 */}
      <div ref={probeRef} aria-hidden className='invisible absolute left-0 top-0 flex whitespace-nowrap'>
        {narrowWeekdays.map((w, i) => (
          <span key={`w${i}`} className={cn('font-medium', WEEK_GRID_TEXT.t2)}>
            {w}
          </span>
        ))}
        {Array.from({ length: 31 }, (_, i) => (
          <span key={`d${i}`} className={cn('font-bold', WEEK_GRID_TEXT.t2)}>
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  )
}

export { CalendarYearView }
