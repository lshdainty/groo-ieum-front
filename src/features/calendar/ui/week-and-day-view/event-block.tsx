import { differenceInMinutes, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/cn'
import { formatClockRange } from '@/shared/lib/date-text'
import { isAllDayEvent, personName, typeName } from '@/features/calendar/lib/event-text'
import { eventTone } from '@/features/calendar/lib/helpers'
import { useCanEditEvent } from '@/features/calendar/model/use-can-edit-event'
import { DraggableEvent } from '@/features/calendar/ui/dnd/draggable-event'

import type { IEvent } from '@/features/calendar/model/interfaces'

/** 주 보기 시간 막대 — 종류 색 옅은 바탕 + 글(칩과 같은 색 짝). 누르면 상세. 끌어서 다른 시각 · 날로 옮길 수 있다(지금 기능 그대로) */
export function EventBlock({ event, onClick }: { event: IEvent; onClick: (event: IEvent) => void }) {
  const { t } = useTranslation('calendar')
  const canEdit = useCanEditEvent()
  const start = parseISO(event.startDate)
  const end = parseISO(event.endDate)
  const durationInMinutes = differenceInMinutes(end, start)
  const heightInPixels = (durationInMinutes / 60) * 96 - 8
  const tone = eventTone(event)

  return (
    <DraggableEvent event={event} disabled={!canEdit(event)}>
      <div
        role='button'
        tabIndex={0}
        data-slot='week-event'
        className={cn(
          'flex cursor-pointer select-none flex-col gap-x0_5 overflow-hidden whitespace-nowrap rounded-sm px-x2 py-x1_5 text-t2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring',
          durationInMinutes < 35 && 'justify-center py-0'
        )}
        style={{ height: `${heightInPixels}px`, background: tone.bg, color: tone.fg }}
        onClick={() => onClick(event)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(event)
          }
        }}
      >
        <p className='m-0 truncate font-bold'>
          {personName(event, t)} · {typeName(event, t)}
        </p>
        {durationInMinutes > 25 && <p className='m-0 truncate'>{isAllDayEvent(event) ? t('allDay') : formatClockRange(event.startDate, event.endDate)}</p>}
      </div>
    </DraggableEvent>
  )
}
