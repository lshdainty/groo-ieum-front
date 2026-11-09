import { Skeleton } from '@/shared/ds/skeleton'
import { useUsersQuery } from '@/entities/user'
import { ScheduleTable } from '@/features/work-schedule/ui/ScheduleTable'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 근무 일정(D 22) — 일정 관리 화면의 부품을 카드에 담는다(주인 지시서 I-25 대기). 부품 안의 읽기는 아직 임시 그물이다 */
export const ScheduleWidget = () => {
  const query = useUsersQuery({ quiet: true })

  return (
    <WidgetFrame id='schedule' body='list'>
      <WidgetBoundary id='schedule' queries={[query]} fallback={<Skeleton radius='12' className='mx-x6 block h-[200px]' />}>
        <ScheduleTable users={query.data ?? []} />
      </WidgetBoundary>
    </WidgetFrame>
  )
}
