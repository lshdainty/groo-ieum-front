import { endOfMonth, endOfWeek, endOfYear, format, isSameDay, parseISO, startOfMonth, startOfWeek, startOfYear } from 'date-fns'
import { useCallback, useMemo, useState } from 'react'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { eventsOnDay } from '@/features/calendar/lib/helpers'
import { useDeleteEvent } from '@/features/calendar/lib/hooks/use-delete-event'
import type { IEvent } from '@/features/calendar/model/interfaces'

/** 일정 한 건을 가리키는 값 — 번호는 휴가 사용 / 일정 표마다 따로라 kind 와 함께 쓴다 */
export interface EventRef {
  kind: IEvent['kind']
  id: number
}

/** 날 키 "YYYY-MM-DD" */
export const dayKey = (d: Date): string => format(d, 'yyyy-MM-dd')

export const eventKey = (e: EventRef): string => `${e.kind}-${e.id}`
export const refOf = (e: IEvent): EventRef => ({ kind: e.kind, id: e.id })
export const findEvent = (events: IEvent[], ref: EventRef): IEvent | undefined => events.find((e) => e.kind === ref.kind && e.id === ref.id)

/** 새 일정 폼의 시작 값 — 그 날(기간) · 시각 칸 기본값 */
export interface CreatingEvent {
  date: Date
  endDate?: Date
  startTime?: { hour: number; minute: number }
}

/** 보이는 범위 안의 일정 + 사람 · 종류 거름 — 화면 틀이 쓰는 상태 한 곳 */
export function useCalendarScreen(events: IEvent[]) {
  const { selectedDate, selectedUserIds, selectedTypeIds, view } = useCalendar()
  const { deleteEvent, isPending: deleting } = useDeleteEvent()

  const filteredEvents = useMemo(() => {
    let rangeStart: Date
    let rangeEnd: Date
    if (view === 'year') {
      rangeStart = startOfYear(selectedDate)
      rangeEnd = endOfYear(selectedDate)
    } else if (view === 'week') {
      rangeStart = startOfWeek(selectedDate)
      rangeEnd = endOfWeek(selectedDate)
    } else {
      rangeStart = startOfMonth(selectedDate)
      rangeEnd = endOfMonth(selectedDate)
    }
    return events.filter((event) => {
      const userMatch = selectedUserIds === 'all' || selectedUserIds.includes(event.user.id)
      const typeMatch = selectedTypeIds === 'all' || selectedTypeIds.includes(event.type.id)
      return userMatch && typeMatch && parseISO(event.startDate) <= rangeEnd && parseISO(event.endDate) >= rangeStart
    })
  }, [events, selectedDate, selectedUserIds, selectedTypeIds, view])

  const singleDayEvents = useMemo(() => filteredEvents.filter((e) => isSameDay(parseISO(e.startDate), parseISO(e.endDate))), [filteredEvents])
  const multiDayEvents = useMemo(() => filteredEvents.filter((e) => !isSameDay(parseISO(e.startDate), parseISO(e.endDate))), [filteredEvents])

  // 폰 그날 시트 · 월 보기 그날 패널이 보이는 날
  const [dayDate, setDayDate] = useState<Date | null>(null)
  // 상세 단계 — 폰 시트 · 월 보기 그날 패널 안 · 다른 보기의 상세 표면이 같이 쓴다. `day` 는 칩이 놓인 칸의 날(이어지는 일정은 누른 칸)
  const [detail, setDetail] = useState<{ ref: EventRef; day: string } | null>(null)
  const openDetail = useCallback((event: IEvent, day?: Date) => setDetail({ ref: refOf(event), day: dayKey(day ?? parseISO(event.startDate)) }), [])
  const closeDetail = useCallback(() => setDetail(null), [])
  const [creating, setCreating] = useState<CreatingEvent | null>(null)
  const [editing, setEditing] = useState<IEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IEvent | null>(null)

  const dayEvents = useMemo(() => (dayDate ? eventsOnDay(filteredEvents, dayDate) : []), [filteredEvents, dayDate])

  return {
    filteredEvents,
    singleDayEvents,
    multiDayEvents,
    dayDate,
    setDayDate,
    dayEvents,
    detail,
    openDetail,
    closeDetail,
    creating,
    setCreating,
    editing,
    setEditing,
    deleteTarget,
    setDeleteTarget,
    deleteEvent,
    deleting,
  }
}

export type CalendarScreen = ReturnType<typeof useCalendarScreen>
