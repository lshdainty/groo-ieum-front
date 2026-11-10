import type { DeltaProps } from '@/shared/ds/card'
import type { GetUserVacationStatsResp } from '@/entities/vacation/model/types'

export interface Metric {
  id: 'remain' | 'used' | 'expect'
  label: string
  value: string
  delta?: DeltaProps
}

/** 증감 — 방향은 숫자의 부호, 글은 서버 글에서 앞 부호를 뗀 값(부호 + 낱말이 겹치지 않는다). 0 · 없음이면 줄이 없다 */
export const deltaOf = (gap: number | null | undefined, gapStr: string | undefined, text: string): DeltaProps | undefined =>
  gap == null || gap === 0 || !gapStr ? undefined : { direction: gap > 0 ? 'up' : 'down', value: gapStr, text }

export const metricsOf = (data: GetUserVacationStatsResp, t: (key: string) => string): Metric[] => [
  { id: 'remain', label: t('history.remainVacation'), value: data.remain_time_str, delta: deltaOf(data.remain_time_gap, data.remain_time_gap_str, t('history.sinceLastMonth')) },
  { id: 'used', label: t('history.usedVacation'), value: data.used_time_str, delta: deltaOf(data.used_time_gap, data.used_time_gap_str, t('history.sinceLastMonth')) },
  { id: 'expect', label: t('history.expectedVacation'), value: data.expect_used_time_str },
]
