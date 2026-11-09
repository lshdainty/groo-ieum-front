import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary'
import { useUser } from '@/entities/session'
import { MonthVacationStatsEmpty } from '@/features/vacation-history/ui/MonthVacationStatsEmpty'
import { hasMonthUsage } from '@/features/vacation-history/lib/vacation-chart'
import { MonthVacationStatsContent } from '@/features/vacation-history/ui/MonthVacationStatsContent'
import { MonthVacationStatsSkeleton } from '@/features/vacation-history/ui/MonthVacationStatsSkeleton'
import { useUserMonthlyVacationStatsQuery } from '@/entities/vacation'

export const MonthStatsWidget = () => {
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const currentYear = new Date().getFullYear().toString()

  const { data: monthStats, isLoading, error } = useUserMonthlyVacationStatsQuery(userId, currentYear)

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: monthStats }}
      loadingComponent={<MonthVacationStatsSkeleton />}
    >
      <div className="p-4">{hasMonthUsage(monthStats) ? <MonthVacationStatsContent data={monthStats!} year={Number(currentYear)} /> : <MonthVacationStatsEmpty />}</div>
    </QueryAsyncBoundary>
  )
}
