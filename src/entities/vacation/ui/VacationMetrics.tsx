import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, CardStat, Delta, type DeltaProps } from '@/shared/ds/card'
import { List, ListItem } from '@/shared/ds/list'
import { Skeleton } from '@/shared/ds/skeleton'
import type { GetUserVacationStatsResp } from '@/entities/vacation/model/types'
import { metricLabelsOf, metricsOf, type Metric } from '@/entities/vacation/model/metrics'

type Layout = 'cards' | 'band' | 'inline' | 'list'

/** 그릴 지표 — 기다리는 동안은 값이 없다(이름은 정해진 글이라 그대로) */
type Shown = { id: Metric['id']; label: string; value?: string; delta?: DeltaProps }

/**
 * 휴가 지표 셋(남은 휴가 · 쓴 휴가 · 쓸 예정 — 증감은 ds Delta 한 번 "▲ 1일 지난달보다").
 * 모양 넷: `cards` = 휴가 현황 데스크톱(카드 셋 나란히 — 부르는 쪽이 카드를 그린다 · 이 부품은 칸 셋) ·
 * `band` = 폰(남은 휴가 큰 숫자 + 증감, 아래 키-값 줄 "쓴 휴가" · "쓸 예정") · `inline` = 홈 위젯 데스크톱(한 카드 안 셋 나란히) ·
 * `list` = 홈 위젯 폰(키-값 List 줄 셋 — 증감은 값 아래 오른쪽).
 * `data` 가 없으면 기다리는 모습이다 — 같은 부품 · 같은 이름에 값 자리만 그 글 크기의 글 줄 스켈레톤(skeleton.md "틀은 먼저,
 * 데이터 자리만 스켈레톤"). 0 ~ 1초 시간표는 감싸는 LoadingRegion 이 맡는다.
 * "쓸 예정" 아래 가장 가까운 쓸 날은 응답에 날짜 키가 없어 그리지 않는다.
 */
export function VacationMetrics({ data, layout }: { data?: GetUserVacationStatsResp; layout: Layout }) {
  const { t, i18n } = useTranslation('vacation')
  const metrics: Shown[] = data ? metricsOf(data, t, i18n.language) : metricLabelsOf(t)
  // 값 자리 — 받은 값, 기다리는 동안은 그 글 크기의 글 줄(폭은 값 글 길이쯤)
  const value = (m: Shown, text: 't9' | 't7' | 't5'): ReactNode => m.value ?? <Skeleton text={text} className='block w-[72px] max-w-full' />
  const row = (m: Shown) => (
    <ListItem
      key={m.id}
      data-metric={m.id}
      title={m.label}
      align='top'
      suffix={
        <span className='flex flex-col items-end'>
          <span className='text-t5 font-bold tabular-nums text-fg-neutral'>{value(m, 't5')}</span>
          {m.delta && <Delta {...m.delta} />}
        </span>
      }
    />
  )

  if (layout === 'cards') {
    return (
      <div className='grid grid-cols-3 gap-x6'>
        {metrics.map((m) => (
          <Card key={m.id} data-metric={m.id} className='min-w-0'>
            <CardStat label={m.label} value={value(m, 't9')} delta={m.delta} />
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
            <CardStat size='small' label={m.label} value={value(m, 't7')} delta={m.delta} />
          </div>
        ))}
      </div>
    )
  }
  if (layout === 'list') return <List>{metrics.map(row)}</List>
  const [main, ...rest] = metrics
  return (
    <div className='flex flex-col'>
      <div data-metric={main.id} className='px-x6 pt-x2'>
        <CardStat label={main.label} value={value(main, 't9')} delta={main.delta} />
      </div>
      <List className='mt-x2'>{rest.map(row)}</List>
    </div>
  )
}
