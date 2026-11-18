import { assignChartColors, type ChartColored } from '@/shared/ds/chart'
import { niceAxis } from '@/shared/lib/groo/chartAxis'
import { vacationTypeColor } from '@/entities/vacation'
import type { AvailableVacationByType, GetAvailableVacationsResp, GetUserMonthlyVacationStatsResp } from '@/entities/vacation'

export { formatUsedTime } from './vacation-time'

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

/**
 * 세로축 눈금 — 정수 일 단위, 간격은 1 · 2 · 5 × 10ⁿ 계열(groo-design chart.md "축 · 격자" — 3 · 4 · 6 일 간격을 쓰지 않는다).
 * 4 일까지는 하루 간격(0 ~ 4), 그보다 크면 돈 축과 같은 `niceAxis` 셈(0 포함 · 끝을 간격에 맞춰 올림)이다. `niceAxis` 는 1 보다
 * 작은 간격을 반올림해 눈금이 겹치므로(0 · 0 · 1 · 1) 하루보다 촘촘하게 나누지 않는다 — 반나절 값도 정수 눈금 사이에 그린다.
 */
export const dayTicks = (max: number): number[] => {
  const top = Math.max(1, Math.ceil(max))
  if (top <= 4) return Array.from({ length: top + 1 }, (_, i) => i)
  return niceAxis(0, top).ticks
}

export type TypeSlice = ChartColored<AvailableVacationByType>

/** 도넛 조각 — 남은 시간이 0 보다 큰 유형만(0 인 유형은 조각 · 범례에서 뺀다). 색은 유형 표로 고정 */
export const typeSlices = (data: GetAvailableVacationsResp | undefined): TypeSlice[] =>
  assignChartColors(
    (data?.vacations ?? []).filter((v) => v.remain_time > 0),
    { colorOf: (v) => vacationTypeColor(v.vacation_type) },
  )
