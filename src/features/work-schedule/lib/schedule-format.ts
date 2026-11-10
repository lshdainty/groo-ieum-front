import type { GetUsersResp } from '@/entities/user'
import { formatWorkTime } from '@/shared/lib/work-time'

/** 시간축 — 7시 ~ 22시(지금 그대로) */
export const START_HOUR = 7
export const END_HOUR = 22
export const TOTAL_HOURS = END_HOUR - START_HOUR

/** 쉬는 시간 — 점심 12 ~ 13 · 저녁 18 ~ 19(지금 값 그대로) */
export const BREAK_TIMES = [
  { start: 12, end: 13 },
  { start: 18, end: 19 },
]

export interface WorkSpan {
  startHour: number
  endHour: number
}

/** 유연근무 "9 ~ 18" → 시 범위. 없거나 "-" 이거나 꼴이 다르면 null */
export const parseWorkSpan = (workTime: string | null | undefined): WorkSpan | null => {
  if (!workTime || workTime === '-') return null
  const m = /(\d+) ~ (\d+)/.exec(workTime)
  if (!m) return null
  return { startHour: parseInt(m[1], 10), endHour: parseInt(m[2], 10) }
}

/** 시축 위 위치(0 ~ 100%) */
export const positionPercent = (hour: number): number => ((hour - START_HOUR) / TOTAL_HOURS) * 100

/**
 * 근무 시간(분) — 근무 시간과 겹치는 첫 번째 쉬는 시간 하나만 뺀다(지금 셈 그대로, 둘 다 겹쳐도 하나만).
 */
export const workMinutes = (span: WorkSpan): number => {
  const workStart = span.startHour * 60
  const workEnd = span.endHour * 60
  let total = workEnd - workStart
  for (const b of BREAK_TIMES) {
    const bs = b.start * 60
    const be = b.end * 60
    if (workStart < be && workEnd > bs) {
      total -= Math.min(workEnd, be) - Math.max(workStart, bs)
      break
    }
  }
  return total
}

type T = (key: string, options?: Record<string, unknown>) => string

/** "8시간" · "7시간 30분" · 영어 "7 hours 30 minutes" — 시간 · 분을 각각 복수 처리 */
export const durationText = (totalMinutes: number, t: T): string => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (minutes === 0) return t('sch.hoursValue', { count: hours })
  if (hours === 0) return t('sch.minutesValue', { count: minutes })
  return `${t('sch.hoursValue', { count: hours })} ${t('sch.minutesValue', { count: minutes })}`
}

/** 막대 글 — "오전 9:00~오후 6:00 · 8시간"(근무 시간은 쉬는 시간을 뺀 값) */
export const barText = (workTime: string, span: WorkSpan, t: T): string =>
  t('sch.barText', { range: formatWorkTime(workTime), hours: durationText(workMinutes(span), t) })

export interface TimeGroup {
  /** 묶음 열쇠 — `user_work_time` 그대로(없으면 빈 글) */
  key: string
  span: WorkSpan | null
  users: GetUsersResp[]
}

/** 시간대 묶음(폰) — 같은 `user_work_time` 끼리, 시작이 이른 차례(시간 없는 사람은 맨 끝), 묶음 안은 이름 차례 */
export const groupByWorkTime = (users: GetUsersResp[]): TimeGroup[] => {
  const map = new Map<string, TimeGroup>()
  for (const u of users) {
    const span = parseWorkSpan(u.user_work_time)
    const key = span ? u.user_work_time : ''
    const g = map.get(key) ?? { key, span, users: [] }
    g.users.push(u)
    map.set(key, g)
  }
  const groups = [...map.values()]
  for (const g of groups) g.users.sort((a, b) => a.user_name.localeCompare(b.user_name, 'ko'))
  return groups.sort((a, b) => {
    if (!a.span) return 1
    if (!b.span) return -1
    return a.span.startHour - b.span.startHour || a.span.endHour - b.span.endHour
  })
}
