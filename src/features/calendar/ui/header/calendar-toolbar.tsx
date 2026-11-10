import { addMonths, addWeeks, addYears, endOfWeek, format, startOfWeek, subMonths, subWeeks, subYears } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { SegmentedControl, SegmentedControlItem } from '@/shared/ds/segmented-control'
import { cn } from '@/shared/lib/cn'
import { formatPeriodText } from '@/shared/lib/date-text'
import { FilterChips } from '@/features/calendar/ui/header/filter-chips'
import { useCalendar } from '@/features/calendar/model/calendar-context'
import type { IUser } from '@/features/calendar/model/interfaces'
import type { TCalendarView } from '@/features/calendar/model/types'

/** 보기 단추 차례 — 768 이상 주 · 월 · 년 · 목록(처음 월), 768 미만 월 · 목록(G 31) */
const VIEWS_DESKTOP: TCalendarView[] = ['week', 'month', 'year', 'agenda']
const VIEWS_PHONE: TCalendarView[] = ['month', 'agenda']

/** 한 칸 옮기는 단위 — 월 · 목록은 달, 주는 한 주, 년은 한 해 */
const step = (view: TCalendarView, date: Date, dir: 1 | -1): Date => {
  if (view === 'week') return dir > 0 ? addWeeks(date, 1) : subWeeks(date, 1)
  if (view === 'year') return dir > 0 ? addYears(date, 1) : subYears(date, 1)
  return dir > 0 ? addMonths(date, 1) : subMonths(date, 1)
}

/** 도구 줄 달 글 — 월 · 목록 "2026년 10월", 년 "2026년", 주는 그 주 기간 */
const titleOf = (view: TCalendarView, date: Date, ko_: boolean): string => {
  const locale = ko_ ? ko : enUS
  if (view === 'year') return format(date, ko_ ? 'yyyy년' : 'yyyy', { locale })
  if (view === 'week') return formatPeriodText(format(startOfWeek(date), "yyyy-MM-dd'T'00:00:00"), format(endOfWeek(date), "yyyy-MM-dd'T'23:59:59"))
  return format(date, ko_ ? 'yyyy년 M월' : 'MMMM yyyy', { locale })
}

/**
 * 도구 줄(G 31) — ‹ 달 글 › · "오늘" · 필터 칩 둘 · 보기 Segmented Control.
 * 폰(768 미만): 달 줄(‹ 달 › + 오른쪽 월 · 목록) 아래 칩 줄. 데스크톱 · 태블릿은 격자 카드 안 맨 위 한 줄이고 좁으면 다음 줄로 넘어간다.
 */
export function CalendarToolbar({ desktop, people }: { desktop: boolean; people: IUser[] }) {
  const { t, i18n } = useTranslation('calendar')
  const { selectedDate, setSelectedDate, view, setView } = useCalendar()
  const isKo = i18n.language.startsWith('ko')
  const views = desktop ? VIEWS_DESKTOP : VIEWS_PHONE
  const unit = view === 'week' ? 'Week' : view === 'year' ? 'Year' : 'Month'
  const title = titleOf(view, selectedDate, isKo)

  const nav = (
    <div className='flex min-w-0 items-center gap-x1'>
      <Button aria-label={t(`header.prev${unit}`)} variant='ghost' size='medium' layout='iconOnly' onClick={() => setSelectedDate(step(view, selectedDate, -1))} data-nav='prev'>
        <ChevronLeft />
      </Button>
      <span data-slot='calendar-title' aria-live='polite' className={cn('min-w-0 font-bold text-fg-neutral [word-break:keep-all]', desktop ? 'text-t7' : 'text-t6')}>
        {title}
      </span>
      <Button aria-label={t(`header.next${unit}`)} variant='ghost' size='medium' layout='iconOnly' onClick={() => setSelectedDate(step(view, selectedDate, 1))} data-nav='next'>
        <ChevronRight />
      </Button>
    </div>
  )

  const segmented = (
    <SegmentedControl aria-label={t('view.label')} value={view} onValueChange={(v) => setView(v as TCalendarView)} className={desktop ? 'w-[260px] max-w-full' : 'w-[148px]'}>
      {views.map((v) => (
        <SegmentedControlItem key={v} value={v}>
          {t(`view.${v}`)}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )

  const today = (
    <Button variant='neutralOutline' size='small' onClick={() => setSelectedDate(new Date())} data-slot='calendar-today'>
      {t('header.today')}
    </Button>
  )

  if (desktop) {
    // 카드 폭이 넉넉하면 한 줄(달 · 칩 · 보기), 좁으면 칩이 다음 줄로 내려간다(컨테이너 폭 기준)
    return (
      <div data-slot='calendar-toolbar' className='@container/toolbar'>
        <div className='flex flex-wrap items-center gap-x-x3 gap-y-x2 px-x4 py-x3'>
          <div className='order-1 flex items-center gap-x3'>
            {nav}
            {today}
          </div>
          <div className='order-3 w-full min-w-0 @min-[56rem]/toolbar:order-2 @min-[56rem]/toolbar:w-auto'>
            <FilterChips people={people} />
          </div>
          <div className='order-2 ml-auto @min-[56rem]/toolbar:order-3'>{segmented}</div>
        </div>
      </div>
    )
  }
  return (
    <div data-slot='calendar-toolbar' className='flex flex-col gap-x2 pb-x2'>
      <div className='flex flex-wrap items-center justify-between gap-x-x2 gap-y-x1 pl-x3 pr-x4'>
        {nav}
        {segmented}
      </div>
      <div className='flex flex-wrap items-center gap-x2 px-x6'>
        {today}
        <FilterChips people={people} />
      </div>
    </div>
  )
}
