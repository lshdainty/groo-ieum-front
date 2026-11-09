import dayjs from 'dayjs'
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

type Metric = { id: string; label: string; value: string; description: string }

/**
 * 회비 현황(E 38) — 지표 넷. 데스크톱은 한 카드 안 넷 나란히(칸 사이 1px), 폰은 키-값 줄 넷.
 * 설명 글의 {해} 는 고른 해가 올해면 "올해", 아니면 "{yyyy}년"(서버는 고른 해의 입출금 차액만 더한다 — 이월 없음).
 * 읽기 둘(운영비 합계 · 이번 달 생일비) 중 하나라도 실패하면 이 구역만 실패로 그린다.
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

  const period = isThisYear(year, dayjs()) ? t('dues.period.this') : t('dues.period.year', { year })
  const metrics: Metric[] = [
    { id: 'total', label: t('dues.totalOperationFee'), value: balanceMoney(operation.data?.total_dues ?? 0), description: t('dues.summary.totalDesc', { period }) },
    { id: 'deposit', label: t('dues.operationDeposit'), value: dsMoney(operation.data?.total_deposit ?? 0), description: t('dues.summary.depositDesc', { period }) },
    { id: 'withdrawal', label: t('dues.operationWithdrawal'), value: dsMoney(Math.abs(operation.data?.total_withdrawal ?? 0)), description: t('dues.summary.withdrawalDesc', { period }) },
    { id: 'birth', label: t('dues.monthBirthFee', { month }), value: dsMoney(birth.data?.birth_month_dues ?? 0), description: t('dues.summary.birthDesc', { period, month }) },
  ]

  return (
    <DuesSection title={t('dues.summaryTitle')} leading={leading} body={desktop ? 'content' : 'list'}>
      <LoadingRegion
        pending={pending}
        failed={failed}
        fallback={<SummarySkeleton desktop={desktop} />}
        failure={<DuesFailure title={t('dues.failure.summary')} onRetry={retry} retrying={operation.isFetching || birth.isFetching} />}
      >
        {desktop ? (
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
        )}
      </LoadingRegion>
    </DuesSection>
  )
}
