/** 업무 시간 글 — "6시간" · "6시간 30분" · "30분". 소수("2.0시간")를 쓰지 않는다. 분은 반올림, 음수는 0 */
export const formatWorkHours = (
  hours: number,
  t: (key: 'workHistory.hours' | 'workHistory.minutes' | 'workHistory.hoursMinutes', options: { h?: number; m?: number }) => string,
): string => {
  const total = Math.max(0, Math.round(hours * 60))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0 && m > 0) return t('workHistory.hoursMinutes', { h, m })
  if (h > 0 || m === 0) return t('workHistory.hours', { h })
  return t('workHistory.minutes', { m })
}
