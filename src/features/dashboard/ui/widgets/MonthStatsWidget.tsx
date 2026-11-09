import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { useUser } from '@/entities/session'
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
  const year = new Date().getFullYear()
  const query = useUserMonthlyVacationStatsQuery(userId, String(year), { quiet: true })

  return (
    <WidgetFrame id='month-stats'>
      <WidgetBoundary id='month-stats' queries={[query]} fallback={<MonthStatsSkeleton />}>
        {query.data && hasMonthUsage(query.data) ? (
          <MonthVacationStatsContent data={query.data} year={year} />
        ) : (
          <ResultSection size='medium' icon={<BarChart3 />} title={t('widget.empty.monthStats.title')} />
        )}
      </WidgetBoundary>
    </WidgetFrame>
  )
}

/** 타일 + 차트 자리(모서리 16) */
const MonthStatsSkeleton = () => (
  <div className='flex flex-col gap-x2'>
    <Skeleton radius='12' className='block h-[56px] w-full' />
    <Skeleton radius='16' className='block h-[200px] w-full' />
  </div>
)
