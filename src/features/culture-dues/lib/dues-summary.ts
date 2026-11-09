import dayjs from 'dayjs'
import type { TFunction } from 'i18next'

import { dsMoney } from '@/shared/ds/i18n'
import { isThisYear, balanceMoney } from './dues-format'

export type SummaryMetric = { id: string; label: string; value: string; description: string }

/** 회비 현황의 지표 넷 — 고른 해가 올해면 설명에 "올해", 아니면 "{yyyy}년"(서버는 고른 해의 입출금 차액만 더한다 — 이월 없음) */
export const summaryMetricsOf = (
  year: number,
  month: number,
  operation: { total_dues?: number; total_deposit?: number; total_withdrawal?: number } | undefined,
  birth: { birth_month_dues?: number } | undefined,
  t: TFunction<'culture'>,
): SummaryMetric[] => {
  const period = isThisYear(year, dayjs()) ? t('dues.period.this') : t('dues.period.year', { year })
  return [
    { id: 'total', label: t('dues.totalOperationFee'), value: balanceMoney(operation?.total_dues ?? 0), description: t('dues.summary.totalDesc', { period }) },
    { id: 'deposit', label: t('dues.operationDeposit'), value: dsMoney(operation?.total_deposit ?? 0), description: t('dues.summary.depositDesc', { period }) },
    { id: 'withdrawal', label: t('dues.operationWithdrawal'), value: dsMoney(Math.abs(operation?.total_withdrawal ?? 0)), description: t('dues.summary.withdrawalDesc', { period }) },
    { id: 'birth', label: t('dues.monthBirthFee', { month }), value: dsMoney(birth?.birth_month_dues ?? 0), description: t('dues.summary.birthDesc', { period, month }) },
  ]
}

