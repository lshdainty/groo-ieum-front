import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pie, PieChart } from 'recharts'

import {
  Chart,
  ChartDataTable,
  ChartDonutCenter,
  ChartDonutLegend,
  ChartTooltip,
  ChartTooltipContent,
  chartDonutRadii,
} from '@/shared/ds/chart'
import { shareOf } from '@/shared/lib/groo/share'
import type { GetAvailableVacationsResp } from '@/entities/vacation'
import { typeSlices } from '@/features/vacation-history/lib/vacation-chart'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'

/**
 * 휴가 유형별 남은 휴가(I-23 D 21 · HB3 A) — ds Chart 도넛 + 아래 범례. 지름 데스크톱 160(두께 22) · 폰 120(두께 18).
 * 가운데 = "남은 휴가" + 합계, 구멍에 들지 않으면 가운데를 비우고 범례 위 합계 줄(폰 120 은 보통 이쪽). 유형 색은 표로 고정(typeColors).
 * 남은 시간 0 인 유형은 조각 · 범례에서 뺀다 — 모두 0 이면 부르는 쪽이 비어 있음을 그린다. 범례의 값은 원이 아니라 `remain_time_str`.
 */
export const VacationTypeStatsContent = ({ data }: { data: GetAvailableVacationsResp }) => {
  const { t } = useTranslation('vacation')
  const desktop = useDesktop()
  const size = desktop ? 160 : 120
  const legendId = useId()
  const [fits, setFits] = useState(true)
  const slices = typeSlices(data)
  const sum = slices.reduce((a, s) => a + s.remain_time, 0)
  const total = data.total_remain_time_str
  const name = t('history.chart.typeName', { total })

  return (
    <div className='flex flex-col' data-type-chart>
      <Chart label={name} legendId={legendId} height={size}>
        <PieChart>
          <Pie data={slices} dataKey='remain_time' nameKey='vacation_type_name' {...chartDonutRadii(size)} />
          <ChartTooltip
            content={(props) => {
              const row = props.payload?.[0]?.payload as { remain_time_str?: string } | undefined
              return <ChartTooltipContent {...props} valueFormatter={() => row?.remain_time_str ?? ''} />
            }}
          />
        </PieChart>
        <ChartDonutCenter label={t('history.remainTotal')} amount={total} onFitChange={setFits} />
      </Chart>
      {!fits && (
        <div data-slot='home-donut-total' className='mt-x4 flex items-baseline justify-between gap-x3'>
          <span className='text-t3 text-fg-neutral-subtle'>{t('history.remainTotal')}</span>
          <span className='min-w-0 text-end text-t5 font-bold tabular-nums text-fg-neutral'>{total}</span>
        </div>
      )}
      <ChartDonutLegend
        id={legendId}
        className='mt-x4'
        items={slices.map((s) => ({
          key: s.vacation_type,
          label: s.vacation_type_name,
          color: s.color,
          percent: shareOf(s.remain_time, sum),
          amount: s.remain_time_str,
        }))}
      />
      <ChartDataTable
        caption={name}
        columns={[t('history.vacationType'), t('history.chart.tableShare'), t('history.remainTotal')]}
        rows={slices.map((s) => [s.vacation_type_name, shareOf(s.remain_time, sum), s.remain_time_str])}
      />
    </div>
  )
}
