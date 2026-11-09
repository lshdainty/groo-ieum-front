import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { useMonthBirthDuesQuery, useYearOperationDuesQuery } from '@/entities/dues'
import { SummaryMetrics, summaryMetricsOf } from '@/features/culture-dues/ui/DuesSummary'
import { SummarySkeleton } from '@/features/culture-dues/ui/DuesResults'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 회비 현황(D 27) — 올해 · 이번 달 지표 넷(홈에는 연도 고르기가 없다). 회비 화면의 회비 현황과 같은 부품 */
export const TotalDuesWidget = () => {
  const { t } = useTranslation('culture')
  const desktop = useDesktop()
  const now = dayjs()
  const operation = useYearOperationDuesQuery(now.year(), { quiet: true })
  const birth = useMonthBirthDuesQuery(now.year(), now.month() + 1, { quiet: true })
  const metrics = summaryMetricsOf(now.year(), now.month() + 1, operation.data, birth.data, t)

  return (
    <WidgetFrame id='total-dues' body={desktop ? 'content' : 'list'}>
      <WidgetBoundary id='total-dues' queries={[operation, birth]} fallback={<SummarySkeleton desktop={desktop} />}>
        <SummaryMetrics metrics={metrics} desktop={desktop} />
      </WidgetBoundary>
    </WidgetFrame>
  )
}
