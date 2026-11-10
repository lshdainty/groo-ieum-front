import dayjs from 'dayjs'
import type { TFunction } from 'i18next'

import { formatClockRange, formatDayText, formatPeriodText, isAllDay } from '@/shared/lib/date-text'
import type { IEvent } from '@/features/calendar/model/interfaces'

/** 종류 이름 — 우리 종류 표의 글(언어를 따른다). 모르는 종류는 서버가 준 이름 */
export const typeName = (event: Pick<IEvent, 'type' | 'title'>, t: TFunction): string => (event.type.nameKey ? t(event.type.nameKey) : event.title)

/** 칩 · 줄 제목에 쓰는 사람 이름 — 생일파티는 사람이 아니라 행사라 종류 이름을 쓴다 */
export const personName = (event: IEvent, t: TFunction): string => (event.type.id === 'BIRTHPARTY' ? typeName(event, t) : event.user.name)

/** 종일 — 시작이 0:00 이고 끝이 0:00 또는 그날의 끝(23:59). 서버가 종일 종류를 00:00:00 ~ 23:59:59 로 둔다 */
export const isAllDayEvent = (event: Pick<IEvent, 'startDate' | 'endDate'>): boolean => isAllDay(event.startDate, event.endDate)

/**
 * 시각 글 — 같은 날 종일 "종일" · 같은 날 시각 "오전 9:00 ~ 오후 1:00" · 여러 날은 기간 글(날짜 · 시각, 구간 기호 붙여 쓰기).
 * 12시간 · 영어 AM/PM 은 `shared/lib/date-text` 가 맡는다.
 */
export const eventWhenText = (event: Pick<IEvent, 'startDate' | 'endDate'>, t: TFunction): string => {
  const same = dayjs(event.startDate).isSame(event.endDate, 'day')
  if (same) return isAllDayEvent(event) ? t('allDay') : formatClockRange(event.startDate, event.endDate)
  return formatPeriodText(event.startDate, event.endDate)
}

/** 날짜 · 시각 줄 — 같은 날은 "10월 23일 (금) 오전 9:00~오후 1:00", 여러 날은 기간 글 */
export const eventDateTimeText = (event: Pick<IEvent, 'startDate' | 'endDate'>): string => formatPeriodText(event.startDate, event.endDate)

/** 날 글 "10월 23일 (금)" */
export const dayLabel = (date: Date): string => formatDayText(date)

/** 일정 줄 설명 — "{종류} · {시각}"(휴가 종류가 있으면 종류만 · 시각은 같은 날 줄에서) */
export const eventLineDetail = (event: IEvent, t: TFunction): string => [typeName(event, t), eventWhenText(event, t)].join(' · ')
