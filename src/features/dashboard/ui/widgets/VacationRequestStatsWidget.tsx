import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/shared/ds/skeleton'
import { useUser } from '@/entities/session'
import { useUserRequestedVacationStatsQuery } from '@/entities/vacation'
import { VacationRequestStatsItem, getVacationRequestStatsConfig } from '@/features/vacation-application/ui/VacationRequestStatsItem'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 휴가 신청 통계(D 24) — 신청 현황 지표. 지표 본문은 휴가 신청 화면의 부품이다(주인 지시서 I-25 대기) */
export const VacationRequestStatsWidget = () => {
  const { t } = useTranslation('vacation')
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const query = useUserRequestedVacationStatsQuery(userId, undefined, { quiet: true })
  const items = getVacationRequestStatsConfig(query.data, t)

  return (
    <WidgetFrame id='vacation-request-stats'>
      <WidgetBoundary id='vacation-request-stats' queries={[query]} fallback={<Skeleton radius='12' className='block h-[96px] w-full' />}>
        <div className='grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x4'>
          {items.map((item) => (
            <VacationRequestStatsItem key={item.id} {...item} />
          ))}
        </div>
      </WidgetBoundary>
    </WidgetFrame>
  )
}
