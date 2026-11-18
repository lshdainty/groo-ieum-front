import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGrantTimeText } from '@/shared/lib/groo/use-grant-time-text'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  Chart,
  ChartDataTable,
  ChartLegendTiles,
  ChartTooltip,
  ChartTooltipContent,
  chartAxisProps,
  chartGridProps,
  chartXAxisProps,
} from '@/shared/ds/chart'
import { chartValueIntervals, useAxisWidth, useTickLineHeight } from '@/shared/lib/groo/axisWidth'
import type { GetUserMonthlyVacationStatsResp } from '@/entities/vacation'
import { dayTicks, expectOf, formatUsedTime, monthSeries } from '@/features/vacation-history/lib/vacation-chart'

/** 차트 높이 — 세로 눈금 칸 수(chartValueIntervals)도 이 높이로 센다 */
const CHART_HEIGHT = 200

/** 막대 위 두 모서리 — 쌓은 칸에서는 맨 위 막대만 둥글다 */
const TOP_RADIUS: [number, number, number, number] = [4, 4, 0, 0]

/** 계열 — 쓴 휴가(오늘까지)는 chart-blue 채움, 예정(오늘 뒤)은 같은 색의 옅은 바탕 + 1px 계열 색 테두리 */
const USED = 'used_time'
const SCHEDULED = 'expect_used_time'
/**
 * 쓴 휴가 막대는 두 칸으로 그린다 — 위에 예정이 쌓인 달(USED_UNDER, 모서리 없음)과 아닌 달(USED_TOP, 위 두 모서리 4). 쌓은 칸에서는 맨 위
 * 막대만 둥글다. 칸마다 둘 중 하나만 값이 있고 다른 하나는 null 이라 막대 · 툴팁 줄이 하나다
 */
const USED_TOP = 'used_top'
const USED_UNDER = 'used_under'

/**
 * 달마다 휴가(I-23 D 20 · groo-design chart.md "미리 잡는 일정의 값은 예외") — 어느 해를 골라도 열두 달을 다 그린다.
 * 오늘까지 쓴 휴가는 chart-blue 채움, 오늘 뒤에 잡힌 휴가(예정)는 chart-blue-subtle 바탕 + 1px chart-blue 테두리(옅은 바탕만으로는
 * 카드 면과 그림 3:1 이 모자라 테두리가 막대를 알린다). 한 칸에 둘이면(오늘이 든 달) 쓴 휴가 아래 · 예정 위로 쌓는다. 예정이 없는 앞날
 * 달은 빈 칸이다(0 막대를 그리지 않는다). 지표 타일은 "쓴 휴가" · "예정" — 지난해는 쓴 휴가만, 다음 해는 예정만(monthSeries).
 * 툴팁은 두 값을 함께("3월 · 쓴 휴가 2일 · 예정 1.5일"). 타일을 누르면 그 계열을 켜고 끈다.
 * 높이 200 · 가로 점선 격자만 · 세로축 "{n}일" 정수 눈금(간격 1 · 2 · 5 — `dayTicks`, 보이는 계열을 쌓은 높이로) · 가로축 "{m}월"(ds `chartXAxisProps`).
 * 쓴 휴가도 예정도 없는 해는 부르는 쪽이 비어 있음을 그린다. 차트 이름 "{yyyy}년 달마다 휴가, 쓴 휴가 {합계} · 예정 {합계}" + 숨은 표.
 */
