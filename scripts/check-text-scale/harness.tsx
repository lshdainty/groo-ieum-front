/**
 * check-text-scale.mjs 가 여는 시험 무대 — 개발 서버가 이 파일을 그대로 옮겨 그린다(운영 빌드에는 들어가지 않는다).
 * 글자 크기 두 갈래(groo-design #260 · #261 · #263 · #264): 그대로 두는 쪽(-static · px)과 커지는 쪽(rem)을 한 화면에 모아 그린다.
 * 잴 자리마다 data-measure="<이름>" 을 단다(시험이 그 자리의 글자 크기 · 상자 크기를 읽는다).
 * ?font= — 글자 크기 배율(html font-size, 처음부터). 시험이 "뜬 뒤" 는 그린 뒤 html font-size 를 바꾼다.
 */
/* eslint-disable react-refresh/only-export-components -- 내보내지 않는 시험 진입 파일 */
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dayjs from 'dayjs'

import '@/app/config/i18n'
import '@/index.css'
import { Badge } from '@/shared/ds/badge'
import { Button } from '@/shared/ds/button'
import * as chartDs from '@/shared/ds/chart'
import { ChartDataTable, ChartDonutCenter, ChartLegendTiles } from '@/shared/ds/chart'
import { ChartTooltipRow } from '@/shared/ds/chart/chart-tooltip-row'
import { CARD_FACE_ISSUER, CARD_FACE_NAME, imageFrameIndicatorVariants } from '@/shared/ds/image-frame/image-frame-variants'
import { PAGINATION_LABEL } from '@/shared/ds/pagination/pagination-variants'
import { ITEM_LABEL as SIDE_NAV_ITEM_LABEL } from '@/shared/ds/side-navigation/side-navigation-variants'
import { List, ListItem } from '@/shared/ds/list'
import { Skeleton } from '@/shared/ds/skeleton'
import { TreeView } from '@/shared/ds/tree-view'
import { PermissionProvider, UserProvider } from '@/entities/session'
import { CalendarProvider, useCalendar } from '@/features/calendar/model/calendar-context'
import { DndProviderWrapper } from '@/features/calendar/ui/dnd/dnd-provider'
import { DayEventList } from '@/features/calendar/ui/day-event-list'
import { CalendarMonthViewDesktop } from '@/features/calendar/ui/month-view/month-view-desktop'
import { CalendarMonthViewPhone, WeekdayRow } from '@/features/calendar/ui/month-view/month-view-phone'
import { CalendarWeekView } from '@/features/calendar/ui/week-and-day-view/calendar-week-view'
import { YearViewMonth } from '@/features/calendar/ui/year-view/year-view-month'
import { MissingWorkHistoryWidget } from '@/features/dashboard/ui/widgets/MissingWorkHistoryWidget'
import type { IEvent } from '@/features/calendar/model/interfaces'
import { ApprovalSteps } from '@/features/vacation-application/ui/RequestDetail'
import { UserList } from '@/features/admin-authority/ui/UserList'
import { UserRoleAssignmentSkeleton } from '@/features/admin-authority/ui/UserRoleAssignmentSkeleton'
import { ChartSkeleton, DepartmentChartPanel } from '@/features/admin-company/ui/DepartmentChartPanel'
import type { Dept } from '@/features/admin-company/lib/dept-tree'
import { MonthStatsSkeleton } from '@/features/dashboard/ui/widgets/MonthStatsWidget'
import { CheckSelectBox, CheckSelectBoxGroup, RadioSelectBox, RadioSelectBoxGroup } from '@/shared/ds/select-box'
import { ListRowsSkeleton, SelectBoxRowsSkeleton } from '@/shared/ui/groo/skeleton-rows'
import type { GetUserRequestedVacationsResp } from '@/entities/vacation'

const params = new URLSearchParams(window.location.search)
if (params.get('font')) document.documentElement.style.fontSize = `${Number(params.get('font')) * 100}%`

// 시험이 시계를 2026-11-18 10:00 으로 멈춘다(지금 시각 줄 · 오늘 · 홈 달력의 이번 달)
const DAY = '2026-11-18'
const at = (d: string, hm: string) => `${d}T${hm}:00`

const user = { id: 'u1', name: '김이음', picturePath: null }
const vacation = { id: 'DAYOFF', name: '연차', nameKey: 'types.dayoff', type: 'vacation' as const, isDate: true, color: 'purple' as const }
const schedule = { id: 'EDUCATION', name: '교육', nameKey: 'types.education', type: 'schedule' as const, isDate: false, color: 'blue' as const }

// 18일 — 칸에 다 들지 않을 만큼(→ "+N개"). 시간 일정 하나(주 보기 일정 칸)
const events: IEvent[] = [
  { id: 1, startDate: at(DAY, '10:00'), endDate: at(DAY, '12:00'), title: '교육', description: '', user, type: schedule, kind: 'schedule' },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: 10 + i,
    startDate: at(DAY, '00:00'),
    endDate: at(DAY, '23:59'),
    title: '연차',
    description: '',
    user: { ...user, id: `u${i + 2}`, name: `사람${i + 2}` },
    type: vacation,
    kind: 'vacation' as const,
  })),
]

