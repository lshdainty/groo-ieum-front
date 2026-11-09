/** 유연근무 선택지 — 서버가 주고받는 값("9 ~ 18")이다. 화면 글은 formatWorkTime 으로 */
export const WORK_TIME_VALUES = ['8 ~ 17', '9 ~ 18', '10 ~ 19', '13 ~ 21'] as const

/** "9 ~ 18" → "09:00 ~ 18:00" — 색 배지 대신 글(DESIGN.hr Badge "근무 시간은 글") */
export const formatWorkTime = (value: string): string => {
  const m = /^\s*(\d{1,2})\s*~\s*(\d{1,2})\s*$/.exec(value)
  if (!m) return value
  const pad = (n: string) => n.padStart(2, '0')
  return `${pad(m[1])}:00 ~ ${pad(m[2])}:00`
}
