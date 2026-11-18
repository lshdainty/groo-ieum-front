/**
 * check-narrow.mjs 가 여는 시험 무대 — 개발 서버가 이 파일을 그대로 옮겨 그린다(운영 빌드에는 들어가지 않는다).
 * 주소의 ?scene= 으로 무대를 고른다. 화면 폭은 시험이 브라우저 창 폭으로 준다(320 미만 = 페이지 확대 흉내).
 */
/* eslint-disable react-refresh/only-export-components -- 내보내지 않는 시험 진입 파일 */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Pie, PieChart } from 'recharts'

import '@/app/config/i18n'
import '@/index.css'
import { Button } from '@/shared/ds/button'
import { Chart, ChartDonutCenter, chartDonutRadii } from '@/shared/ds/chart'
import { DatePicker, type DateRange } from '@/shared/ds/date-picker'
import { Field } from '@/shared/ds/field'
import { Input } from '@/shared/ds/input'
import { SegmentedControl, SegmentedControlItem } from '@/shared/ds/segmented-control'
import { GrantTimeField } from '@/shared/ui/groo/grant-time-field'
import { CalendarProvider } from '@/features/calendar/model/calendar-context'
import { CalendarToolbar } from '@/features/calendar/ui/header/calendar-toolbar'
import { VacationTypeStatsContent } from '@/features/vacation-history/ui/VacationTypeStatsContent'

const params = new URLSearchParams(window.location.search)
const scene = params.get('scene') ?? 'segmented'

// 담다 segmented-control.test 의 TodoView 와 같은 세 칸
function SegmentedScene() {
  return (
    <div className='p-x4'>
      <SegmentedControl aria-label='할 일 보기' defaultValue='week' data-check='track'>
        <SegmentedControlItem value='today'>오늘</SegmentedControlItem>
        <SegmentedControlItem value='week'>이번 주</SegmentedControlItem>
        <SegmentedControlItem value='all'>전체</SegmentedControlItem>
      </SegmentedControl>
    </div>
  )
}

// 담다 chart.test 의 자산 도넛 — 지름 180(두께 24). 자리 폭은 시험이 [data-check=slot] 의 폭으로 준다
function DonutScene() {
  return (
    <div data-check='slot' style={{ width: 312 }}>
      <Chart label='카테고리' height={180}>
        <PieChart>
          <Pie data={[{ v: 1 }, { v: 2 }]} dataKey='v' isAnimationActive={false} {...chartDonutRadii(180)} />
        </PieChart>
        <ChartDonutCenter label='10월 지출' amount='1,240,000원' />
      </Chart>
    </div>
  )
}

// 이어지는 달 — 높이가 낮은 칸(시트가 낮을 때)에 넣는다. 칸 높이는 ?h=
function ContinuousScene() {
  const [value, setValue] = useState<DateRange | undefined>()
  const height = Number(params.get('h') ?? 120)
  return (
    <div data-check='box' className='flex flex-col overflow-y-auto' style={{ height }}>
      <DatePicker selection='range' visibleRange='continuous' today={new Date(2026, 10, 18)} aria-label='기간' value={value} onValueChange={setValue} />
    </div>
  )
}

// Field 머리 — 라벨 옆 보조 글이 길 때
function FieldScene() {
  return (
    <div className='p-x4'>
      <Field label='금액' headerAction={<Button variant='ghost' size='small'>지난달과 같게</Button>}>
        <Input aria-label='금액' />
      </Field>
    </div>
  )
}

// 이음 화면 — 같은 ds 를 쓰는 곳(폰 틀: 768 미만). 페이지 좌우 여백 16 안에 둔다
function ScreensScene() {
  return (
    <div className='flex flex-col gap-x6 px-x4 py-x4'>
      <CalendarProvider users={[]}>
        <CalendarToolbar desktop={false} people={[]} />
      </CalendarProvider>
      <GrantTimeField label='부여 시간' value={1.5} onValueChange={() => {}} withMinutes />
      <div data-check='donut-card' className='rounded-r4 bg-bg-layer-default p-x5'>
        <VacationTypeStatsContent
          data={{
            total_remain_time: 12.5,
            total_remain_time_str: '12일 4시간',
            vacations: [
              { vacation_type: 'ANNUAL', vacation_type_name: '연차', remain_time: 10, remain_time_str: '10일' },
              { vacation_type: 'MATERNITY', vacation_type_name: '출산', remain_time: 2.5, remain_time_str: '2일 4시간' },
            ],
          }}
        />
      </div>
    </div>
  )
}

function Scene() {
  if (scene === 'donut') return <DonutScene />
  if (scene === 'continuous') return <ContinuousScene />
  if (scene === 'field') return <FieldScene />
  if (scene === 'screens') return <ScreensScene />
  return <SegmentedScene />
}

createRoot(document.getElementById('root')!).render(<Scene />)
