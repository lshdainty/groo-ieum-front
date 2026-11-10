import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { useSnackbar } from '@/shared/ds/snackbar'
import { formatDayText } from '@/shared/lib/date-text'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { getEventDisplayName } from '@/features/calendar/lib/helpers'
import { useCalendar } from '@/features/calendar/model/calendar-context'
import { useCalendarScreen } from '@/features/calendar/model/use-calendar-screen'
import type { IEvent, IUser } from '@/features/calendar/model/interfaces'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useWide } from '@/widgets/layout/lib/use-wide'
import { CalendarDesktop } from '@/features/calendar/ui/CalendarDesktop'
import { CalendarPhone } from '@/features/calendar/ui/CalendarPhone'
import { EventFormDialog } from '@/features/calendar/ui/event-form-dialog'
import { EventSheet } from '@/features/calendar/ui/event-sheet'

interface IProps {
  events: IEvent[]
  people: IUser[]
  isLoading: boolean
  /** 일정 질의가 내용 없이 실패했다 */
  isFailed: boolean
  retrying: boolean
  onRetry: () => void
}

/**
 * 캘린더 화면 틀 — 상태(`useCalendarScreen`)를 들고 폰(768 미만) · 데스크톱 · 태블릿 표면을 고르며, 둘이 같이 쓰는 표면(그날 시트 · 일정 폼 · 삭제 확인)을 그린다.
 * 열린 표면 · 단계 · 폼은 이 틀이 들고 있어 폭이 768 · 1280 을 넘나들어도 닫히거나 값이 사라지지 않는다.
 */
export function CalendarScreen({ events, people, isLoading, isFailed, retrying, onRetry }: IProps) {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const desktop = useDesktop()
  const wide = useWide()
  const { view, setView, findHolidayByDate } = useCalendar()
  const screen = useCalendarScreen(events)
  const { dayDate, setDayDate, dayEvents, detail, openDetail, closeDetail, creating, setCreating, editing, setEditing, deleteTarget, setDeleteTarget, deleteEvent, filteredEvents } = screen

  // 폰은 월 · 목록만 — 주 · 년을 보던 화면은 월로(창을 768 아래로 줄였을 때)
  useEffect(() => {
    if (!desktop && (view === 'week' || view === 'year')) setView('month')
  }, [desktop, view, setView])

  // 확인창이 닫히는 동안에도 지우던 일정의 글을 보인다
  const [lastDeleted, setLastDeleted] = useState<IEvent | null>(null)
  if (deleteTarget && deleteTarget !== lastDeleted) setLastDeleted(deleteTarget)
  const target = deleteTarget ?? lastDeleted

  const dayHoliday = dayDate ? findHolidayByDate(dayjs(dayDate).format('YYYY-MM-DD')) : undefined
  const phoneSheet = !desktop && dayDate !== null && !editing
  const detailSheet = desktop && view !== 'month' && detail !== null && !editing

  return (
    <>
      {desktop ? (
        <CalendarDesktop screen={screen} people={people} isLoading={isLoading} isFailed={isFailed} onRetry={onRetry} retrying={retrying} />
      ) : (
        <CalendarPhone screen={screen} people={people} isLoading={isLoading} isFailed={isFailed} onRetry={onRetry} retrying={retrying} />
      )}

      {/* 폰 그날 시트 — 한 시트 안에서 목록 → 상세. 시트를 닫았다 다시 열지 않는다 */}
      {phoneSheet && dayDate && (
        <EventSheet
          events={dayEvents}
          listDate={dayDate}
          holiday={dayHoliday ? { name: dayHoliday.holiday_name } : null}
          detail={detail?.ref ?? null}
          onDetail={(e) => (e ? openDetail(e, dayDate) : closeDetail())}
          onClose={() => {
            setDayDate(null)
            closeDetail()
          }}
          onAdd={() => {
            setCreating({ date: dayDate })
            setDayDate(null)
          }}
          onEdit={setEditing}
          onRequestDelete={setDeleteTarget}
        />
      )}

      {/* 주 · 년 · 목록 보기의 일정 상세 — 1280 이상 대화상자 480 · 미만 시트 */}
      {detailSheet && detail && (
        <EventSheet events={filteredEvents} detail={detail.ref} onDetail={() => undefined} onClose={closeDetail} onEdit={setEditing} onRequestDelete={setDeleteTarget} />
      )}

      {/* 일정 추가(제목 줄 · 그날 패널 · 시트 바닥 · 떠 있는 + · 두 날 끌기 · 주 보기 시간 칸) */}
      {creating && <EventFormDialog open start={creating} onClose={() => setCreating(null)} />}

      {/* 일정 수정 — 1280 미만 시트는 바닥 왼쪽 [삭제], 1280 이상 대화상자는 [취소][저장] */}
      {editing && <EventFormDialog open event={editing} onClose={() => setEditing(null)} onDelete={wide ? undefined : () => setDeleteTarget(editing)} />}

      {/* 삭제 확인 — 휴가 기록은 휴가 글, 일정은 일정 글(같은 동작 같은 글). 실패하면 확인창을 닫고 Snackbar + [다시 시도](ConfirmDialog 가 한다) */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null)
        }}
        title={target?.kind === 'vacation' ? tc('deleteVacation.title') : t('eventDetails.deleteTitle')}
        description={
          target
            ? target.kind === 'vacation'
              ? tc('deleteVacation.confirm', { date: formatDayText(target.startDate) })
              : t('eventDetails.deleteConfirm', { date: formatDayText(target.startDate), title: getEventDisplayName(target) })
            : ''
        }
        onConfirm={() => (target ? deleteEvent(target) : undefined)}
        onDone={() => {
          setEditing(null)
          closeDetail()
          snackbar.show({ message: t('eventDetails.deleted'), tone: 'positive' })
        }}
      />
    </>
  )
}
