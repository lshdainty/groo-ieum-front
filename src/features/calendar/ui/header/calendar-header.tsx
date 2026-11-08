import { CalendarRange, Columns, Grid2x2, Grid3x3, List, Plus } from 'lucide-react';
import { Activity } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/shadcn/button';
import { usePermission } from '@/entities/session';
import { useCalendar } from '@/features/calendar/model/calendar-context';

import { AddEventDialog } from '@/features/calendar/ui/dialogs/add-event-dialog';
import { DateNavigator } from '@/features/calendar/ui/header/date-navigator';
import { EventFilter } from '@/features/calendar/ui/header/event-filter';
import { TodayButton } from '@/features/calendar/ui/header/today-button';

import type { IEvent } from '@/features/calendar/model/interfaces';

interface IProps {
  events: IEvent[];
}

export function CalendarHeader({ events }: IProps) {
  const { t } = useTranslation('calendar');
  const { view, setView } = useCalendar();
  const { hasAnyPermission } = usePermission();

  // 권한 체크: 둘 중 하나라도 있으면 일정 추가 가능
  const canAddEvent = hasAnyPermission(['VACATION:USE', 'VACATION:MANAGE', 'SCHEDULE:WRITE', 'SCHEDULE:MANAGE']);

  return (
    <div className='flex flex-col gap-4 border-b p-4 min-[64rem]:flex-row min-[64rem]:items-center min-[64rem]:justify-between'>
      <div className='flex items-center gap-3'>
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </div>

      <div className='flex flex-col items-center gap-1.5 min-[40rem]:flex-row min-[40rem]:justify-between'>
        <div className='flex w-full items-center gap-1.5'>
          <div className='inline-flex first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none'>
            <Button
              aria-label='View by day'
              size='icon'
              variant={view === 'day' ? 'default' : 'outline'}
              className='rounded-r-none [&_svg]:size-10'
              onClick={() => setView('day')}
            >
              <List strokeWidth={1.8} />
            </Button>

            <Button
              aria-label='View by week'
              size='icon'
              variant={view === 'week' ? 'default' : 'outline'}
              className='-ml-px rounded-none [&_svg]:size-10'
              onClick={() => setView('week')}
            >
              <Columns strokeWidth={1.8} />
            </Button>

            <Button
              aria-label='View by month'
              size='icon'
              variant={view === 'month' ? 'default' : 'outline'}
              className='-ml-px rounded-none [&_svg]:size-10'
              onClick={() => setView('month')}
            >
              <Grid2x2 strokeWidth={1.8} />
            </Button>

            <Button
              aria-label='View by year'
              size='icon'
              variant={view === 'year' ? 'default' : 'outline'}
              className='-ml-px rounded-none [&_svg]:size-10'
              onClick={() => setView('year')}
            >
              <Grid3x3 strokeWidth={1.8} />
            </Button>

            <Button
              aria-label='View by agenda'
              size='icon'
              variant={view === 'agenda' ? 'default' : 'outline'}
              className='-ml-px rounded-l-none [&_svg]:size-10'
              onClick={() => setView('agenda')}
            >
              <CalendarRange strokeWidth={1.8} />
            </Button>
          </div>

          <EventFilter />
        </div>

        <Activity mode={canAddEvent ? 'visible' : 'hidden'}>
          <AddEventDialog>
            <Button className='w-full min-[40rem]:w-auto'>
              <Plus />
              {t('header.addEvent')}
            </Button>
          </AddEventDialog>
        </Activity>
      </div>
    </div>
  );
}
