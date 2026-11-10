import { CalendarX2, Plus } from 'lucide-react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Card } from '@/shared/ds/card'
import { ResultSection } from '@/shared/ds/result-section'
import { cn } from '@/shared/lib/cn'
import { eventsOnDay } from '@/features/calendar/lib/helpers'
import { useCalendar } from '@/features/calendar/model/calendar-context'
import { dayKey, findEvent, type CalendarScreen } from '@/features/calendar/model/use-calendar-screen'
import { useCanAddEvent, useCanEditEvent } from '@/features/calendar/model/use-can-edit-event'
import type { IUser } from '@/features/calendar/model/interfaces'
import { useWide } from '@/widgets/layout/lib/use-wide'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { CalendarAgendaView } from '@/features/calendar/ui/agenda-view/calendar-agenda-view'
import { CalendarAgendaViewSkeleton } from '@/features/calendar/ui/agenda-view/calendar-agenda-view-skeleton'
import { CalendarLoadFailed } from '@/features/calendar/ui/calendar-load-failed'
import { DayPanel } from '@/features/calendar/ui/day-panel'
import { DndProviderWrapper } from '@/features/calendar/ui/dnd/dnd-provider'
import { CalendarToolbar } from '@/features/calendar/ui/header/calendar-toolbar'
import { CalendarMonthViewDesktop, WeekdayHead } from '@/features/calendar/ui/month-view/month-view-desktop'
import { CalendarMonthViewDesktopSkeleton } from '@/features/calendar/ui/month-view/month-skeleton-desktop'
import { CalendarWeekView } from '@/features/calendar/ui/week-and-day-view/calendar-week-view'
import { CalendarWeekViewSkeleton } from '@/features/calendar/ui/week-and-day-view/calendar-week-view-skeleton'
import { CalendarYearView } from '@/features/calendar/ui/year-view/calendar-year-view'
import { CalendarYearViewSkeleton } from '@/features/calendar/ui/year-view/calendar-year-view-skeleton'

/**
 * 768 이상 캘린더(G) — 제목 줄("캘린더" + [일정 추가]) 아래 격자 카드(카드 안 맨 위 도구 줄: ‹ 달 › · 칩 둘 · 보기 Segmented).
 * 월 보기: 1280 이상은 격자 카드 | 24 | 그날 패널 320, 768 ~ 1279 는 격자 카드 → 8 → 그날 목록 카드. 주 · 년 · 목록 보기는 카드 하나 폭 전체.
 * 칩을 누르면 그 날을 고르고 패널(목록 카드) 안 한 단계 상세 · 두 날 이상을 끌어 놓으면 그 기간으로 일정 폼. 주 · 년 · 목록 보기의 상세는 표면(화면 틀이 연다).
 */
export function CalendarDesktop({ screen, people, isLoading, isFailed, onRetry, retrying }: { screen: CalendarScreen; people: IUser[]; isLoading: boolean; isFailed: boolean; onRetry: () => void; retrying: boolean }) {
  const { t } = useTranslation('calendar')
  const wide = useWide()
  const canAdd = useCanAddEvent()
  const canEdit = useCanEditEvent()
  const { view, selectedDate, setSelectedDate, setView, findHolidayByDate } = useCalendar()
  const { filteredEvents, singleDayEvents, multiDayEvents, detail, openDetail, closeDetail, setCreating, setEditing, setDeleteTarget } = screen

  const dayEvents = eventsOnDay(filteredEvents, selectedDate)
  const holidayInfo = findHolidayByDate(dayjs(selectedDate).format('YYYY-MM-DD'))
  const holiday = holidayInfo ? { name: holidayInfo.holiday_name } : null
  // 월 보기 — 그날 패널(목록 카드)이 상세를 그린다. 보던 날을 바꾸면 패널은 그 날의 목록으로 돌아간다
  const panelEvent = view === 'month' && detail && detail.day === dayKey(selectedDate) ? findEvent(dayEvents, detail.ref) : undefined

  const toolbar = <CalendarToolbar desktop people={people} />
  const openCreate = (start: Date, end?: Date) => setCreating({ date: start, endDate: end })

  const monthBody = (
    <>
      <Card data-slot='calendar-month-grid' className='p-0'>
        {toolbar}
        {isLoading ? (
          <CalendarMonthViewDesktopSkeleton />
        ) : isFailed ? (
          <>
            <WeekdayHead />
            <CalendarLoadFailed onRetry={onRetry} retrying={retrying} />
          </>
        ) : (
          <CalendarMonthViewDesktop singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} onEventClick={(e, day) => { setSelectedDate(day); openDetail(e, day) }} onCreate={openCreate} />
        )}
      </Card>
      {/* 실패는 "일정 없음" 이 아니다 — 그날 패널은 불러온 일정이 있을 때만 */}
      {!isFailed && (
        <div className={cn('relative min-w-0', panelEvent && 'self-stretch')}>
          <DayPanel
            date={selectedDate}
            events={dayEvents}
            holiday={holiday}
            loading={isLoading}
            canAdd={canAdd}
            onAdd={() => setCreating({ date: selectedDate })}
            onTapEvent={(e) => openDetail(e, selectedDate)}
            detail={panelEvent}
            canEdit={panelEvent ? canEdit(panelEvent) : false}
            onBack={closeDetail}
            onEdit={setEditing}
            onDelete={setDeleteTarget}
            className={panelEvent && wide ? 'absolute inset-0' : undefined}
          />
        </div>
      )}
    </>
  )

  // 주 · 년 · 목록 — 카드 하나. 안쪽이 스스로 스크롤하도록 높이를 준다
  const otherView = (body: React.ReactNode) => (
    <Card data-slot='calendar-view-card' className='flex h-[max(560px,calc(100dvh-14rem))] flex-col p-0'>
      {toolbar}
      <div className='min-h-0 flex-1'>{isFailed && !isLoading ? <CalendarLoadFailed onRetry={onRetry} retrying={retrying} /> : body}</div>
    </Card>
  )

  return (
    <ScreenBody density='high'>
      <ScreenTitleRow
        title={t('title')}
        action={
          canAdd ? (
            <Button variant='neutralOutline' size='small' onClick={() => setCreating({ date: new Date() })} data-create-event>
              <Plus aria-hidden />
              {t('header.addEvent')}
            </Button>
          ) : undefined
        }
      />
      <DndProviderWrapper>
        {view === 'month' &&
          (wide ? <div className='grid grid-cols-[minmax(0,1fr)_320px] items-start gap-x6'>{monthBody}</div> : <div className='flex flex-col gap-x2'>{monthBody}</div>)}
        {view === 'week' && otherView(isLoading ? <CalendarWeekViewSkeleton /> : <CalendarWeekView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} onEventClick={(e) => openDetail(e)} onCreate={(date, startTime) => setCreating({ date, startTime })} />)}
        {view === 'year' && otherView(isLoading ? <CalendarYearViewSkeleton /> : <CalendarYearView allEvents={filteredEvents} onPickMonth={(d) => { setSelectedDate(d); setView('month') }} />)}
        {view === 'agenda' &&
          otherView(
            isLoading ? (
              <CalendarAgendaViewSkeleton />
            ) : filteredEvents.length === 0 ? (
              <ResultSection size='medium' icon={<CalendarX2 />} title={t('agenda.empty')} />
            ) : (
              <CalendarAgendaView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} onEventClick={(e, day) => openDetail(e, day)} />
            ),
          )}
      </DndProviderWrapper>
    </ScreenBody>
  )
}
