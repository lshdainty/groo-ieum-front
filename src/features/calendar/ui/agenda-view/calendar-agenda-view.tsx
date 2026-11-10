import { endOfDay, format, isSameMonth, parseISO, startOfDay } from 'date-fns'
import dayjs from 'dayjs'
import { useMemo } from 'react'

import { ListHeader } from '@/shared/ds/list'
import { dayLabel } from '@/features/calendar/lib/event-text'
import { useCalendar } from '@/features/calendar/model/calendar-context'
import { DayEventList } from '@/features/calendar/ui/day-event-list'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  singleDayEvents: IEvent[]
  multiDayEvents: IEvent[]
  onEventClick: (event: IEvent, day: Date) => void
}

/**
 * 목록 보기(G 39) — 보고 있는 달의 일정을 날마다 묶는다: 날 머리("10월 23일 (금)") + 일정 줄(그날 목록과 같은 줄 — 색 막대 · 사람 이름 · "{종류} · {시각}").
 * 이어지는 일정은 걸친 날마다 한 줄씩 "{n}/{m}일째" 를 붙인다. 공휴일은 그 날 맨 위 보기만 하는 줄.
 */
const CalendarAgendaView = ({ singleDayEvents, multiDayEvents, onEventClick }: IProps) => {
  const { selectedDate, findHolidayByDate } = useCalendar()

  const groups = useMemo(() => {
    const byDay = new Map<string, { date: Date; events: IEvent[] }>()
    const add = (date: Date, event: IEvent) => {
      const key = format(date, 'yyyy-MM-dd')
      if (!byDay.has(key)) byDay.set(key, { date: startOfDay(date), events: [] })
      byDay.get(key)!.events.push(event)
    }
    singleDayEvents.forEach((event) => {
      const d = parseISO(event.startDate)
      if (isSameMonth(d, selectedDate)) add(d, event)
    })
    multiDayEvents.forEach((event) => {
      let cur = startOfDay(parseISO(event.startDate))
      const last = endOfDay(parseISO(event.endDate))
      while (cur <= last) {
        if (isSameMonth(cur, selectedDate)) add(cur, event)
        cur = dayjs(cur).add(1, 'day').toDate()
      }
    })
    byDay.forEach((g) => g.events.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()))
    return [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [singleDayEvents, multiDayEvents, selectedDate])

  return (
    <div data-slot='calendar-agenda' className='h-full overflow-y-auto pb-x4'>
      {groups.map(({ date, events }) => {
        const holiday = findHolidayByDate(format(date, 'yyyy-MM-dd'))
        return (
          <section key={format(date, 'yyyy-MM-dd')} aria-label={dayLabel(date)} data-agenda-day={format(date, 'yyyy-MM-dd')}>
            <ListHeader as='h3'>{dayLabel(date)}</ListHeader>
            <DayEventList events={events} day={date} holiday={holiday ? { name: holiday.holiday_name } : null} label={dayLabel(date)} onTapEvent={(e) => onEventClick(e, date)} />
          </section>
        )
      })}
    </div>
  )
}

export { CalendarAgendaView }
