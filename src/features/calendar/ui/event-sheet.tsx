import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { dayLabel } from '@/features/calendar/lib/event-text'
import { useCanAddEvent, useCanEditEvent } from '@/features/calendar/model/use-can-edit-event'
import { findEvent, type EventRef } from '@/features/calendar/model/use-calendar-screen'
import type { IEvent } from '@/features/calendar/model/interfaces'
import { DayEventList, type DayHoliday } from '@/features/calendar/ui/day-event-list'
import { EventDetailBody } from '@/features/calendar/ui/event-detail-body'

/**
 * 일정이 든 표면(G 33 · 40) — 1280 이상 대화상자 480 · 미만 시트. 단계(목록 → 상세)는 화면 틀이 들고 있어 폭을 넘나들어도 남는다.
 *  - 폰 그날 시트(`listDate` 를 주면): 그날 목록 → 상세. 상세 머리 ← 는 목록으로.
 *  - 768 이상 월 보기 밖(주 · 년 · 목록 보기): 바로 상세.
 * [수정] 은 화면 틀이 같은 자리에 일정 폼을 연다(이 표면은 접힌다) — 상세 위에 수정 표면을 더 겹쳐 딤이 두 겹이 되지 않는다.
 * 지우거나 날짜를 옮겨 일정이 사라지면 목록으로(목록이 없으면 닫힘) 돌아간다.
 */
export function EventSheet({
  events,
  listDate,
  holiday,
  detail,
  onDetail,
  onClose,
  onAdd,
  onEdit,
  onRequestDelete,
}: {
  /** 일정을 찾는 원본 — 폰은 그날 일정, 그 밖은 보이는 범위의 일정 */
  events: IEvent[]
  listDate?: Date
  holiday?: DayHoliday | null
  detail: EventRef | null
  onDetail: (event: IEvent | null) => void
  onClose: () => void
  /** 그날 목록 바닥 [일정 추가] */
  onAdd?: () => void
  onEdit: (event: IEvent) => void
  onRequestDelete: (event: IEvent) => void
}) {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const canEdit = useCanEditEvent()
  const canAdd = useCanAddEvent()
  const hasList = listDate != null

  const current = detail ? findEvent(events, detail) : undefined
  const gone = !!detail && !current
  // 가리키던 일정이 사라졌다(지움 · 저장으로 번호가 바뀜) — 폰은 그날 목록, 그 밖은 닫는다
  useEffect(() => {
    if (!gone) return
    if (hasList) onDetail(null)
    else onClose()
  }, [gone, hasList, onDetail, onClose])

  const inDetail = !!current
  const editable = current ? canEdit(current) : false
  return (
    <ResponsiveDialog open onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent
        title={inDetail ? t('eventDetail') : listDate ? dayLabel(listDate) : t('eventDetail')}
        description={inDetail || !listDate ? undefined : t('sheet.count', { count: events.length })}
        onBack={inDetail && hasList ? () => onDetail(null) : undefined}
        aria-describedby={undefined}
      >
        <ResponsiveDialogBody>
          {inDetail && current ? (
            // 줄 묶음은 제 좌우 여백(24)을 가지므로 본문 여백을 뺀다 — 줄 글이 제목과 같은 x 에서 시작한다
            <div className='-mx-x6' data-event-step='detail'>
              <EventDetailBody event={current} />
            </div>
          ) : events.length === 0 && !holiday ? (
            <p data-slot='day-sheet-empty' className='m-0 py-x8 text-center text-t4 text-fg-neutral-subtle'>
              {t('noEvents')}
            </p>
          ) : (
            <div data-slot='day-sheet-list' data-event-step='list' className='-mx-x6'>
              <DayEventList events={events} holiday={holiday} label={listDate ? dayLabel(listDate) : ''} onTapEvent={(e) => onDetail(e)} />
            </div>
          )}
        </ResponsiveDialogBody>
        {inDetail && current && editable ? (
          <ResponsiveDialogFooter>
            <Button variant='ghost' ghostColor='critical' size='large' onClick={() => onRequestDelete(current)} data-event-delete>
              {tc('delete')}
            </Button>
            <Button variant='neutralSolid' onClick={() => onEdit(current)} data-event-edit>
              {tc('edit')}
            </Button>
          </ResponsiveDialogFooter>
        ) : !inDetail && hasList && canAdd ? (
          <ResponsiveDialogFooter>
            <Button variant='neutralSolid' onClick={onAdd} data-event-add>
              {t('header.addEvent')}
            </Button>
          </ResponsiveDialogFooter>
        ) : inDetail ? (
          <ResponsiveDialogFooter>
            <ResponsiveDialogCancel>{tc('close')}</ResponsiveDialogCancel>
          </ResponsiveDialogFooter>
        ) : null}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
