import { assignChartColors, type ChartColored } from '@/shared/ds/chart'
import { vacationTypeColor } from '@/entities/vacation'
import type { AvailableVacationByType, GetAvailableVacationsResp, GetUserMonthlyVacationStatsResp } from '@/entities/vacation'

/** 하루 = 8시간(서버 휴가 시간 환산과 같다 — 1.75 = 1일 6시간) */
const HOURS_PER_DAY = 8

/** 쓴 휴가의 합계 글 — "7일 6시간" · "6시간" · "3일" · 0 이면 "0일" */
export const formatUsedTime = (days: number, unit: { day: string; hour: string } = { day: '일', hour: '시간' }): string => {
  const total = Math.round(Math.max(0, days) * HOURS_PER_DAY)
  const d = Math.floor(total / HOURS_PER_DAY)
  const h = total % HOURS_PER_DAY
  if (d === 0 && h === 0) return `0${unit.day}`
  return [d > 0 ? `${d}${unit.day}` : '', h > 0 ? `${h}${unit.hour}` : ''].filter(Boolean).join(' ')
}

/** 월별 막대 — 고른 해가 올해면 이번 달에서 끝난다(지나지 않은 달을 0 막대로 그리지 않는다). 지난 해 · 해를 모르면 열두 달 */
export const monthBars = (
  data: readonly GetUserMonthlyVacationStatsResp[] | undefined,
  year?: number,
  now: Date = new Date(),
): GetUserMonthlyVacationStatsResp[] => {
  const last = year != null && year === now.getFullYear() ? now.getMonth() + 1 : 12
  return (data ?? []).filter((m) => m.month <= last)
}

export const hasMonthUsage = (data: readonly GetUserMonthlyVacationStatsResp[] | undefined): boolean =>
  !!data && data.some((m) => m.used_time > 0)

/** 세로축 눈금 — 정수 일 단위. 값이 크면 간격을 키워 눈금이 다섯을 넘지 않게 */
export const dayTicks = (max: number): number[] => {
  const top = Math.max(1, Math.ceil(max))
  const step = Math.max(1, Math.ceil(top / 4))
  const ticks: number[] = []
  for (let v = 0; v < top + step; v += step) {
    ticks.push(v)
    if (v >= top) break
  }
  return ticks
}

export type TypeSlice = ChartColored<AvailableVacationByType>

/** 도넛 조각 — 남은 시간이 0 보다 큰 유형만(0 인 유형은 조각 · 범례에서 뺀다). 색은 유형 표로 고정 */
export const typeSlices = (data: GetAvailableVacationsResp | undefined): TypeSlice[] =>
  assignChartColors(
    (data?.vacations ?? []).filter((v) => v.remain_time > 0),
    { colorOf: (v) => vacationTypeColor(v.vacation_type) },
  )
