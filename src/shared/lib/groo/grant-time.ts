/** 하루 = 1, 한 시간 = 0.125(8시간 = 하루), 30분 = 0.0625 — 서버 grant_time 단위 */
export const HOUR = 0.125
export const HALF_HOUR = 0.0625
export const GRANT_MAX_DAYS = 365
export const GRANT_MAX_HOURS = 7

export interface GrantTimeParts {
  days: number
  hours: number
  /** 0 또는 30 */
  minutes: 0 | 30
}

/** 서버 값 → 일 · 시간 · 분. 시간 단위로 떨어지지 않는 나머지는 30분 단위로 올림 없이 버린다 */
export const splitGrantTime = (total: number): GrantTimeParts => {
  const days = Math.floor(total + 1e-9)
  const remainder = total - days
  const hours = Math.min(GRANT_MAX_HOURS, Math.floor(remainder / HOUR + 1e-9))
  const minutes = remainder - hours * HOUR >= HALF_HOUR - 1e-9 ? 30 : 0
  return { days, hours, minutes }
}

export const joinGrantTime = ({ days, hours, minutes }: GrantTimeParts): number => days + hours * HOUR + (minutes === 30 ? HALF_HOUR : 0)

