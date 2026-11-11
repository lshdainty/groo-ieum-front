import type { DeltaProps } from '@/shared/ds/card'
import { grantTimeText } from '@/shared/lib/groo/grant-time-text'
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

/** `t` 는 `vacation` 네임스페이스 · `language` 는 지금 언어. 휴가 시간 글은 숫자(서버 단위, 하루 = 1)로 쓴다 — 증감 글은 부호를 뗀 크기다 */
export const metricsOf = (data: GetUserVacationStatsResp, t: (key: string) => string, language: string): Metric[] => [
  { id: 'remain', label: t('history.remainVacation'), value: grantTimeText(data.remain_time, data.remain_time_str, language, t), delta: deltaOf(data.remain_time_gap, grantTimeText(Math.abs(data.remain_time_gap), data.remain_time_gap_str, language, t), t('history.sinceLastMonth')) },
  { id: 'used', label: t('history.usedVacation'), value: grantTimeText(data.used_time, data.used_time_str, language, t), delta: deltaOf(data.used_time_gap, grantTimeText(Math.abs(data.used_time_gap), data.used_time_gap_str, language, t), t('history.sinceLastMonth')) },
  { id: 'expect', label: t('history.expectedVacation'), value: grantTimeText(data.expect_used_time, data.expect_used_time_str, language, t) },
]
