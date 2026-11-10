import { CalendarX2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { useUser } from '@/entities/session'
import { useUserRequestedVacationsQuery } from '@/entities/vacation'
import { RequestListContent } from '@/features/vacation-application/ui/RequestListContent'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 휴가 신청 내역(D 23) — 최근 5줄 · 쪽 넘김 없음 · 표 안 고정 머리 없음. 본문은 휴가 신청 화면과 같은 부품이다(I-25 25-2) */
export const ApplicationTableWidget = () => {
  const { t } = useTranslation('vacation')
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const requests = useUserRequestedVacationsQuery(userId, undefined, { quiet: true })

  return (
    <WidgetFrame id='vacation-application' body='list'>
      <WidgetBoundary id='vacation-application' queries={[requests]} fallback={<RowsSkeleton />}>
        {(requests.data ?? []).length === 0 ? (
          <ResultSection size='medium' icon={<CalendarX2 />} title={t('req.emptyTitle', { year: new Date().getFullYear() })} description={t('req.emptyDescription')} />
        ) : (
          <RequestListContent rows={requests.data ?? []} limit={5} />
        )}
      </WidgetBoundary>
    </WidgetFrame>
  )
}

export const RowsSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className='flex flex-col gap-x3 px-x6 py-x3'>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} text='t5' className='block w-full' />
    ))}
  </div>
)
