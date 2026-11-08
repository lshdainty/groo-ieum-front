import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/shadcn/select'
import { useUser } from '@/entities/session'
import { VacationContentSkeleton } from '@/features/admin-vacation-approval/ui/VacationContentSkeleton'
import { useVacationContext } from '@/features/admin-vacation-approval/model/VacationContext'
import { UserInfoCard } from '@/features/user-profile/ui/UserInfoCard'
import { ApplicationTable } from '@/features/vacation-application/ui/ApplicationTable'
import { MonthVacationStatsCard } from '@/features/vacation-history/ui/MonthVacationStatsCard'
import { VacationHistoryTable } from '@/features/vacation-history/ui/VacationHistoryTable'
import { VacationStatsCard } from '@/features/vacation-history/ui/VacationStatsCard'
import { VacationTypeStatsCard } from '@/features/vacation-history/ui/VacationTypeStatsCard'
import { useGrantStatusTypesQuery } from '@/entities/type'
import { useUsersQuery } from '@/entities/user'
import {
  useAllVacationsByApproverQuery,
  useAvailableVacationsQuery,
  useUserMonthlyVacationStatsQuery,
  useUserRequestedVacationsQuery,
  useUserVacationHistoryQuery,
  useUserVacationStatsQuery
} from '@/entities/vacation'
import { type GetUsersResp } from '@/entities/user'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const getYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i.toString())
  }
  return years
}

interface VacationContentInnerProps {
  users: GetUsersResp[]
  loginUserId: string
}

const VacationContentInner = ({ users, loginUserId }: VacationContentInnerProps) => {
  const { t } = useTranslation('vacation')
  const { selectedUserId, setSelectedUserId, selectedYear, setSelectedYear } = useVacationContext()

  const { data: vacationTypes } = useAvailableVacationsQuery(
    selectedUserId,
    dayjs().year(parseInt(selectedYear)).format('YYYY-MM-DDT23:59:59')
  )
  const { data: monthStats } = useUserMonthlyVacationStatsQuery(
    selectedUserId,
    selectedYear
  )
  const { data: histories } = useUserVacationHistoryQuery(selectedUserId, parseInt(selectedYear))
  const { data: vacationStats } = useUserVacationStatsQuery(
    selectedUserId,
    dayjs().year(parseInt(selectedYear)).format('YYYY-MM-DDT23:59:59')
  )
  // 선택된 사용자의 신청 내역
  const { data: selectedUserRequests = [] } = useUserRequestedVacationsQuery(
    selectedUserId,
    parseInt(selectedYear)
  )
  // 로그인한 관리자가 승인권자인 내역 (선택 사용자와 무관)
  const { data: approvalRequests = [] } = useAllVacationsByApproverQuery(
    loginUserId,
    parseInt(selectedYear)
  )
  const { data: grantStatusTypes = [] } = useGrantStatusTypesQuery()

  return (
    <div className='p-4 min-[40rem]:p-6 min-[48rem]:p-8'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-3xl font-bold'>{t('stats.title')}</h1>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className='w-[120px]'>
            <SelectValue placeholder={t('stats.selectYear')} />
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
        <UserInfoCard
          value={users}
          selectedUserId={selectedUserId}
          onUserChange={setSelectedUserId}
        />
        <div className='flex flex-col gap-6 flex-1'>
          <VacationStatsCard
            value={vacationStats}
          />
          <MonthVacationStatsCard
            value={monthStats || []}
            className='h-full'
          />
        </div>
      </div>
      <div className='grid grid-cols-1 min-[80rem]:grid-cols-3 gap-6 mt-6'>
        <div className='min-[80rem]:col-span-1 flex flex-col'>
          <VacationTypeStatsCard
            value={vacationTypes}
            className='h-full'
          />
        </div>
        <div className='min-[80rem]:col-span-2 flex flex-col'>
          <VacationHistoryTable
            value={histories || { grants: [], usages: [] }}
            canAdd={true}
          />
        </div>
      </div>
      <div className='grid grid-cols-1 gap-6 mt-6'>
        <ApplicationTable
          vacationRequests={selectedUserRequests}
          approvalRequests={approvalRequests}
          grantStatusTypes={grantStatusTypes}
          showGrantButton={true}
          showCancelButton={false}
          showApprovalTab={true}
        />
      </div>
    </div>
  )
}

const VacationContent = () => {
  const { loginUser } = useUser()
  const { selectedUserId, setSelectedUserId } = useVacationContext()

  const { data: users, isLoading, error } = useUsersQuery()

  useEffect(() => {
    if (loginUser && !selectedUserId) {
      setSelectedUserId(loginUser.user_id)
    }
  }, [loginUser, selectedUserId, setSelectedUserId])

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: users }}
      loadingComponent={<VacationContentSkeleton />}
    >
      <VacationContentInner users={users || []} loginUserId={loginUser?.user_id || ''} />
    </QueryAsyncBoundary>
  )
}

export { VacationContent }
