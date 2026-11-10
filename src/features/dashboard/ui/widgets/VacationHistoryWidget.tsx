import { useTranslation } from 'react-i18next'

import { latestRows } from '@/features/dashboard/lib/latest-rows'
import { useUser } from '@/entities/session'
import { useUserVacationHistoryQuery } from '@/entities/vacation'
import { VacationHistoryContent } from '@/features/vacation-history/ui/VacationHistoryContent'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetScrollBox } from '@/features/dashboard/ui/WidgetScrollBox'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'
import { RowsSkeleton } from '@/features/dashboard/ui/widgets/ApplicationTableWidget'

/** 휴가 내역(D 25) — 사용 · 부여 각각 최신 5줄(날짜 내림차순 — 서버 순서에 기대지 않는다) · 쪽 넘김 없음. 표 본문은 휴가 현황 화면의 부품이다(주인 지시서 I-25 대기) */
export const VacationHistoryWidget = () => {
  const { t } = useTranslation('dashboard')
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const query = useUserVacationHistoryQuery(userId, undefined, { quiet: true })
  // 서버 순서(오래된 것부터)에 기대지 않고 날짜 내림차순으로 정렬해 최신 5줄
  const data = query.data && {
    ...query.data,
    usages: latestRows(query.data.usages, (u) => u.start_date),
    grants: latestRows(query.data.grants, (g) => g.grant_date),
  }

  return (
    <WidgetFrame id='vacation-history' body='list'>
      <WidgetBoundary id='vacation-history' queries={[query]} fallback={<RowsSkeleton />}>
        <WidgetScrollBox label={t('widget.vacationHistory')}>
          <VacationHistoryContent data={data} year={new Date().getFullYear()} pagination={false} />
        </WidgetScrollBox>
      </WidgetBoundary>
    </WidgetFrame>
  )
}
