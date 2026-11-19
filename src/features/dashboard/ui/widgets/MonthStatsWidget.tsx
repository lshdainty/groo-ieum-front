import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ChartLegendTiles } from '@/shared/ds/chart'
import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { useCompanyToday, useUser } from '@/entities/session'
import { useUserMonthlyVacationStatsQuery } from '@/entities/vacation'
import { hasMonthUsage } from '@/features/vacation-history/lib/vacation-chart'
import { MonthVacationStatsContent } from '@/features/vacation-history/ui/MonthVacationStatsContent'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 월별 휴가 통계(D 20) — 올해 쓴 휴가 막대. 쓴 휴가가 모두 0 이면 "올해 쓴 휴가가 없어요" */
export const MonthStatsWidget = () => {
  const { t } = useTranslation('dashboard')
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  // 올해 — 회사 기준 오늘의 해(서버가 쓴 · 예정을 가르는 오늘과 같은 시계, 브라우저 연도가 아니다)
  const year = useCompanyToday().year
  const query = useUserMonthlyVacationStatsQuery(userId, String(year), { quiet: true })

  return (
    <WidgetFrame id='month-stats'>
      <WidgetBoundary id='month-stats' queries={[query]} fallback={<MonthStatsSkeleton />}>
        {query.data && hasMonthUsage(query.data) ? (
          <MonthVacationStatsContent data={query.data} year={year} currentYear={year} />
        ) : (
          <ResultSection size='medium' icon={<BarChart3 />} title={t('widget.empty.monthStats.title')} />
        )}
      </WidgetBoundary>
    </WidgetFrame>
  )
}

/**
 * 지표 타일 + 차트 자리 — 타일은 실제 지표 타일(올해라 "쓴 휴가" · "예정")에 합계 글 줄만 스켈레톤(skeleton.md "틀은 먼저"),
 * 차트 그림은 글 없는 그림 자리라 높이 200 · 모서리 16 그대로
 */
export const MonthStatsSkeleton = () => {
  const { t } = useTranslation('vacation')
  const total = <Skeleton text='t5' className='w-[48px]' />
  return (
    <div aria-hidden inert className='flex flex-col gap-x2' data-month-stats-skeleton>
      <ChartLegendTiles
        items={[
          { key: 'used', label: t('history.usedVacation'), color: 'blue', total },
          { key: 'scheduled', label: t('history.chart.scheduled'), color: 'blue', total, marker: 'outline' },
        ]}
      />
      <Skeleton radius='16' className='block h-[200px] w-full' />
    </div>
  )
}
