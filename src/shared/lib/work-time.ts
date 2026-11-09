import { formatHourRange } from '@/shared/lib/date-text'

/** 유연근무 선택지 — 서버가 주고받는 값("9 ~ 18")이다. 화면 글은 formatWorkTime 으로 */
export const WORK_TIME_VALUES = ['8 ~ 17', '9 ~ 18', '10 ~ 19', '13 ~ 21'] as const

/** "9 ~ 18" → "오전 9:00 ~ 오후 6:00" — 색 배지 대신 글(DESIGN.hr Badge "근무 시간은 글"), 시각은 12시간 */
export const formatWorkTime = (value: string): string => {
  const m = /^\s*(\d{1,2})\s*~\s*(\d{1,2})\s*$/.exec(value)
  if (!m) return value
  return formatHourRange(Number(m[1]), Number(m[2]))
}
