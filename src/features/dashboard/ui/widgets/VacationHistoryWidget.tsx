import { useUser } from '@/entities/session'
import { useUserVacationHistoryQuery } from '@/entities/vacation'
import { VacationHistoryContent } from '@/features/vacation-history/ui/VacationHistoryContent'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'
import { RowsSkeleton } from '@/features/dashboard/ui/widgets/ApplicationTableWidget'

/** 휴가 내역(D 25) — 사용 · 부여 각각 최근 5줄 · 쪽 넘김 없음. 표 본문은 휴가 현황 화면의 부품이다(주인 지시서 I-25 대기) */
export const VacationHistoryWidget = () => {
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const query = useUserVacationHistoryQuery(userId, undefined, { quiet: true })
  const data = query.data && { ...query.data, usages: (query.data.usages ?? []).slice(0, 5), grants: (query.data.grants ?? []).slice(0, 5) }

  return (
    <WidgetFrame id='vacation-history' body='list'>
      <WidgetBoundary id='vacation-history' queries={[query]} fallback={<RowsSkeleton />}>
        <VacationHistoryContent data={data!} showPagination={false} className='min-h-0' />
      </WidgetBoundary>
    </WidgetFrame>
  )
}
