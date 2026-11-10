import { CalendarDays, Layers, Text, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { List, ListItem } from '@/shared/ds/list'
import { useVacationTypesQuery } from '@/entities/type'
import { eventDateTimeText, typeName } from '@/features/calendar/lib/event-text'
import { eventTone } from '@/features/calendar/lib/helpers'
import type { IEvent } from '@/features/calendar/model/interfaces'

const ROW_ICON = 'size-[22px]'

/**
 * 일정 상세 본문(G 40) — 줄(아이콘 22 + 값): 사람(Avatar 24 + 이름) · 종류(색 점 + 이름 — 휴가는 "{시간 종류} · {쓸 휴가 종류}") · 날짜 · 시각 · 내용(줄바꿈 전부).
 * 남의 휴가는 서버가 내용(사유)을 비워 주므로 내용 줄을 두지 않는다. 가장자리까지 닿는 상자 안에 둔다(줄이 끝까지 눌린다).
 * 바닥 [삭제][수정]은 표면이 그린다.
 */
export function EventDetailBody({ event }: { event: IEvent }) {
  const { t } = useTranslation('calendar')
  const vacationTypes = useVacationTypesQuery({ quiet: true })
  const tone = eventTone(event)
  const usedName = event.kind === 'vacation' && event.vacationType ? (vacationTypes.data?.find((v) => v.code === event.vacationType)?.name ?? null) : null
  const kindText = usedName ? t('detail.vacationValue', { time: typeName(event, t), used: usedName }) : typeName(event, t)

  return (
    <List aria-label={t('eventDetail')} data-slot='event-detail'>
      <ListItem
        data-detail='user'
        prefix={<User className={ROW_ICON} />}
        title={t('detail.user')}
        suffixText
        suffix={
          <span className='inline-flex items-center gap-x2'>
            <Avatar name={event.user.name} src={event.user.picturePath ?? undefined} size={24} />
            {event.user.name}
          </span>
        }
      />
      <ListItem
        data-detail='kind'
        prefix={<Layers className={ROW_ICON} />}
        title={t('detail.kind')}
        suffixText
        suffix={
          <span className='inline-flex items-center gap-x2'>
            <span aria-hidden className='size-x2 shrink-0 rounded-full' style={{ background: tone.color }} />
            {kindText}
          </span>
        }
      />
      <ListItem data-detail='when' prefix={<CalendarDays className={ROW_ICON} />} title={t('detail.when')} suffixText suffix={<span className='[overflow-wrap:break-word]'>{eventDateTimeText(event)}</span>} />
      {event.description.trim() !== '' && (
        <ListItem
          data-detail='content'
          prefix={<Text className={ROW_ICON} />}
          title={t('detail.content')}
          suffixText
          suffix={<span className='whitespace-pre-wrap [overflow-wrap:break-word]'>{event.description}</span>}
        />
      )}
    </List>
  )
}
