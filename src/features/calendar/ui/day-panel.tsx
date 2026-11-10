import { ChevronLeft, Plus } from 'lucide-react'
import { isToday } from 'date-fns'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Card } from '@/shared/ds/card'
import { List, ListItem } from '@/shared/ds/list'
import { ScrollFog } from '@/shared/ds/scroll-fog'
import { Skeleton } from '@/shared/ds/skeleton'
import { cn } from '@/shared/lib/cn'
import { dayLabel, personName } from '@/features/calendar/lib/event-text'
import { DayEventList, type DayHoliday } from '@/features/calendar/ui/day-event-list'
import { EventDetailBody } from '@/features/calendar/ui/event-detail-body'
import type { IEvent } from '@/features/calendar/model/interfaces'

/**
 * 그날 패널 · 그날 목록 카드(G 34) — 1280 은 격자 오른쪽 320, 768 ~ 1279 는 격자 아래 폭 전체(같은 부품).
 * 머리: 날 "10월 22일 (목)" t5 700 + 오늘이면 "오늘" t2 700 fg-brand · 오른쪽 "추가"(small outline + plus 16, 권한이 있을 때만).
 * 그 아래 "일정 {n}개" t3 subtle. 본문은 일정 줄 목록, 빈 날은 안내 한 줄.
 * 칩을 누르면 같은 카드 안 한 단계 상세(`detail`) — 머리 "‹ 날짜" 로 목록에 돌아온다.
 */
export function DayPanel({
  date,
  events,
  holiday,
  loading,
  canAdd,
  onAdd,
  onTapEvent,
  detail,
  canEdit = false,
  onBack,
  onEdit,
  onDelete,
  className,
}: {
  date: Date
  events: IEvent[]
  holiday?: DayHoliday | null
  loading: boolean
  canAdd: boolean
  onAdd: () => void
  onTapEvent: (event: IEvent) => void
  detail?: IEvent | null
  canEdit?: boolean
  onBack?: () => void
  onEdit?: (event: IEvent) => void
  onDelete?: (event: IEvent) => void
  className?: string
}) {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const label = dayLabel(date)

  if (detail) {
    return (
      <Card
        data-slot='day-panel'
        data-step='detail'
        aria-label={personName(detail, t)}
        className={cn('flex flex-col p-0', className)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onBack?.()
          }
        }}
      >
        <div className='flex shrink-0 items-center pb-x2 pl-x6 pr-x5 pt-x4'>
          <Button variant='ghost' size='small' flush='left' className='font-bold' aria-label={t('panel.backToList', { date: label })} onClick={onBack}>
            <ChevronLeft aria-hidden />
            {label}
          </Button>
        </div>
        <ScrollFog use='overlayBody' className='min-h-0 flex-1'>
          <EventDetailBody event={detail} />
        </ScrollFog>
        {canEdit && (
          <div data-slot='day-panel-footer' className='flex shrink-0 items-center gap-x2 border-t border-stroke-neutral-subtle px-x5 pb-x4 pt-x3'>
            <Button variant='ghost' ghostColor='critical' size='small' className='mr-auto' onClick={() => onDelete?.(detail)}>
              {tc('delete')}
            </Button>
            <Button variant='neutralSolid' size='small' onClick={() => onEdit?.(detail)}>
              {tc('edit')}
            </Button>
          </div>
        )}
      </Card>
    )
  }

  const count = events.length
  return (
    <Card data-slot='day-panel' aria-label={label} className={cn('p-0', className)}>
      <div className='flex items-center justify-between gap-x2 pb-0 pl-x6 pr-x5 pt-x5'>
        <h2 className='m-0 flex min-w-0 items-center gap-x1_5 text-t5 font-bold text-fg-neutral'>
          <span className='min-w-0'>{label}</span>
          {isToday(date) && <i className='shrink-0 text-t2 font-bold not-italic text-fg-brand'>{t('panel.today')}</i>}
        </h2>
        {canAdd && (
          <Button variant='neutralOutline' size='small' onClick={onAdd} data-slot='day-panel-add'>
            <Plus aria-hidden />
            {t('panel.add')}
          </Button>
        )}
      </div>
      <p className='mb-x1 mt-x0_5 px-x6 text-t3 text-fg-neutral-subtle'>{loading ? <Skeleton text='t3' className='w-x16' /> : t('panel.count', { count })}</p>
      <div className='pb-x3'>
        {loading ? (
          <List aria-hidden>
            {[0, 1].map((i) => (
              <ListItem key={i} prefix={<Skeleton radius='full' className='h-x8 w-[3px]' />} title={<Skeleton text='t5' className='w-32 max-w-full' />} detail={<Skeleton text='t3' className='w-24 max-w-full' />} />
            ))}
          </List>
        ) : count === 0 && !holiday ? (
          <p data-slot='day-panel-empty' className='m-0 px-x6 py-x6 text-center text-t4 text-fg-neutral-subtle'>
            {t('noEvents')}
          </p>
        ) : (
          <DayEventList events={events} holiday={holiday} label={label} onTapEvent={(e) => onTapEvent(e)} />
        )}
      </div>
    </Card>
  )
}
