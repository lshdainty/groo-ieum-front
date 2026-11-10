import { formatWorkTime as formatWorkTimeText } from '@/shared/lib/work-time'

/** 유연근무시간 "9 ~ 18" → "오전 9:00 ~ 오후 6:00"(12시간) — 비었으면 빈 글, 형식이 다르면 받은 글 그대로 */
export const formatWorkTime = (time: string | undefined): string => (time ? formatWorkTimeText(time) : '')

/** 생년월일 "1990-04-12" → [1990, 4, 12] — 달 · 일 앞 0 을 떼어 날짜 글 규칙을 따른다. 형식이 다르면 null */
export const parseBirth = (birth: string | undefined): { year: number; month: number; day: number } | null => {
  if (!birth) return null
  const parts = birth.split('-')
  if (parts.length !== 3) return null
  const [year, month, day] = parts.map((p) => parseInt(p, 10))
  return Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) ? { year, month, day } : null
}
