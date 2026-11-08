import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/shadcn/select'
import { useVacationContext } from '@/features/admin-vacation-approval/model/VacationContext'
import { UserInfoCardSkeleton } from '@/features/user-profile/ui/UserInfoCardSkeleton'
import { ApplicationTableSkeleton } from '@/features/vacation-application/ui/ApplicationTableSkeleton'
import { MonthVacationStatsCardSkeleton } from '@/features/vacation-history/ui/MonthVacationStatsCardSkeleton'
import { VacationHistoryTableSkeleton } from '@/features/vacation-history/ui/VacationHistoryTableSkeleton'
import { VacationStatsCardSkeleton } from '@/features/vacation-history/ui/VacationStatsCardSkeleton'
import { VacationTypeStatsCardSkeleton } from '@/features/vacation-history/ui/VacationTypeStatsCardSkeleton'
import { useTranslation } from 'react-i18next'

const getYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i.toString())
  }
  return years
}

const VacationContentSkeleton = () => {
  const { t } = useTranslation('vacation')
  const { selectedYear, setSelectedYear } = useVacationContext()

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
      <div className='grid grid-cols-1 gap-6 mt-6'>
        <ApplicationTableSkeleton />
      </div>
    </div>
  )
}

export { VacationContentSkeleton }
