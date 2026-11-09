import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { type GetAvailableVacationsResp } from '@/entities/vacation';
import { cn } from '@/shared/lib'
import { useTranslation } from 'react-i18next';
import { VacationTypeStatsContent } from './VacationTypeStatsContent'
import { VacationTypeStatsEmpty } from './VacationTypeStatsEmpty'
import { typeSlices } from '@/features/vacation-history/lib/vacation-chart'

interface VacationTypeStatsCardProps {
  value: GetAvailableVacationsResp | undefined
  className: string | undefined;
}

const VacationTypeStatsCard = ({ value, className }: VacationTypeStatsCardProps) => {
  const { t } = useTranslation('vacation');
  return (
    <Card className={cn(className, 'flex flex-col')}>
      <CardHeader className='items-center pb-0 flex-shrink-0'>
        <CardTitle>{t('history.vacationType')}</CardTitle>
        <CardDescription>{t('history.vacationTypeDesc')}</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-4 flex flex-col min-h-[350px]'>
        {value && typeSlices(value).length > 0 ? <VacationTypeStatsContent data={value} /> : <VacationTypeStatsEmpty />}
      </CardContent>
    </Card>
  )
}

export { VacationTypeStatsCard }