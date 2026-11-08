import { addMonths, startOfYear } from 'date-fns';
import { useMemo } from 'react';

import { useCalendar } from '@/features/calendar/model/calendar-context';

import { YearViewMonth } from '@/features/calendar/ui/year-view/year-view-month';

import type { IEvent } from '@/features/calendar/model/interfaces';

interface IProps {
  allEvents: IEvent[];
}

const CalendarYearView = ({ allEvents }: IProps) => {
  const { selectedDate } = useCalendar();

  const months = useMemo(() => {
    const yearStart = startOfYear(selectedDate);
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
  }, [selectedDate]);

  return (
    <div className='w-full h-full overflow-y-auto scrollbar-hide p-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 min-[64rem]:grid-cols-3 min-[80rem]:grid-cols-4'>
        {months.map(month => (
          <YearViewMonth key={month.toString()} month={month} events={allEvents} />
        ))}
      </div>
    </div>
  )
}

export { CalendarYearView }
