import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/shadcn/select'
import { useUser } from '@/entities/session'
import { UserInfoCard } from '@/features/user-profile/ui/UserInfoCard'
import { UserInfoCardSkeleton } from '@/features/user-profile/ui/UserInfoCardSkeleton'
import { MonthVacationStatsCard } from '@/features/vacation-history/ui/MonthVacationStatsCard'
import { MonthVacationStatsCardSkeleton } from '@/features/vacation-history/ui/MonthVacationStatsCardSkeleton'
import { VacationHistoryTable } from '@/features/vacation-history/ui/VacationHistoryTable'
import { VacationHistoryTableSkeleton } from '@/features/vacation-history/ui/VacationHistoryTableSkeleton'
import { VacationStatsCard } from '@/features/vacation-history/ui/VacationStatsCard'
import { VacationStatsCardSkeleton } from '@/features/vacation-history/ui/VacationStatsCardSkeleton'
import { VacationTypeStatsCard } from '@/features/vacation-history/ui/VacationTypeStatsCard'
import { VacationTypeStatsCardSkeleton } from '@/features/vacation-history/ui/VacationTypeStatsCardSkeleton'
import { useHistoryContext } from '@/features/vacation-history/model/HistoryContext'
import { useUserQuery } from '@/entities/user'
import {
  useAvailableVacationsQuery,
  useUserMonthlyVacationStatsQuery,
  useUserVacationHistoryQuery,
  useUserVacationStatsQuery
} from '@/entities/vacation'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

interface HistoryContentProps {
  user: any
  vacationStats: any
  monthStats: any
  vacationTypes: any
  histories: any
  selectedYear: string
  onYearChange: (year: string) => void
}

const getYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i.toString())
  }
  return years
}

const HistoryContentLayout = ({
  user,
  vacationStats,
  monthStats,
  vacationTypes,
  histories,
  selectedYear,
  onYearChange
}: HistoryContentProps) => {
  const { t } = useTranslation('vacation')

  return (
    <div className='p-4 min-[40rem]:p-6 md:p-8'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-3xl font-bold'>{t('history.pageTitle')}</h1>
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className='w-[120px]'>
            <SelectValue placeholder={t('history.selectYear')} />
          </SelectTrigger>
          <SelectContent>
            {getYearOptions().map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='flex flex-col min-[64rem]:flex-row gap-6'>
        {user && <UserInfoCard value={[user]} />}
        <div className='flex flex-col gap-6 flex-1'>
          <VacationStatsCard value={vacationStats} />
          <MonthVacationStatsCard value={monthStats || []} className='h-full' />
        </div>
      </div>
      <div className='grid grid-cols-1 min-[80rem]:grid-cols-3 gap-6 mt-6'>
        <div className='min-[80rem]:col-span-1 flex flex-col'>
          <VacationTypeStatsCard value={vacationTypes || []} className='h-full' />
        </div>
        <div className='min-[80rem]:col-span-2 flex flex-col'>
          <VacationHistoryTable value={histories || { grants: [], usages: [] }} canAdd={false} />
        </div>
      </div>
    </div>
  )
}

const HistorySkeleton = ({ title }: { title: string }) => {
  return (
    <div className='p-4 min-[40rem]:p-6 md:p-8'>
      <h1 className='text-3xl font-bold mb-6'>{title}</h1>
      <div className='flex flex-col min-[64rem]:flex-row gap-6'>
        <UserInfoCardSkeleton />
        <div className='flex flex-col gap-6 flex-1'>
          <VacationStatsCardSkeleton />
          <MonthVacationStatsCardSkeleton />
        </div>
      </div>
      <div className='grid grid-cols-1 min-[80rem]:grid-cols-3 gap-6 mt-6'>
        <div className='min-[80rem]:col-span-1 flex flex-col'>
          <VacationTypeStatsCardSkeleton />
        </div>
        <div className='min-[80rem]:col-span-2 flex flex-col'>
          <VacationHistoryTableSkeleton />
        </div>
      </div>
    </div>
  )
}

const HistoryContent = () => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const { loginUser } = useUser()
  const { selectedYear, setSelectedYear } = useHistoryContext()
  const user_id = loginUser?.user_id || ''

  const { data: user, isLoading: userLoading, error: userError } = useUserQuery(user_id)
  const { data: vacationTypes, isLoading: vacationTypesLoading, error: vacationTypesError } = useAvailableVacationsQuery(
    user_id,
    dayjs().year(parseInt(selectedYear)).format('YYYY-MM-DDT23:59:59')
  )
  const { data: monthStats, isLoading: monthStatsLoading, error: monthStatsError } = useUserMonthlyVacationStatsQuery(
    user_id,
    selectedYear
  )
  const { data: histories, isLoading: historiesLoading, error: historiesError } = useUserVacationHistoryQuery(user_id, parseInt(selectedYear))
  const { data: vacationStats, isLoading: vacationStatsLoading, error: vacationStatsError } = useUserVacationStatsQuery(
    user_id,
    dayjs().year(parseInt(selectedYear)).format('YYYY-MM-DDT23:59:59')
  )

  const isLoading = userLoading || vacationTypesLoading || monthStatsLoading || historiesLoading || vacationStatsLoading
  const error = userError || vacationTypesError || monthStatsError || historiesError || vacationStatsError

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: user }}
      loadingComponent={<HistorySkeleton title={t('history.pageTitle')} />}
      errorComponent={
        <div className='p-4 min-[40rem]:p-6 md:p-8'>
          <div className='p-8 text-center text-red-600'>
            {tc('loadFailed')}
          </div>
        </div>
      }
    >
      <HistoryContentLayout
        user={user}
        vacationStats={vacationStats}
        monthStats={monthStats}
        vacationTypes={vacationTypes}
        histories={histories}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
    </QueryAsyncBoundary>
  )
}

export { HistoryContent }
