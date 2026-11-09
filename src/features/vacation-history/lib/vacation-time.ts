/** 하루 = 8시간(서버 휴가 시간 환산과 같다 — 1.75 = 1일 6시간 · 0.0625 = 30분) */
const HOURS_PER_DAY = 8

export interface TimeUnits {
  day: string
  hour: string
  minute: string
}

/**
 * 쓴 휴가의 합계 글 — 분 단위까지 센다. "{d}일 {h}시간 {m}분", 0 인 칸은 생략하고 모두 0 이면 "0일"(업무이력 "{h}시간 {m}분" 과 같은 꼴).
 * 시간 단위로 반올림하지 않는다(30분 휴가가 "1시간" 이 되지 않게).
 */
export const formatUsedTime = (days: number, unit: TimeUnits = { day: '일', hour: '시간', minute: '분' }): string => {
  const minutes = Math.round(Math.max(0, days) * HOURS_PER_DAY * 60)
  const perDay = HOURS_PER_DAY * 60
  const d = Math.floor(minutes / perDay)
  const h = Math.floor((minutes % perDay) / 60)
  const m = minutes % 60
  if (d === 0 && h === 0 && m === 0) return `0${unit.day}`
  return [d > 0 ? `${d}${unit.day}` : '', h > 0 ? `${h}${unit.hour}` : '', m > 0 ? `${m}${unit.minute}` : ''].filter(Boolean).join(' ')
}
