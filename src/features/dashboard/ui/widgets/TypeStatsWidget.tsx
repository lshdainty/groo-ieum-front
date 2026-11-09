import dayjs from 'dayjs'
import { PieChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { useUser } from '@/entities/session'
import { useAvailableVacationsQuery } from '@/entities/vacation'
import { typeSlices } from '@/features/vacation-history/lib/vacation-chart'
import { VacationTypeStatsContent } from '@/features/vacation-history/ui/VacationTypeStatsContent'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 휴가 유형별 통계(D 21) — 유형마다 고정한 색의 도넛 + 범례. 남은 시간이 있는 유형이 없으면 "남은 휴가가 없어요" */
export const TypeStatsWidget = () => {
  const { t } = useTranslation('dashboard')
  const desktop = useDesktop()
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const query = useAvailableVacationsQuery(userId, dayjs().format('YYYY-MM-DDT23:59:59'), { quiet: true })

  return (
    <WidgetFrame id='type-stats'>
      <WidgetBoundary id='type-stats' queries={[query]} fallback={<TypeStatsSkeleton size={desktop ? 160 : 120} />}>
        {query.data && typeSlices(query.data).length > 0 ? (
          <VacationTypeStatsContent data={query.data} />
        ) : (
          <ResultSection size='medium' icon={<PieChart />} title={t('widget.empty.typeStats.title')} />
        )}
      </WidgetBoundary>
    </WidgetFrame>
  )
}

/** 원 + 범례 줄 셋 */
const TypeStatsSkeleton = ({ size }: { size: number }) => (
  <div className='flex flex-col'>
    <div className='flex justify-center'>
      <Skeleton radius='full' style={{ width: size, height: size }} />
    </div>
    <div className='mt-x4 flex flex-col gap-x3'>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} text='t4' className='block w-full' />
      ))}
    </div>
  </div>
)
