import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ds/button'
import { Skeleton } from '@/shared/ds/skeleton'
import { useUnregisteredWorkDatesQuery } from '@/entities/work'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/**
 * 월별 업무 미작성 알림(D 32 — 홈뿐) — 머리 줄(이전 달 · "{yyyy}년 {m}월" · 다음 달) + 보기만 하는 7열 달력 + 범례.
 * 날짜를 누르지 않는다(고르는 달력이 아니다). 오늘은 1.5px 고리 + 굵게, 앞으로 올 날은 흐리게, 쓰지 않은 날은 옅은 빨강 원 + 굵게.
 * 다음 달 단추는 이번 달에서 막는다(앞으로 올 달에는 쓰지 않은 날이 없다). 이 격자는 화면 몫이라 ds Date Picker 를 쓰지 않는다(좁은 열에 들지 않는다).
 */
export const MissingWorkHistoryWidget = () => {
  const { t, i18n } = useTranslation('dashboard')
  const today = dayjs()
  const [month, setMonth] = useState(() => today.startOf('month'))
  const query = useUnregisteredWorkDatesQuery(month.year(), month.month() + 1, { quiet: true })
  const isCurrent = month.isSame(today, 'month')
  const missing = new Set((query.data?.unregistered_dates ?? []).map((d) => dayjs(d).format('YYYY-MM-DD')))
  const monthText = t('missing.monthTitle', { year: month.year(), month: month.month() + 1 })

  // 일요일 시작 — 앞 달 · 뒤 달 칸은 채우지 않는다(주 수만큼 5 · 6줄)
  const lead = month.startOf('month').day()
  const days = month.daysInMonth()
  const cells: (number | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7))
  const weekdayFormat = new Intl.DateTimeFormat(i18n.language.startsWith('ko') ? 'ko-KR' : 'en-US', { weekday: 'narrow' })
  const weekdays = Array.from({ length: 7 }, (_, i) => weekdayFormat.format(new Date(2023, 0, 1 + i)))

  const readDay = (d: number) => t('missing.dayMissing', { month: month.month() + 1, day: d })

  return (
    <WidgetFrame id='missing-work-history'>
      <div className='flex items-center justify-between gap-x2' data-missing-head>
        <Button variant='ghost' size='medium' layout='iconOnly' aria-label={t('missing.prev')} onClick={() => setMonth((m) => m.subtract(1, 'month'))}>
          <ChevronLeft />
        </Button>
        <span aria-live='polite' className='text-t5 font-bold text-fg-neutral' data-missing-title>
          {monthText}
        </span>
        <Button variant='ghost' size='medium' layout='iconOnly' aria-label={t('missing.next')} disabled={isCurrent} onClick={() => setMonth((m) => m.add(1, 'month'))}>
          <ChevronRight />
        </Button>
      </div>
      <WidgetBoundary id='missing-work-history' queries={[query]} fallback={<MissingSkeleton />}>
        <table className='mt-x2 w-full table-fixed border-collapse' data-missing-grid>
          <caption className='sr-only'>{monthText}</caption>
          <thead>
            <tr>
              {weekdays.map((w, i) => (
                <th key={i} scope='col' className='h-x7 p-0 text-t2 font-normal text-fg-neutral-subtle'>
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((d, di) => {
                  if (d == null) return <td key={di} className='h-x9 p-0' />
                  const key = month.date(d).format('YYYY-MM-DD')
                  const isMissing = missing.has(key)
                  const isToday = isCurrent && d === today.date()
                  const future = isCurrent && d > today.date()
                  return (
                    <td key={di} className='h-x9 p-0 text-center' data-day={d} data-missing={isMissing || undefined}>
                      <span
                        className={cn(
                          'inline-flex size-[30px] items-center justify-center rounded-full text-t3 font-medium tabular-nums text-fg-neutral',
                          future && 'font-normal text-fg-neutral-subtle',
                          isToday && 'font-bold outline-[1.5px] -outline-offset-[1.5px] outline-stroke-neutral-contrast',
                          isMissing && 'bg-bg-critical-weak font-bold text-fg-critical-contrast',
                        )}
                      >
                        {d}
                        {isMissing && <span className='sr-only'>{readDay(d)}</span>}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className='m-0 mt-x3 flex items-center gap-x1_5 text-t3 font-normal text-fg-neutral-subtle' data-missing-legend>
          {missing.size > 0 ? (
            <>
              <span aria-hidden className='size-x2_5 shrink-0 rounded-full bg-bg-critical-weak ring-1 ring-fg-critical-contrast' />
              <span>{t('missing.legend', { count: missing.size })}</span>
            </>
          ) : (
            <span>{t(isCurrent ? 'missing.noneThisMonth' : 'missing.noneMonth', { month: month.month() + 1 })}</span>
          )}
        </p>
      </WidgetBoundary>
    </WidgetFrame>
  )
}

const MissingSkeleton = () => (
  <div className='mt-x2 flex flex-col gap-x2'>
    <div className='grid grid-cols-7 gap-x1'>
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} text='t2' className='block w-full' />
      ))}
    </div>
    <div className='grid grid-cols-7 gap-x1'>
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} radius='full' className='mx-auto block size-[30px]' />
      ))}
    </div>
  </div>
)
