/** 달력 날짜 하나 — 시각 · 타임존 없이 해 · 달 · 날 */
export interface CalendarDate {
  year: number
  /** 1 ~ 12 */
  month: number
  day: number
}

/**
 * [userClock] 회사 기준 오늘 — 서버가 날짜를 셀 때 쓰는 회사 타임존(`CompanyClock.zone()`, 로그인 확인의 `company_timezone`)으로
 * 지금(now)이 그 회사에서 몇 년 몇 월 며칠인지 센다(Intl). 휴가 차트처럼 서버가 회사 기준 오늘로 가른 값(쓴 · 예정)과 화면이 고르는 해가
 * 같은 시계여야 한다(groo-design chart.md "미리 잡는 일정의 값은 예외" — 같은 시계).
 * 타임존이 없거나(서버가 싣기 전 판) 브라우저가 모르는 값이면 브라우저 날짜로 센다.
 */
export function companyToday(timeZone?: string | null, now: Date = new Date()): CalendarDate {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now)
      const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value)
      const date = { year: part('year'), month: part('month'), day: part('day') }
      if (Number.isFinite(date.year) && Number.isFinite(date.month) && Number.isFinite(date.day)) return date
    } catch {
      // 알 수 없는 타임존(RangeError) — 아래 브라우저 날짜로
    }
  }
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
}
