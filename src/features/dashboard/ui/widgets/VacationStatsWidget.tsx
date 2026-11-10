import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { Delta } from '@/shared/ds/card'
import { List, ListItem } from '@/shared/ds/list'
import { Skeleton } from '@/shared/ds/skeleton'
import { useUser } from '@/entities/session'
import { useUserVacationStatsQuery, VacationMetrics, metricsOf } from '@/entities/vacation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/**
 * 휴가 현황(D 19) — 데스크톱은 한 카드 안 지표 셋 나란히(칸 사이 1px), 폰은 키-값 List 줄 셋(증감은 값 아래 오른쪽).
 * 증감은 ds Delta(▲ 빨강 · ▼ 파랑 + "지난달보다") 한 번 — 배지와 설명 두 번 쓰던 것을 하나로.
 */
export const VacationStatsWidget = () => {
  const { t } = useTranslation('vacation')
  const desktop = useDesktop()
  const { loginUser } = useUser()
  const userId = loginUser?.user_id || ''
  const today = useMemo(() => `${dayjs().format('YYYY-MM-DD')}T23:59:59`, [])
  const query = useUserVacationStatsQuery(userId, today, { quiet: true })
  const metrics = query.data ? metricsOf(query.data, t) : []

  return (
    <WidgetFrame id='vacation-stats' body={desktop ? 'content' : 'list'}>
      <WidgetBoundary id='vacation-stats' queries={[query]} fallback={<VacationStatsSkeleton desktop={desktop} />}>
        {desktop ? (
          query.data && <VacationMetrics data={query.data} layout='inline' />
        ) : (
          <List>
            {metrics.map((m) => (
              <ListItem
                key={m.id}
                data-metric={m.id}
                title={m.label}
                align='top'
                suffix={
                  <span className='flex flex-col items-end'>
                    <span className='text-t5 font-bold tabular-nums text-fg-neutral'>{m.value}</span>
                    {m.delta && <Delta {...m.delta} />}
                  </span>
                }
              />
            ))}
          </List>
        )}
      </WidgetBoundary>
    </WidgetFrame>
  )
}

const VacationStatsSkeleton = ({ desktop }: { desktop: boolean }) =>
  desktop ? (
    <div className='grid grid-cols-3'>
      {[0, 1, 2].map((i) => (
        <div key={i} className='flex flex-col items-start gap-x1 px-x5 first:pl-0 last:pr-0'>
          <Skeleton text='t3' className='block w-1/2' />
          <Skeleton text='t7' className='block w-3/4' />
        </div>
      ))}
    </div>
  ) : (
    <div className='flex flex-col'>
      {[0, 1, 2].map((i) => (
        <div key={i} className='flex items-center justify-between gap-x4 px-x6 py-x3'>
          <Skeleton text='t5' className='block w-1/3' />
          <Skeleton text='t5' className='block w-1/4' />
        </div>
      ))}
    </div>
  )
