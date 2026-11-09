import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  Chart,
  ChartDataTable,
  ChartLegendTiles,
  ChartTooltip,
  ChartTooltipContent,
  chartAxisProps,
  chartGridProps,
} from '@/shared/ds/chart'
import { useAxisWidth } from '@/shared/lib/groo/axisWidth'
import type { GetUserMonthlyVacationStatsResp } from '@/entities/vacation'
import { dayTicks, formatUsedTime, monthBars } from '@/features/vacation-history/lib/vacation-chart'

/**
 * 월별 쓴 휴가(I-23 D 20) — 타일 하나(쓴 휴가 + 합계) · 막대 chart-blue 한 계열 · 높이 200 · 가로 점선 격자만 · 세로축 "{n}일" 정수 눈금 ·
 * 가로축 "{m}월". 고른 해가 올해면 이번 달에서 끝난다(year 를 주지 않으면 열두 달). 쓴 휴가가 하나도 없는 경우는 부르는 쪽이 비어 있음을 그린다.
 * 차트 이름 "{yyyy}년 월별 쓴 휴가, 합계 {합계}" + 숨은 표(달 · 쓴 휴가).
 */
export const MonthVacationStatsContent = ({ data, year }: { data: GetUserMonthlyVacationStatsResp[]; year?: number }) => {
  const { t } = useTranslation('vacation')
  const legendId = useId()
  const bars = monthBars(data, year)
  const sum = bars.reduce((a, m) => a + m.used_time, 0)
  const unit = { day: t('history.chart.dayUnit'), hour: t('history.chart.hourUnit'), minute: t('history.chart.minuteUnit') }
  const total = formatUsedTime(sum, unit)
  const ticks = dayTicks(Math.max(0, ...bars.map((m) => m.used_time)))
  const axisWidth = useAxisWidth(ticks.map((n) => t('history.chart.dayAxis', { n })))
  const monthText = (month: unknown) => t('history.chart.monthAxis', { month: String(month) })
  const strOf = (month: unknown) => bars.find((m) => m.month === Number(month))?.used_time_str ?? ''
  const name = t(year != null ? 'history.chart.monthName' : 'history.chart.monthNameNoYear', { year, total })

  return (
    <div className='flex flex-col' data-month-chart>
      <ChartLegendTiles id={legendId} items={[{ key: 'used', label: t('history.usedVacation'), color: 'blue', total }]} />
      <Chart label={name} legendId={legendId} height={200}>
        <BarChart data={bars}>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey='month' tickFormatter={monthText} interval={0} {...chartAxisProps()} />
          <YAxis
            domain={[0, ticks[ticks.length - 1] ?? 1]}
            ticks={ticks}
            allowDecimals={false}
            tickFormatter={(n: number) => t('history.chart.dayAxis', { n })}
            width={axisWidth}
            {...chartAxisProps()}
          />
          <ChartTooltip
            content={(props) => (
              <ChartTooltipContent {...props} headFormatter={monthText} valueFormatter={() => strOf(props.label)} />
            )}
          />
          <Bar dataKey='used_time' name={t('history.usedVacation')} fill='var(--color-chart-blue)' radius={[4, 4, 0, 0]} />
        </BarChart>
      </Chart>
      <ChartDataTable
        caption={name}
        columns={[t('history.chart.tableMonth'), t('history.usedVacation')]}
        rows={bars.map((m) => [monthText(m.month), m.used_time_str])}
      />
    </div>
  )
}
