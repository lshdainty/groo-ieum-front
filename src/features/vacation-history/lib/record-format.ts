import dayjs from 'dayjs'

import { dsLanguage } from '@/shared/ds/i18n'
import { rangeSep } from '@/shared/lib/date-text'

/** 시작이 지금보다 뒤인 사용 기록 — 서버가 수정 · 삭제를 받는 때(시작 뒤는 거절). "지금" 은 브라우저 시계다 */
export const isUpcoming = (start: string, now: Date = new Date()): boolean => dayjs(start).valueOf() > now.getTime()

const monthDay = (d: dayjs.Dayjs, now: dayjs.Dayjs): string => {
  if (dsLanguage().startsWith('en')) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', ...(d.year() === now.year() ? {} : { year: 'numeric' }) }).format(d.toDate())
  }
  return `${d.year() === now.year() ? '' : `${d.year()}년 `}${d.month() + 1}월 ${d.date()}일`
}

/** 유효 기간 — "1월 1일 ~ 12월 31일", 올해가 아닌 쪽은 해를 붙인다 */
export const formatValidity = (grantDate: string, expiryDate: string, now: dayjs.Dayjs = dayjs()): string => {
  const g = dayjs(grantDate)
  const e = dayjs(expiryDate)
  if (!g.isValid() || !e.isValid()) return [grantDate, expiryDate].filter(Boolean).join(rangeSep())
  return `${monthDay(g, now)}${rangeSep()}${monthDay(e, now)}`
}

/** 줄 설명 조각을 " · " 로 잇는다 — 빈 조각은 뺀다 */
export const joinDetail = (...parts: (string | null | undefined)[]): string => parts.filter((p) => p && p.trim()).join(' · ')
