import type { GetHolidaysResp } from '@/entities/holiday'

/** 날 숫자 · 공휴일 이름 글 색 — 일 · 공휴일(법정 · 대체) fg-critical, 토 · 그 밖 공휴일(ETC) fg-informative, 이웃 달은 fg-disabled (G 37) */
export const dayTone = (opts: { currentMonth: boolean; sunday: boolean; saturday: boolean; holiday?: GetHolidaysResp }): string => {
  if (!opts.currentMonth) return 'text-fg-disabled'
  if (opts.holiday) return opts.holiday.holiday_type === 'ETC' ? 'text-fg-informative' : 'text-fg-critical'
  if (opts.sunday) return 'text-fg-critical'
  if (opts.saturday) return 'text-fg-informative'
  return 'text-fg-neutral'
}
