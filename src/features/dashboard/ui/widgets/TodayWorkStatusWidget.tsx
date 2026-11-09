import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ds/badge'
import { ProgressBar } from '@/shared/ds/progress'
import { Skeleton } from '@/shared/ds/skeleton'
import { useTodayWorkStatusQuery } from '@/entities/work'
import { formatWorkHours } from '@/features/dashboard/lib/work-hours'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/**
 * 업무이력 작성 현황(D 31 — 홈뿐) — 큰 숫자 "{n}시간" + "/ {m}시간" + 배지(작성 중 · 다 채웠어요), 미터(높이 8 · 채움 fg-brand, role=meter,
 * 이름이 값을 읽는다), 아래 안내 한 줄. 카드 안 둘째 제목 · % 글 · 날 색 막대는 없다. 시간은 "{h}시간 {m}분"(소수 없음).
 */
export const TodayWorkStatusWidget = () => {
  const { t } = useTranslation('dashboard')
  const query = useTodayWorkStatusQuery({ quiet: true })
  const data = query.data
  const total = data?.total_hours ?? 0
  const required = data?.required_hours ?? 0
  const done = !!data && (data.completed || (required > 0 && total >= required))
  const hours = (h: number) => formatWorkHours(h, t)
  const name = t('workHistory.meterName', { total: hours(total), required: hours(required) })

  return (
    <WidgetFrame id='today-work-status'>
      <WidgetBoundary id='today-work-status' queries={[query]} fallback={<TodayWorkSkeleton />}>
        <div className='flex flex-col gap-x3'>
          <div className='flex flex-wrap items-baseline justify-between gap-x2'>
            <div className='flex min-w-0 flex-wrap items-baseline gap-x1_5'>
              <span className='text-t9 font-bold tabular-nums text-fg-neutral' data-work-total>
                {hours(total)}
              </span>
              <span className='text-t4 font-normal text-fg-neutral-subtle'>/ {hours(required)}</span>
            </div>
            <Badge tone={done ? 'positive' : 'warning'}>{done ? t('workHistory.achieved') : t('workHistory.inProgress')}</Badge>
          </div>
          <ProgressBar
            meaning='goal'
            value={Math.min(total, Math.max(required, 0))}
            max={Math.max(required, 1)}
            aria-label={name}
            aria-valuetext={`${hours(total)} / ${hours(required)}`}
          />
          <p className='m-0 text-t3 font-normal text-fg-neutral-subtle' data-work-note>
            {done ? t('workHistory.achievedMessage') : t('workHistory.remainingMessage', { time: hours(Math.max(required - total, 0)) })}
          </p>
        </div>
      </WidgetBoundary>
    </WidgetFrame>
  )
}

const TodayWorkSkeleton = () => (
  <div className='flex flex-col gap-x3'>
    <div className='flex items-baseline justify-between'>
      <Skeleton text='t9' className='block w-1/3' />
      <Skeleton text='t3' className='block w-1/5' />
    </div>
    <Skeleton text='t1' className='block h-x2 w-full' />
    <Skeleton text='t3' className='block w-2/3' />
  </div>
)
