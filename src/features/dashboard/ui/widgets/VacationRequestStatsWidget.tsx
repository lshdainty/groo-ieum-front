import { Skeleton } from '@/shared/ds/skeleton'
import { useUser } from '@/entities/session'
import { useUserRequestedVacationStatsQuery } from '@/entities/vacation'
import { RequestSummary } from '@/features/vacation-application/ui/RequestSummary'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 휴가 신청 통계(D 24) — 신청 현황 지표. 본문은 휴가 신청 화면의 요약 부품이다(I-25 25-2) */
export const VacationRequestStatsWidget = () => {
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const query = useUserRequestedVacationStatsQuery(userId, undefined, { quiet: true })
  const year = new Date().getFullYear()

  return (
    <WidgetFrame id='vacation-request-stats'>
      <WidgetBoundary id='vacation-request-stats' queries={[query]} fallback={<Skeleton radius='12' className='block h-[96px] w-full' />}>
        {query.data && <RequestSummary stats={query.data} year={year} layout='inline' />}
      </WidgetBoundary>
    </WidgetFrame>
  )
}
