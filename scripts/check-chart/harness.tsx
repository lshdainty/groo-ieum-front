/**
 * check-chart.mjs 가 여는 시험 무대 — 개발 서버가 이 파일을 그대로 옮겨 그린다(운영 빌드에는 들어가지 않는다).
 * 주소의 ?scene= 으로 무대를 고르고, 셈 함수는 window.__chart 에 건다(시험이 page.evaluate 로 부른다).
 * 새 이름(chartXAxisProps · niceValueAxis …)은 이름공간으로 읽는다 — 고치기 전 코드로 돌려도 무대가 서서 판정이 실패로 나오게.
 */
/* eslint-disable react-refresh/only-export-components -- 내보내지 않는 시험 진입 파일 */
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Area, AreaChart, Bar, BarChart, Line, XAxis } from 'recharts'

import '@/app/config/i18n'
import '@/index.css'
import * as chart from '@/shared/ds/chart'
import * as series from '@/shared/ds/chart/chart-series'
import * as variants from '@/shared/ds/chart/chart-variants'
import * as axisWidth from '@/shared/lib/groo/axisWidth'
import * as chartAxis from '@/shared/lib/groo/chartAxis'
import { dayTicks } from '@/features/vacation-history/lib/vacation-chart'
import { MonthVacationStatsContent } from '@/features/vacation-history/ui/MonthVacationStatsContent'

type AnyProps = Record<string, unknown>
type XTick = { label: string; yearLabel?: string; year?: number }

const params = new URLSearchParams(window.location.search)
const scene = params.get('scene') ?? 'lib'
if (params.get('font')) document.documentElement.style.fontSize = `${Number(params.get('font')) * 100}%`

/** 월 눈금 — from(해 · 달)부터 n 칸(담다 chart.test 의 months 와 같다) */
const months = (year: number, month: number, n: number): XTick[] =>
  Array.from({ length: n }, (_, i) => {
    const y = year + Math.floor((month - 1 + i) / 12)
    const m = ((month - 1 + i) % 12) + 1
    return { label: `${m}월`, yearLabel: `${y}. ${m}.`, year: y }
  })

// 계열 기본값 — 켠 · 끈 dots 로 Area · Line 에 들어간 dot · activeDot(담다 chart.test "늘 찍는 점(dots)")
const seriesDots = () => {
  const el = (
    <AreaChart data={[]}>
      <Area dataKey='a' stroke='var(--color-chart-blue)' />
      <Line dataKey='b' stroke='var(--color-chart-red)' />
      <Line dataKey='c' stroke='red' dot={false} />
    </AreaChart>
  ) as React.ReactElement<AnyProps>
  const pick = (opts?: { dots?: boolean }) => {
    const out = (series.withSeriesDefaults as (c: React.ReactElement<AnyProps>, id: string, o?: { dots?: boolean }) => React.ReactElement<AnyProps>)(el, 'p', opts)
    return (React.Children.toArray(out.props.children as React.ReactNode) as React.ReactElement<AnyProps>[])
      .filter((c) => c.type === Area || c.type === Line)
      .map((c) => ({ dot: c.props.dot, activeDotSame: c.props.activeDot === (variants as AnyProps).ACTIVE_DOT }))
  }
  return { on: pick({ dots: true }), off: pick() }
}

window.__chart = {
  ...variants,
  ...chart,
  ...axisWidth,
  ...chartAxis,
  dayTicks,
  months,
  seriesDots,
  // 시험이 부를 때 글 폭을 재야 하는 것(niceValueAxis 의 width)은 문서가 선 뒤에 부른다
}

const trend = [3, 0, 0, 5, 0, 0, 2].map((v, i) => ({ day: `${i + 1}일`, v }))

function DotsScene() {
  const dots = params.get('dots') === '1'
  const ChartAny = chart.Chart as unknown as React.ComponentType<AnyProps>
  return (
    <div className='p-x4' style={{ width: 360 }}>
      <ChartAny label='추이' height={200} dots={dots || undefined}>
        <AreaChart data={trend}>
          <Area dataKey='v' stroke='var(--color-chart-blue)' isAnimationActive={false} />
        </AreaChart>
      </ChartAny>
    </div>
  )
}

// 가로 눈금 솎기 — 25년 11월 ~ 26년 10월 열두 달(담다 chart.test "차트에서 — 폭이 좁아 연도 눈금이 빠지면")
function XAxisScene() {
  const width = Number(params.get('w') ?? 400)
  const ticks = months(2025, 11, 12)
  const full = (chart as AnyProps).chartXTickFullLabels as ((t: XTick[]) => string[]) | undefined
  const xProps = (chart as AnyProps).chartXAxisProps as ((t: XTick[]) => AnyProps) | undefined
  const data = (full ? full(ticks) : ticks.map((t) => t.label)).map((m, v) => ({ m, v: v + 1 }))
  return (
    <BarChart width={width} height={160} data={data}>
      <XAxis dataKey='m' {...(xProps ? xProps(ticks) : chart.chartAxisProps())} />
      <Bar dataKey='v' isAnimationActive={false} />
    </BarChart>
  )
}

// 이음 화면 — 월별 쓴 휴가. 기본은 지난 해 열두 달 · 0 이 대부분인 막대(최대 13일).
// QA 조건(?qa=1): 올해처럼 1 ~ 11월(오늘이 든 달에서 끝난다 — 날짜에 기대지 않게 year 없이 열한 달), 최대 3일, 차트 폭 ?cw=(336 · 266)
function MonthScene() {
  const qa = params.get('qa') === '1'
  const width = params.get('cw') ? Number(params.get('cw')) : undefined
  const used = qa ? [0, 1, 0, 3, 0, 0, 0.5, 0, 0, 2, 0] : [0, 0, 1.5, 0, 0, 0, 7, 0, 0, 0, 2, 13]
  // ?peak= — 4월 값(세로축 최대)을 바꾼다(세로 눈금 칸 줄이기 판정)
  if (qa && params.get('peak')) used[3] = Number(params.get('peak'))
  const data = used.map((u, i) => ({ month: i + 1, used_time: u, used_time_str: `${u}일` }))
  return (
    <div className='px-x4 py-x4'>
      <div className='rounded-r4 bg-bg-layer-default p-x5'>
        <div data-check='slot' style={width ? { width } : undefined}>
          <MonthVacationStatsContent data={data} year={qa ? undefined : 2025} />
        </div>
      </div>
    </div>
  )
}

function Scene() {
  if (scene === 'dots') return <DotsScene />
  if (scene === 'xaxis') return <XAxisScene />
  if (scene === 'month') return <MonthScene />
  return <div data-check='lib'>lib</div>
}

declare global {
  interface Window {
    __chart: Record<string, unknown>
  }
}

createRoot(document.getElementById('root')!).render(<Scene />)
