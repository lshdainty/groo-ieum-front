import { assignChartColors, type ChartColored } from '@/shared/ds/chart'
import { niceAxis } from '@/shared/lib/groo/chartAxis'
import { vacationTypeColor } from '@/entities/vacation'
import type { AvailableVacationByType, GetAvailableVacationsResp, GetUserMonthlyVacationStatsResp } from '@/entities/vacation'

export { formatUsedTime } from './vacation-time'

/** 그 달의 예정(오늘 뒤로 잡힌 휴가) — 서버가 나눠 주기 전 판이면 0 */
export const expectOf = (m: GetUserMonthlyVacationStatsResp): number => m.expect_used_time ?? 0

/** 쓴 휴가도 예정도 하나도 없으면 false — 부르는 쪽이 비어 있음을 그린다 */
export const hasMonthUsage = (data: readonly GetUserMonthlyVacationStatsResp[] | undefined): boolean =>
  !!data && data.some((m) => m.used_time > 0 || expectOf(m) > 0)

/**
 * 고른 해에 그릴 계열 — 쓴 휴가는 오늘까지, 예정은 오늘 뒤라 지난해는 쓴 휴가만 · 다음 해는 예정만 · 올해는 둘 다
 * (groo-design chart.md "미리 잡는 일정의 값은 예외" — "다음 해처럼 전부 앞날이면 예정 계열만 보입니다"). 해를 모르면 둘 다
 */
export const monthSeries = (year?: number, now: Date = new Date()): { used: boolean; scheduled: boolean } => {
  const current = now.getFullYear()
  if (year == null) return { used: true, scheduled: true }
  return { used: year <= current, scheduled: year >= current }
}

/**
 * 세로축 눈금 — 정수 일 단위, 간격은 1 · 2 · 5 × 10ⁿ 계열(groo-design chart.md "축 · 격자" — 3 · 4 · 6 일 간격을 쓰지 않는다).
 * 4 일까지는 하루 간격(0 ~ 4), 그보다 크면 돈 축과 같은 `niceAxis` 셈(0 포함 · 끝을 간격에 맞춰 올림)이다. `niceAxis` 는 1 보다
 * 작은 간격을 반올림해 눈금이 겹치므로(0 · 0 · 1 · 1) 하루보다 촘촘하게 나누지 않는다 — 반나절 값도 정수 눈금 사이에 그린다.
 *
 * [maxIntervals] — 세로 눈금 글이 겹치지 않고 들어가는 칸 수(ds `chartValueIntervals` — 그리는 높이 ÷ 눈금 글 줄 높이). 칸이 넘치면
 * 겨냥하는 칸 수를 하나씩 줄여 1 · 2 · 5 간격을 다시 센다(chart.md "세로 눈금이 겹치면 수를 줄입니다" — 담다 `niceValueAxis` 와 같은 셈).
 */
export const dayTicks = (max: number, maxIntervals = Infinity): number[] => {
  const top = Math.max(1, Math.ceil(max))
  const fits = (ticks: number[]) => ticks.length - 1 <= maxIntervals
  if (top <= 4) {
    const daily = Array.from({ length: top + 1 }, (_, i) => i)
    if (fits(daily)) return daily
  }
  // 하루 이상 · 고른 간격만(1 보다 작은 간격은 niceAxis 가 반올림해 겹친다)
  const whole = (ticks: number[]) =>
    ticks.length > 1 && ticks.every((v, i) => Number.isInteger(v) && (i === 0 || v - ticks[i - 1]! === ticks[1]! - ticks[0]!)) && ticks[1]! - ticks[0]! >= 1
  for (let target = 4; target > 1; target--) {
    const ticks = niceAxis(0, top, target).ticks
    if (whole(ticks) && fits(ticks)) return ticks
  }
  return niceAxis(0, top, 1).ticks
}

export type TypeSlice = ChartColored<AvailableVacationByType>

/** 도넛 조각 — 남은 시간이 0 보다 큰 유형만(0 인 유형은 조각 · 범례에서 뺀다). 색은 유형 표로 고정 */
export const typeSlices = (data: GetAvailableVacationsResp | undefined): TypeSlice[] =>
  assignChartColors(
    (data?.vacations ?? []).filter((v) => v.remain_time > 0),
    { colorOf: (v) => vacationTypeColor(v.vacation_type) },
  )
