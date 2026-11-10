import { CalendarX2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { FloatingActionButton } from '@/shared/ds/floating-action-button'
import { ResultSection } from '@/shared/ds/result-section'
import type { CalendarScreen } from '@/features/calendar/model/use-calendar-screen'
import { useCanAddEvent } from '@/features/calendar/model/use-can-edit-event'
import type { IUser } from '@/features/calendar/model/interfaces'
import { CalendarAgendaView } from '@/features/calendar/ui/agenda-view/calendar-agenda-view'
import { CalendarAgendaViewSkeleton } from '@/features/calendar/ui/agenda-view/calendar-agenda-view-skeleton'
import { CalendarLoadFailed } from '@/features/calendar/ui/calendar-load-failed'
import { CalendarToolbar } from '@/features/calendar/ui/header/calendar-toolbar'
import { CalendarMonthViewPhone, WeekdayRow } from '@/features/calendar/ui/month-view/month-view-phone'
import { CalendarMonthViewPhoneSkeleton } from '@/features/calendar/ui/month-view/month-skeleton-phone'
import { useCalendar } from '@/features/calendar/model/calendar-context'

/**
 * 폰(768 미만) 캘린더(G) — 달 줄(‹ 달 › + 월 · 목록) → 칩 줄 → 요일 줄 → 격자 → 떠 있는 +. 날을 누르면 그날 시트(화면 틀이 연다).
 * 달 줄 · 요일 줄은 처음부터 그리고, 격자만 처음 불러올 때 Skeleton · 실패하면 격자 자리 Result Section + [다시 시도].
 */
export function CalendarPhone({ screen, people, isLoading, isFailed, onRetry, retrying }: { screen: CalendarScreen; people: IUser[]; isLoading: boolean; isFailed: boolean; onRetry: () => void; retrying: boolean }) {
  const { t } = useTranslation('calendar')
  const { view } = useCalendar()
  const canAdd = useCanAddEvent()
  const { singleDayEvents, multiDayEvents, setDayDate, dayDate, setCreating, openDetail, filteredEvents } = screen
  const month = view !== 'agenda'

  return (
    <div data-slot='calendar-phone' className='flex flex-col bg-bg-layer-default pb-[96px]'>
      <CalendarToolbar desktop={false} people={people} />
      {month && <WeekdayRow />}
      {isLoading ? (
        month ? (
          <CalendarMonthViewPhoneSkeleton />
        ) : (
          <CalendarAgendaViewSkeleton />
        )
      ) : isFailed ? (
        <CalendarLoadFailed onRetry={onRetry} retrying={retrying} />
      ) : month ? (
        <CalendarMonthViewPhone singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} onDayClick={setDayDate} />
      ) : filteredEvents.length === 0 ? (
        <ResultSection size='medium' icon={<CalendarX2 />} title={t('agenda.empty')} />
      ) : (
        <CalendarAgendaView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} onEventClick={(e, day) => openDetail(e, day)} />
      )}
      {canAdd && dayDate === null && <FloatingActionButton icon={<Plus />} aria-label={t('header.addEvent')} onClick={() => setCreating({ date: new Date() })} data-create-event />}
    </div>
  )
}
