import dayjs from 'dayjs'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import { CardStat } from '@/shared/ds/card'
import { dsMoney } from '@/shared/ds/i18n'
import { List, ListItem } from '@/shared/ds/list'
import { LoadingRegion } from '@/shared/ds/skeleton'
import { useMonthBirthDuesQuery, useYearOperationDuesQuery } from '@/entities/dues'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { isThisYear, balanceMoney } from '../lib/dues-format'
import { DuesFailure, SummarySkeleton } from './DuesResults'
import { DuesSection } from './DuesSection'

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

/** 지표 넷의 모양 — 데스크톱은 한 카드 안 넷 나란히(칸 사이 1px), 폰은 키-값 List 줄 넷. 회비 화면과 홈 위젯이 같이 쓴다 */
export const SummaryMetrics = ({ metrics, desktop }: { metrics: SummaryMetric[]; desktop: boolean }) =>
  desktop ? (
    <div className='grid grid-cols-4 divide-x divide-stroke-neutral-subtle'>
      {metrics.map((m) => (
        <div key={m.id} className='min-w-0 px-x5 first:pl-0 last:pr-0' data-metric={m.id}>
          <CardStat size='small' label={m.label} value={m.value} />
          <p className='m-0 mt-x1 text-t3 font-normal text-fg-neutral-subtle'>{m.description}</p>
        </div>
      ))}
    </div>
  ) : (
    <List data-metric-list>
      {metrics.map((m) => (
        <ListItem
          key={m.id}
          data-metric={m.id}
          title={m.label}
          detail={m.description}
          suffix={<span className='text-t5 font-bold tabular-nums text-fg-neutral'>{m.value}</span>}
          suffixText
        />
      ))}
    </List>
  )

/**
 * 회비 현황(E 38) — 지표 넷. 읽기 둘(운영비 합계 · 이번 달 생일비) 중 하나라도 실패하면 이 구역만 실패로 그린다.
 */
export const DuesSummary = ({ year, month, leading }: { year: number; month: number; leading?: React.ReactNode }) => {
  const { t } = useTranslation('culture')
  const desktop = useDesktop()
  const operation = useYearOperationDuesQuery(year, { quiet: true })
  const birth = useMonthBirthDuesQuery(year, month, { quiet: true })
  const pending = operation.isPending || birth.isPending
  const failed = operation.isLoadingError || birth.isLoadingError
  const retry = () => {
    if (operation.isLoadingError) void operation.refetch()
    if (birth.isLoadingError) void birth.refetch()
  }
  const metrics = summaryMetricsOf(year, month, operation.data, birth.data, t)

  return (
    <DuesSection title={t('dues.summaryTitle')} leading={leading} body={desktop ? 'content' : 'list'}>
      <LoadingRegion
        pending={pending}
        failed={failed}
        fallback={<SummarySkeleton desktop={desktop} />}
        failure={<DuesFailure title={t('dues.failure.summary')} onRetry={retry} retrying={operation.isFetching || birth.isFetching} />}
      >
        <SummaryMetrics metrics={metrics} desktop={desktop} />
      </LoadingRegion>
    </DuesSection>
  )
}