/** 날 · 공휴일을 정해 둔다 — 18일을 보고, 18일은 공휴일 이름이 붙는다 */
function Pin() {
  const { setSelectedDate, setHolidays } = useCalendar()
  useEffect(() => {
    setSelectedDate(new Date(2026, 10, 18))
    setHolidays([
      { holiday_id: 1, holiday_name: '시험 공휴일', holiday_date: DAY, holiday_type: 'PUBLIC', holiday_icon: '', country_code: 'KR', lunar_yn: 'N', lunar_date: '' },
    ])
  }, [setSelectedDate, setHolidays])
  return null
}

// 휴가 신청 결재 단계 — 끝남(✓) · 지금 차례(2) · 기다림(3)
const request = {
  grant_status: 'PROGRESS',
  current_approver_id: 'a2',
  approvers: [1, 2, 3].map((n) => ({
    approval_id: n,
    approver_id: `a${n}`,
    approver_name: `결재자${n}`,
    approval_order: n,
    approval_status: n === 1 ? 'APPROVED' : 'PENDING',
    approval_status_name: '',
    approval_date: n === 1 ? '2026-11-17T09:00:00' : null,
  })),
} as unknown as GetUserRequestedVacationsResp

// 블록 스켈레톤과 견줄 실제 줄
const people = [
  { id: 'p1', name: '김이음', email: 'ieum@groo.test', role_codes: [] },
  { id: 'p2', name: '박그루', email: 'groo@groo.test', role_codes: [] },
]
const dept = {
  department_id: 1,
  // 300% 에서도 한 줄인 짧은 이름 · 설명 — 줄바꿈 수는 글마다 달라 기다림 자리가 미리 알 수 없다
  department_name_kr: '인사팀',
  department_desc: '총무',
  color_code: 'blue',
  children: [],
} as unknown as Dept

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } })
const thisMonth = dayjs(DAY)
// 로그인 확인 — 권한 없는 사용자(일정 추가 · 끌기 없음). 권한 판정이 없으면 캘린더 · 홈 위젯이 그려지지 않는다
queryClient.setQueryData(['auth', 'detail', 'login-check'], { is_login: 'Y', permissions: [] })
queryClient.setQueryData(['works', 'list', { filters: { type: 'unregisteredDates', year: thisMonth.year(), month: thisMonth.month() + 1 } }], {
  unregistered_dates: ['2026-11-03', '2026-11-10'],
  total_unregistered_days: 2,
})

