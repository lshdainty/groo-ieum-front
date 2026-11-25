import { useMemo } from 'react'
import dayjs from 'dayjs'

import { useUser } from '@/entities/session'
import { useUserVacationStatsQuery, VacationMetrics } from '@/entities/vacation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/**
 * 휴가 현황(D 19) — 데스크톱은 한 카드 안 지표 셋 나란히(칸 사이 1px), 폰은 키-값 List 줄 셋(증감은 값 아래 오른쪽).
 * 증감은 ds Delta(▲ 빨강 · ▼ 파랑 + "지난달보다") 한 번 — 배지와 설명 두 번 쓰던 것을 하나로.
 * 기다리는 동안은 같은 부품에 이름(남은 휴가 · 쓴 휴가 · 쓸 예정)은 실제 글, 값 자리만 글 줄 스켈레톤(skeleton.md "틀은 먼저").
 */
export const VacationStatsWidget = () => {
  const desktop = useDesktop()
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const today = useMemo(() => `${dayjs().format('YYYY-MM-DD')}T23:59:59`, [])
  const query = useUserVacationStatsQuery(userId, today, { quiet: true })
  const layout = desktop ? 'inline' : 'list'

  return (
    <WidgetFrame id='vacation-stats' body={desktop ? 'content' : 'list'}>
      <WidgetBoundary id='vacation-stats' queries={[query]} fallback={<VacationMetrics layout={layout} />}>
        {query.data && <VacationMetrics data={query.data} layout={layout} />}
      </WidgetBoundary>
    </WidgetFrame>
  )
}
