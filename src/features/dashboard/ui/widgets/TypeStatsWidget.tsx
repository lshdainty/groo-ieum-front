import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary'
import { useUser } from '@/entities/session'
import { VacationTypeStatsContent } from '@/features/vacation-history/ui/VacationTypeStatsContent'
import { VacationTypeStatsEmpty } from '@/features/vacation-history/ui/VacationTypeStatsEmpty'
import { VacationTypeStatsSkeleton } from '@/features/vacation-history/ui/VacationTypeStatsSkeleton'
import { useAvailableVacationsQuery } from '@/entities/vacation'
import dayjs from 'dayjs'

export const TypeStatsWidget = () => {
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const todayWithTime = dayjs().format('YYYY-MM-DDT23:59:59')

  const { data: vacationTypes, isLoading, error } = useAvailableVacationsQuery(userId, todayWithTime)

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: vacationTypes }}
      loadingComponent={<VacationTypeStatsSkeleton />}
      emptyComponent={<VacationTypeStatsEmpty className="h-full" />}
      isEmpty={(data) => !data || !data.vacations || data.vacations.length === 0}
    >
      <div className='h-full w-full p-4'>
        <VacationTypeStatsContent data={vacationTypes!} />
      </div>
    </QueryAsyncBoundary>
  )
}
