import { Skeleton } from '@/shared/ds/skeleton'
import { useGrantStatusTypesQuery } from '@/entities/type'
import { useUser } from '@/entities/session'
import { useUserRequestedVacationsQuery } from '@/entities/vacation'
import { ApplicationTableContent } from '@/features/vacation-application/ui/ApplicationTableContent'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 휴가 신청 내역(D 23) — 최근 5줄 · 쪽 넘김 없음 · 표 안 고정 머리 없음. 표 본문은 휴가 신청 화면의 부품이다(주인 지시서 I-25 대기) */
export const ApplicationTableWidget = () => {
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const requests = useUserRequestedVacationsQuery(userId, undefined, { quiet: true })
  const types = useGrantStatusTypesQuery({ quiet: true })

  return (
    <WidgetFrame id='vacation-application' body='list'>
      <WidgetBoundary id='vacation-application' queries={[requests, types]} fallback={<RowsSkeleton />}>
        <ApplicationTableContent vacationRequests={(requests.data ?? []).slice(0, 5)} grantStatusTypes={types.data ?? []} className='min-h-0' />
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
