/** 유연근무시간 "9 ~ 6" → "09:00 ~ 18:00"(저녁 시각은 12 를 더한다) — 형식이 다르면 받은 글 그대로 */
export const formatWorkTime = (time: string | undefined): string => {
  if (!time) return ''
  const parts = time.split(' ~ ')
  if (parts.length !== 2) return time
  const [start, end] = parts.map((p) => p.trim())
  const formattedStart = `${start.padStart(2, '0')}:00`
  const endHour = parseInt(end, 10)
  const formattedEndHour = endHour < 12 ? endHour + 12 : endHour
  return `${formattedStart} ~ ${formattedEndHour}:00`
}

/** 생년월일 "1990-04-12" → [1990, 4, 12] — 달 · 일 앞 0 을 떼어 날짜 글 규칙을 따른다. 형식이 다르면 null */
export const parseBirth = (birth: string | undefined): { year: number; month: number; day: number } | null => {
  if (!birth) return null
  const parts = birth.split('-')
  if (parts.length !== 3) return null
  const [year, month, day] = parts.map((p) => parseInt(p, 10))
  return Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) ? { year, month, day } : null
}