export const MonthVacationStatsContent = ({ data, year }: { data: GetUserMonthlyVacationStatsResp[]; year?: number }) => {
  const { t } = useTranslation('vacation')
  const gt = useGrantTimeText()
  const legendId = useId()
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const series = monthSeries(year)
  const showUsed = series.used && !hidden.has(USED)
  const showScheduled = series.scheduled && !hidden.has(SCHEDULED)
  const bars = data.map((m) => {
    const under = showScheduled && expectOf(m) > 0
    return { ...m, [SCHEDULED]: expectOf(m), [USED_TOP]: under ? null : m.used_time, [USED_UNDER]: under ? m.used_time : null }
  })
  const unit = { day: t('history.chart.dayUnit'), hour: t('history.chart.hourUnit'), minute: t('history.chart.minuteUnit') }
  const usedTotal = formatUsedTime(bars.reduce((a, m) => a + m.used_time, 0), unit)
  const scheduledTotal = formatUsedTime(bars.reduce((a, m) => a + expectOf(m), 0), unit)
  // 세로 눈금 — 보이는 계열을 쌓은 높이. 겹치면 칸을 줄인다(그리는 높이 ÷ 눈금 글 줄 높이 — 글자 크기를 따른다)
  const tickLine = useTickLineHeight()
  const ticks = dayTicks(
    Math.max(0, ...bars.map((m) => (showUsed ? m.used_time : 0) + (showScheduled ? expectOf(m) : 0))),
    chartValueIntervals(CHART_HEIGHT, tickLine),
  )
  const axisWidth = useAxisWidth(ticks.map((n) => t('history.chart.dayAxis', { n })))
  const monthText = (month: unknown) => t('history.chart.monthAxis', { month: String(month) })
  const usedText = (m: GetUserMonthlyVacationStatsResp) => gt(m.used_time, m.used_time_str)
  const scheduledText = (m: GetUserMonthlyVacationStatsResp) => gt(expectOf(m), m.expect_used_time_str ?? '')
  const valueOf = (month: unknown, key: string) => {
    const bar = bars.find((m) => m.month === Number(month))
    if (!bar) return ''
    return key === SCHEDULED ? scheduledText(bar) : usedText(bar)
  }
  const totals = [series.used && t('history.chart.usedTotal', { total: usedTotal }), series.scheduled && t('history.chart.scheduledTotal', { total: scheduledTotal })]
    .filter(Boolean)
    .join(' · ')
  const name = t(year != null ? 'history.chart.monthName' : 'history.chart.monthNameNoYear', { year, totals })
  const tiles = [
    ...(series.used ? [{ key: USED, label: t('history.usedVacation'), color: 'blue' as const, total: usedTotal }] : []),
    ...(series.scheduled ? [{ key: SCHEDULED, label: t('history.chart.scheduled'), color: 'blue' as const, total: scheduledTotal }] : []),
  ]

  return (
    <div className='flex flex-col' data-month-chart>
      <ChartLegendTiles id={legendId} items={tiles} hidden={hidden} onHiddenChange={setHidden} />
      <Chart label={name} legendId={legendId} height={CHART_HEIGHT}>
        <BarChart data={bars}>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey='month' {...chartXAxisProps(bars.map((m) => ({ label: monthText(m.month) })))} />
          <YAxis
            domain={[0, ticks[ticks.length - 1] ?? 1]}
            ticks={ticks}
            allowDecimals={false}
            tickFormatter={(n: number) => t('history.chart.dayAxis', { n })}
            width={axisWidth}
            {...chartAxisProps()}
            // 준 눈금을 하나도 빼지 않는다 — recharts 기본(preserveEnd)은 준 눈금도 겹친다고 보면 빼고 아래 끝 0 도 뺀다(담다 #635 niceValueAxis 와 같다)
            interval={0}
          />
          <ChartTooltip
            content={(props) => (
              <ChartTooltipContent {...props} headFormatter={monthText} valueFormatter={(_, key) => valueOf(props.label, key)} />
            )}
          />
          {series.used && (
            <Bar dataKey={USED_UNDER} name={t('history.usedVacation')} stackId='month' fill='var(--color-chart-blue)' radius={0} hide={!showUsed} />
          )}
          {series.used && (
            <Bar dataKey={USED_TOP} name={t('history.usedVacation')} stackId='month' fill='var(--color-chart-blue)' radius={TOP_RADIUS} hide={!showUsed} />
          )}
          {series.scheduled && (
            <Bar
              dataKey={SCHEDULED}
              name={t('history.chart.scheduled')}
              stackId='month'
              fill='var(--color-chart-blue-subtle)'
              stroke='var(--color-chart-blue)'
              strokeWidth={1}
              radius={TOP_RADIUS}
              hide={!showScheduled}
            />
          )}
        </BarChart>
      </Chart>
      <ChartDataTable
        caption={name}
        columns={[t('history.chart.tableMonth'), ...(series.used ? [t('history.usedVacation')] : []), ...(series.scheduled ? [t('history.chart.scheduled')] : [])]}
        rows={bars.map((m) => [monthText(m.month), ...(series.used ? [usedText(m)] : []), ...(series.scheduled ? [scheduledText(m)] : [])])}
      />
    </div>
  )
}
