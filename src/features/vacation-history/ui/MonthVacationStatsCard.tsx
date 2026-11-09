import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card'
import { MonthVacationStatsContent } from '@/features/vacation-history/ui/MonthVacationStatsContent'
import { MonthVacationStatsEmpty } from '@/features/vacation-history/ui/MonthVacationStatsEmpty'
import { hasMonthUsage } from '@/features/vacation-history/lib/vacation-chart'
import type { GetUserMonthlyVacationStatsResp } from '@/entities/vacation'
import { cn } from '@/shared/lib'
import { useTranslation } from 'react-i18next'

interface MonthVacationStatsCardProps {
  value: GetUserMonthlyVacationStatsResp[] | undefined
  className: string | undefined;
}

const MonthVacationStatsCard = ({ value: data, className }: MonthVacationStatsCardProps) => {
  const { t } = useTranslation('vacation');
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{t('history.monthlyUsageTrend')}</CardTitle>
      </CardHeader>
      <CardContent className='flex-1 pb-4 flex flex-col min-h-[350px]'>
        {data && hasMonthUsage(data) ? <MonthVacationStatsContent data={data} /> : <MonthVacationStatsEmpty />}
      </CardContent>
    </Card>
  )
}

export { MonthVacationStatsCard }