function Scene() {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UserProvider>
        <PermissionProvider>
        <div className='flex flex-col gap-x6 p-x4' style={{ width: 1200 }}>
          {/* ── ds 부품 — 그대로 두는 쪽 ── */}
          <div data-check='ds-static' className='flex flex-wrap items-start gap-x4'>
            <Badge data-measure='static:배지 medium'>예정</Badge>
            <Badge size='large' data-measure='static:배지 large'>
              승인
            </Badge>
            <div style={{ width: 200 }}>
              <ChartDonutCenter label='남은 휴가' amount='12일' />
            </div>
            {/* 도넛 가운데 합계 글 — 들어가는지 재는 쪽과 그리는 쪽이 같이 쓰는 ds 상수(담다 4b215d8e). 이름공간으로 읽어 없으면 빈 클래스 */}
            <span data-measure='static:도넛 가운데 합계 상수' className={(chartDs as Record<string, unknown>).CHART_DONUT_CENTER_AMOUNT as string | undefined ?? ''}>
              12일
            </span>
            <span data-measure='static:쪽 번호' className={PAGINATION_LABEL}>
              12
            </span>
            <span data-measure='static:사진 장수' className={imageFrameIndicatorVariants()}>
              1/3
            </span>
            <span data-measure='static:카드 면 회사' className={CARD_FACE_ISSUER}>
              그루카드
            </span>
            <span data-measure='static:카드 면 이름' className={CARD_FACE_NAME}>
              이음 카드
            </span>
            <Skeleton data-measure='static:스켈레톤 t1-static' text='t1-static' className='w-[40px]' />
          </div>
          {/* ── ds 부품 — 커지는 쪽 ── */}
          <div data-check='ds-grow' className='flex flex-col gap-x4'>
            <Button data-measure='grow:버튼'>저장</Button>
            <ChartLegendTiles items={[{ key: 'used', label: '쓴 휴가', color: 'blue', total: '12일' }]} />
            <ChartDataTable caption='달마다 휴가' columns={['달', '쓴 휴가']} rows={[['1월', '2일']]} visuallyHidden={false} />
            <ChartTooltipRow swatch='blue' name='쓴 휴가' value='2일' />
            <span data-measure='grow:사이드 메뉴 항목 이름' className={SIDE_NAV_ITEM_LABEL}>
              휴가
            </span>
            <Skeleton data-measure='grow:스켈레톤 t1' text='t1' className='w-[40px]' />
          </div>

          {/* ── 이음 화면 — 캘린더 · 홈 달력 · 그날 목록 ── */}
          <CalendarProvider users={[user]}>
            <DndProviderWrapper>
              <Pin />
              <div data-check='phone' style={{ width: 390 }}>
                <WeekdayRow />
                <CalendarMonthViewPhone singleDayEvents={events} multiDayEvents={[]} onDayClick={() => {}} />
              </div>
              <div data-check='desktop'>
                <CalendarMonthViewDesktop singleDayEvents={events} multiDayEvents={[]} onEventClick={() => {}} onCreate={() => {}} />
              </div>
              <div data-check='week' style={{ height: 900 }}>
                <CalendarWeekView singleDayEvents={events.slice(0, 1)} multiDayEvents={[]} onEventClick={() => {}} onCreate={() => {}} />
              </div>
              <div data-check='year' style={{ width: 280 }}>
                <YearViewMonth month={new Date(2026, 10, 1)} events={events} onPickMonth={() => {}} />
              </div>
              <div data-check='day-list' style={{ width: 390 }}>
                <DayEventList events={events.slice(0, 1)} holiday={{ name: '시험 공휴일' }} label='18일' onTapEvent={() => {}} />
              </div>
            </DndProviderWrapper>
          </CalendarProvider>
          {/* 스켈레톤 세 갈래(skeleton.md "크기 — 글은 글줄 높이") — 글 자리 text="tN" 은 커지고, 틀(칸 라벨 · 저장 단추)은 실제 부품 */}
          <div data-check='skeleton' style={{ width: 390 }}>
            <UserRoleAssignmentSkeleton />
          </div>
          {/* 블록 스켈레톤(skeleton.md "틀은 먼저" · "크기 — 글은 글줄 높이") — 기다림 자리와 실제 줄을 나란히. data-pair 의 sk · real 높이를 견준다 */}
          <div className='grid grid-cols-2 gap-x4' style={{ width: 800 }}>
            <div data-pair='list' data-side='sk'>
              <UserList users={[]} selectedUserId={null} onSelectUser={() => {}} loading />
            </div>
            <div data-pair='list' data-side='real'>
              <UserList users={people} selectedUserId={null} onSelectUser={() => {}} />
            </div>
            <div data-pair='list-suffix' data-side='sk'>
              <ListRowsSkeleton count={1} detail={false} suffix />
            </div>
            <div data-pair='list-suffix' data-side='real'>
              <List>
                <ListItem title='결재 1단계' suffix='김결재' suffixText />
              </List>
            </div>
            <div data-pair='radio' data-side='sk'>
              <SelectBoxRowsSkeleton count={1} control='radio' />
            </div>
            <div data-pair='radio' data-side='real'>
              <RadioSelectBoxGroup aria-label='정책'>
                <RadioSelectBox value='a' label='연차 정책' description='매년 1월 1일 · 15일' />
              </RadioSelectBoxGroup>
            </div>
            <div data-pair='check' data-side='sk'>
              <SelectBoxRowsSkeleton count={1} control='check' />
            </div>
            <div data-pair='check' data-side='real'>
              <CheckSelectBoxGroup aria-label='역할'>
                <CheckSelectBox label='관리자' description='모든 권한' checked={false} />
              </CheckSelectBoxGroup>
            </div>
            <div data-pair='org' data-side='sk'>
              <ChartSkeleton />
            </div>
            <div data-pair='org' data-side='real'>
              <DepartmentChartPanel departments={[dept]} />
            </div>
            <div data-pair='tiles' data-side='sk'>
              <MonthStatsSkeleton />
            </div>
            <div data-pair='tiles' data-side='real'>
              <ChartLegendTiles
                items={[
                  { key: 'used', label: '쓴 휴가', color: 'blue', total: '12일' },
                  { key: 'scheduled', label: '예정', color: 'blue', total: '2일', marker: 'outline' },
                ]}
              />
            </div>
          </div>
          {/* 나무 — 꺾쇠 · 체크는 px 그대로, 이름 첫 줄 가운데에 선다(groo-design #263 레시피 — 칸 높이 = 이름 줄 높이). 이름은 두 줄이 되게 길게 */}
          <div data-check='tree' style={{ width: 220 }}>
            <TreeView
              aria-label='부서'
              nodes={[{ id: 'a', label: '경영지원본부 인사총무팀 채용 담당', children: [{ id: 'b', label: '채용' }] }]}
              selectedId='a'
              selectionMark
              defaultExpandedIds={['a']}
            />
          </div>
          <div data-check='steps' style={{ width: 390 }}>
            <ApprovalSteps request={request} />
          </div>
          <div data-check='missing' style={{ width: 390 }}>
            <MissingWorkHistoryWidget />
          </div>
        </div>
        </PermissionProvider>
        </UserProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(<Scene />)
