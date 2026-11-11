import { useTranslation } from 'react-i18next'

import { Card, CardStat, Delta } from '@/shared/ds/card'
import { List, ListItem } from '@/shared/ds/list'
import type { GetUserVacationStatsResp } from '@/entities/vacation/model/types'
import { metricsOf } from '@/entities/vacation/model/metrics'

/**
 * 휴가 지표 셋(남은 휴가 · 쓴 휴가 · 쓸 예정 — 증감은 ds Delta 한 번 "▲ 1일 지난달보다").
 * 모양 셋: `cards` = 휴가 현황 데스크톱(카드 셋 나란히 — 부르는 쪽이 카드를 그린다 · 이 부품은 칸 셋) ·
 * `band` = 폰(남은 휴가 큰 숫자 + 증감, 아래 키-값 줄 "쓴 휴가" · "쓸 예정") · `inline` = 홈 위젯(한 카드 안 셋 나란히 · 폰 키-값 List).
 * "쓸 예정" 아래 가장 가까운 쓸 날은 응답에 날짜 키가 없어 그리지 않는다.
 */
export function VacationMetrics({ data, layout }: { data: GetUserVacationStatsResp; layout: 'cards' | 'band' | 'inline' }) {
  const { t, i18n } = useTranslation('vacation')
  const metrics = metricsOf(data, t, i18n.language)

  if (layout === 'cards') {
    return (
      <div className='grid grid-cols-3 gap-x6'>
        {metrics.map((m) => (
          <Card key={m.id} data-metric={m.id} className='min-w-0'>
            <CardStat label={m.label} value={m.value} delta={m.delta} />
          </Card>
        ))}
      </div>
    )
  }
  if (layout === 'inline') {
    return (
      <div className='grid grid-cols-3 divide-x divide-stroke-neutral-subtle'>
        {metrics.map((m) => (
          <div key={m.id} className='min-w-0 px-x5 first:pl-0 last:pr-0' data-metric={m.id}>
            <CardStat size='small' label={m.label} value={m.value} delta={m.delta} />
          </div>
        ))}
      </div>
    )
  }
  const [main, ...rest] = metrics
  return (
    <div className='flex flex-col'>
      <div data-metric={main.id} className='px-x6 pt-x2'>
        <CardStat label={main.label} value={main.value} delta={main.delta} />
      </div>
      <List className='mt-x2'>
        {rest.map((m) => (
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
    </div>
  )
}
