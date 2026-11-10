import { format, getDaysInMonth, isSameDay, parseISO, startOfMonth } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/lib/cn'
import { YearViewDayCell } from '@/features/calendar/ui/year-view/year-view-day-cell'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  month: Date
  events: IEvent[]
  onPickMonth: (date: Date) => void
}

const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

const YearViewMonth = ({ month, events, onPickMonth }: IProps) => {
  const { i18n } = useTranslation()
  const isKo = i18n.language.startsWith('ko')
  const weekDays = isKo ? WEEK_DAYS_KO : WEEK_DAYS_EN
  const monthName = format(month, isKo ? 'M월' : 'MMMM', { locale: isKo ? ko : enUS })

  const daysInMonth = useMemo(() => {
    const totalDays = getDaysInMonth(month)
    const firstDay = startOfMonth(month).getDay()
    return [...Array(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)]
  }, [month])

  return (
    <div className='flex flex-col overflow-hidden rounded-r4 border border-stroke-neutral-subtle'>
      <button
        type='button'
        onClick={() => onPickMonth(new Date(month.getFullYear(), month.getMonth(), 1))}
        className='w-full border-0 border-b border-solid border-stroke-neutral-subtle bg-transparent px-x3 py-x2 text-start text-t4 font-bold text-fg-neutral hover:bg-bg-neutral-weak focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring'
      >
        {monthName}
      </button>

      <div className='flex-1 space-y-x2 p-x3'>
        <div className='grid grid-cols-7 gap-x-x0_5 text-center'>
          {weekDays.map((day, index) => (
            <div key={index} className={cn('text-t2 font-medium text-fg-neutral-subtle', index === 0 && 'text-fg-critical', index === 6 && 'text-fg-informative')}>
              {day}
            </div>
          ))}
        </div>

        <div className='grid grid-cols-7 gap-x-x0_5 gap-y-x2'>
          {daysInMonth.map((day, index) => {
            if (day === null) return <div key={`blank-${index}`} className='h-10' />
            const date = new Date(month.getFullYear(), month.getMonth(), day)
            const dayEvents = events.filter((event) => isSameDay(parseISO(event.startDate), date))
            return <YearViewDayCell key={`day-${day}`} day={day} date={date} events={dayEvents} onPick={onPickMonth} />
          })}
        </div>
      </div>
    </div>
  )
}

export { YearViewMonth }
