/**
 * check-chart.mjs 가 여는 시험 무대 — 개발 서버가 이 파일을 그대로 옮겨 그린다(운영 빌드에는 들어가지 않는다).
 * 주소의 ?scene= 으로 무대를 고르고, 셈 함수는 window.__chart 에 건다(시험이 page.evaluate 로 부른다).
 * 새 이름(chartXAxisProps · niceValueAxis …)은 이름공간으로 읽는다 — 고치기 전 코드로 돌려도 무대가 서서 판정이 실패로 나오게.
 */
/* eslint-disable react-refresh/only-export-components -- 내보내지 않는 시험 진입 파일 */
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, Bar, BarChart, Line, XAxis } from 'recharts'

import '@/app/config/i18n'
import '@/index.css'
import * as chart from '@/shared/ds/chart'
import * as series from '@/shared/ds/chart/chart-series'
import * as variants from '@/shared/ds/chart/chart-variants'
import * as axisWidth from '@/shared/lib/groo/axisWidth'
import * as chartAxis from '@/shared/lib/groo/chartAxis'
import { companyToday } from '@/shared/lib/company-date'
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
  companyToday,
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
          <MonthVacationStatsContent data={data} year={qa ? undefined : 2025} currentYear={companyToday(params.get('tz')).year} />
        </div>
      </div>
    </div>
  )
}

// 달마다 휴가 — 쓴 휴가(오늘까지) · 예정(오늘 뒤)을 나눈 서버 값(groo-design #249). ?case=
//   this-dec   올해 — 11월(오늘이 든 달) 쓴 1일 + 예정 0.5일, 12월 예정 2일
//   this-nodec 올해 — 12월 예정 없음(빈 칸)
//   last       지난해 — 쓴 휴가만(12월까지)
//   next       다음 해 — 예정만
// 해는 회사 기준 오늘의 해 기준이다(?tz= 회사 타임존 — 없으면 브라우저 날짜, ?y= 고른 해를 직접). 쓴 · 예정 가르기는 서버 몫이라 값은 고정
const VAC_CASES: Record<string, { yearOffset: number; used: number[]; expect: number[] }> = {
  'this-dec': { yearOffset: 0, used: [0, 1, 0, 3, 0, 0, 0.5, 0, 0, 2, 1, 0], expect: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 2] },
  'this-nodec': { yearOffset: 0, used: [0, 1, 0, 3, 0, 0, 0.5, 0, 0, 2, 1, 0], expect: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0] },
  last: { yearOffset: -1, used: [0, 1, 0, 3, 0, 0, 0.5, 0, 0, 2, 1, 1], expect: Array(12).fill(0) },
  next: { yearOffset: 1, used: Array(12).fill(0), expect: [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0.5] },
}

function VacationScene() {
  const { t } = useTranslation('vacation')
  const c = VAC_CASES[params.get('case') ?? 'this-dec']!
  // 회사 기준 오늘 — 화면은 로그인 확인의 company_timezone 으로 같은 유틸(useCompanyToday)을 부른다
  const today = companyToday(params.get('tz'))
  const year = params.get('y') ? Number(params.get('y')) : today.year + c.yearOffset
  const data = c.used.map((u, i) => ({
    month: i + 1,
    used_time: u,
    used_time_str: `${u}일`,
    expect_used_time: c.expect[i]!,
    expect_used_time_str: `${c.expect[i]}일`,
  }))
  return (
    <div className='px-x4 py-x4'>
      <div className='rounded-r4 bg-bg-layer-default p-x5'>
        <h2 data-check='title'>{t('history.monthCardTitle')}</h2>
        <MonthVacationStatsContent data={data} year={year} currentYear={today.year} />
      </div>
    </div>
  )
}

// 도넛 범례 — 이름이 줄을 바꾸는 긴 줄 하나 + 짧은 줄 하나(groo-design #269 — 색 네모 · % · 금액은 줄 전체의 세로 가운데)
function DonutLegendScene() {
  const width = Number(params.get('w') ?? 320)
  return (
    <div style={{ width }} className='p-x4'>
      <chart.ChartDonutLegend
        items={[
          { key: 'long', label: '연차 · 반차 · 반반차 · 대체 휴가 · 경조 휴가 · 공가를 모두 더한 긴 이름', color: 'blue', percent: '41%', amount: '12.5일' },
          { key: 'short', label: '병가', color: 'red', percent: '9%', amount: '3일' },
        ]}
      />
    </div>
  )
}

function Scene() {
  if (scene === 'donut') return <DonutLegendScene />
  if (scene === 'vacation') return <VacationScene />
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
