'use client'

import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'

import { useEventsByPeriodQuery } from '@/entities/calendar-event'
import { useHolidaysByPeriodQuery } from '@/entities/holiday'
import { convertApiEventToIEvent } from '@/features/calendar/lib/helpers'
import { useCalendar } from '@/features/calendar/model/calendar-context'
import { CalendarScreen } from '@/features/calendar/ui/CalendarScreen'

/**
 * 캘린더 읽기 — 일정 질의는 quiet(실패는 격자 자리 Result Section + [다시 시도] 가 말한다 · 임시 그물 Snackbar 를 건너뛴다).
 * 처음 불러올 때만 격자가 Skeleton 이고, 이미 받은 값이 있는 채 다시 받기에 실패하면 지금 값을 그대로 둔다.
 * 공휴일 질의는 실패해도 공휴일 없이 그린다(quiet).
 */
const CalendarContent = () => {
  const { selectedDate, view, users, setHolidays } = useCalendar()

  const eventRange = useMemo(() => {
    switch (view) {
      case 'week':
        return { start: dayjs(selectedDate).startOf('week'), end: dayjs(selectedDate).endOf('week') }
      case 'year':
        return { start: dayjs(selectedDate).startOf('year'), end: dayjs(selectedDate).endOf('year') }
      default:
        // 월 · 목록 — 격자가 보여 주는 앞뒤 달 날까지
        return { start: dayjs(selectedDate).startOf('month').startOf('week'), end: dayjs(selectedDate).endOf('month').endOf('week') }
    }
  }, [selectedDate, view])

  const events = useEventsByPeriodQuery(eventRange.start.format('YYYY-MM-DDTHH:mm:ss'), eventRange.end.format('YYYY-MM-DDTHH:mm:ss'), { quiet: true })
  // 공휴일은 현재 연도 전체
  const holidays = useHolidaysByPeriodQuery(dayjs(selectedDate).startOf('year').format('YYYY-MM-DD'), dayjs(selectedDate).endOf('year').format('YYYY-MM-DD'), 'KR', { quiet: true })

  const converted = useMemo(() => (events.data ?? []).map((e) => convertApiEventToIEvent(e, users)), [events.data, users])

  // 사람 필터 목록 — 사용자 목록 + 일정이 가진 사람(시스템 계정 · 목록을 못 받았을 때)
  const people = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u]))
    converted.forEach((e) => {
      if (!map.has(e.user.id)) map.set(e.user.id, e.user)
    })
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [users, converted])

  useEffect(() => {
    if (holidays.data) setHolidays(holidays.data)
  }, [holidays.data, setHolidays])

  return (
    <CalendarScreen
      events={converted}
      people={people}
      isLoading={events.isPending && !events.isError}
      isFailed={events.isError && events.data === undefined}
      retrying={events.isFetching}
      onRetry={() => void events.refetch()}
    />
  )
}

export { CalendarContent }
