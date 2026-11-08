import { areIntervalsOverlapping, format, parseISO } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { Activity } from 'react';
import { useTranslation } from 'react-i18next';

import { usePermission } from '@/entities/session';
import { useCalendar } from '@/features/calendar/model/calendar-context';

import { Calendar } from '@/shared/ui/shadcn/calendar';
import { ScrollArea } from '@/shared/ui/shadcn/scrollArea';

import { AddEventDialog } from '@/features/calendar/ui/dialogs/add-event-dialog';
import { DroppableTimeBlock } from '@/features/calendar/ui/dnd/droppable-time-block';
import { CalendarTimeline } from '@/features/calendar/ui/week-and-day-view/calendar-time-line';
import { DayViewMultiDayEventsRow } from '@/features/calendar/ui/week-and-day-view/day-view-multi-day-events-row';
import { EventBlock } from '@/features/calendar/ui/week-and-day-view/event-block';

import { getCurrentEvents, getEventBlockStyle, getVisibleHours, groupEvents, isWorkingHour } from '@/features/calendar/lib/helpers';
import { cn } from '@/shared/lib'

import type { IEvent } from '@/features/calendar/model/interfaces';

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

export function CalendarDayView({ singleDayEvents, multiDayEvents }: IProps) {
  const { t, i18n } = useTranslation('calendar');
  const { selectedDate, setSelectedDate, users, visibleHours, workingHours, findHolidayByDate, holidays } = useCalendar();
  const { hasAnyPermission } = usePermission();

  // 권한 체크: 둘 중 하나라도 있으면 일정 추가 가능
  const canAddEvent = hasAnyPermission(['VACATION:USE', 'VACATION:MANAGE', 'SCHEDULE:WRITE', 'SCHEDULE:MANAGE']);

  const locale = i18n.language === 'ko' ? ko : enUS;
  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, singleDayEvents);

  const currentEvents = getCurrentEvents(singleDayEvents);

  // 공휴일 정보 가져오기
  const holiday = findHolidayByDate(dayjs(selectedDate).format('YYYY-MM-DD'));

  // 공휴일 색상 결정
  let holidayColor = '';
  if (holiday) {
    if (holiday.holiday_type === 'PUBLIC' || holiday.holiday_type === 'SUBSTITUTE') {
      holidayColor = '#ff6767'; // 빨강
    } else if (holiday.holiday_type === 'ETC') {
      holidayColor = '#6767ff'; // 파랑
    }
  }

  // Calendar 컴포넌트를 위한 공휴일 modifiers 생성
  const publicHolidays = holidays
    .filter(h => h.holiday_type === 'PUBLIC' || h.holiday_type === 'SUBSTITUTE')
    .map(h => new Date(h.holiday_date));

  const etcHolidays = holidays
    .filter(h => h.holiday_type === 'ETC')
    .map(h => new Date(h.holiday_date));

  const dayEvents = singleDayEvents.filter(event => {
    const eventDate = parseISO(event.startDate);
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const groupedEvents = groupEvents(dayEvents);

  return (
    <div className='w-full h-full flex'>
      <div className='flex flex-1 flex-col h-full'>
        <div>
          <DayViewMultiDayEventsRow selectedDate={selectedDate} multiDayEvents={multiDayEvents} />

          {/* Day header */}
          <div className='relative z-20 flex border-b'>
            <div className='w-18'></div>
            <div className='flex-1 border-l py-2 text-center text-xs font-medium'>
              <div style={{ color: holidayColor || (selectedDate.getDay() === 0 ? '#ff6767' : selectedDate.getDay() === 6 ? '#6767ff' : undefined) }}>
                {format(selectedDate, 'EE', { locale })} <span className='font-semibold'>{format(selectedDate, 'd')}</span>
              </div>
              {holiday && (
                <div className='text-xs mt-0.5' style={{ color: holidayColor }}>
                  {holiday.holiday_name}
                </div>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className='flex-1' type='always'>
          <div className='flex'>
            {/* Hours column */}
            <div className='relative w-18'>
              {hours.map((hour, index) => (
                <div key={hour} className='relative' style={{ height: '96px' }}>
                  <div className='absolute -top-3 right-2 flex h-6 items-center'>
                    {index !== 0 && <span className='text-xs text-muted-foreground'>{format(new Date().setHours(hour, 0, 0, 0), 'hh a')}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className='relative flex-1 border-l'>
              <div className='relative'>
                {hours.map((hour, index) => {
                  const isDisabled = !isWorkingHour(selectedDate, hour, workingHours);

                  return (
                    <div key={hour} className={cn('relative', isDisabled && 'bg-calendar-disabled-hour')} style={{ height: '96px' }}>
                      {index !== 0 && <div className='pointer-events-none absolute inset-x-0 top-0 border-b'></div>}

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={0}>
                        <Activity mode={canAddEvent ? 'visible' : 'hidden'}>
                          <AddEventDialog startDate={selectedDate} startTime={{ hour, minute: 0 }}>
                            <div className='absolute inset-x-0 top-0 h-[48px] cursor-pointer transition-colors hover:bg-accent' />
                          </AddEventDialog>
                        </Activity>
                      </DroppableTimeBlock>

                      <div className='pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed'></div>

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={30}>
                        <Activity mode={canAddEvent ? 'visible' : 'hidden'}>
                          <AddEventDialog startDate={selectedDate} startTime={{ hour, minute: 30 }}>
                            <div className='absolute inset-x-0 top-[48px] h-[48px] cursor-pointer transition-colors hover:bg-accent' />
                          </AddEventDialog>
                        </Activity>
                      </DroppableTimeBlock>
                    </div>
                  );
                })}

                {groupedEvents.map((group, groupIndex) =>
                  group.map(event => {
                    let style = getEventBlockStyle(event, selectedDate, groupIndex, groupedEvents.length, { from: earliestEventHour, to: latestEventHour });
                    const hasOverlap = groupedEvents.some(
                      (otherGroup, otherIndex) =>
                        otherIndex !== groupIndex &&
                        otherGroup.some(otherEvent =>
                          areIntervalsOverlapping(
                            { start: parseISO(event.startDate), end: parseISO(event.endDate) },
                            { start: parseISO(otherEvent.startDate), end: parseISO(otherEvent.endDate) }
                          )
                        )
                    );

                    if (!hasOverlap) style = { ...style, width: '100%', left: '0%' };

                    return (
                      <div key={event.id} className='absolute p-1' style={style}>
                        <EventBlock event={event} />
                      </div>
                    );
                  })
                )}
              </div>

              <CalendarTimeline firstVisibleHour={earliestEventHour} lastVisibleHour={latestEventHour} />
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className='hidden w-64 divide-y border-l min-[48rem]:block'>
        <Calendar
          className='mx-auto w-fit'
          mode='single'
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={locale}
          initialFocus
          modifiers={{
            publicHoliday: publicHolidays,
            etcHoliday: etcHolidays
          }}
          modifiersStyles={{
            publicHoliday: { color: '#ff6767' },
            etcHoliday: { color: '#6767ff' }
          }}
        />

        <div className='flex-1 space-y-3'>
          {currentEvents.length > 0 ? (
            <div className='flex items-start gap-2 px-4 pt-4'>
              <span className='relative mt-[5px] flex size-2.5'>
                <span className='absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75'></span>
                <span className='relative inline-flex size-2.5 rounded-full bg-green-600'></span>
              </span>

              <p className='text-sm font-semibold text-foreground'>{t('dayView.happeningNow')}</p>
            </div>
          ) : (
            <p className='p-4 text-center text-sm italic text-muted-foreground'>{t('dayView.noAppointments')}</p>
          )}

          {currentEvents.length > 0 && (
            <ScrollArea className='h-[422px] px-4' type='always'>
              <div className='space-y-6 pb-4'>
                {currentEvents.map(event => {
                  const user = users.find(user => user.id === event.user.id);

                  return (
                    <div key={event.id} className='space-y-1.5'>
                      <p className='line-clamp-2 text-sm font-semibold'>{event.title}</p>

                      {user && (
                        <div className='flex items-center gap-1.5 text-muted-foreground'>
                          <User className='size-3.5' />
                          <span className='text-sm'>{user.name}</span>
                        </div>
                      )}

                      <div className='flex items-center gap-1.5 text-muted-foreground'>
                        <CalendarIcon className='size-3.5' />
                        <span className='text-sm'>{format(new Date(), i18n.language === 'ko' ? 'yyyy년 M월 d일' : 'MMM d, yyyy', { locale })}</span>
                      </div>

                      <div className='flex items-center gap-1.5 text-muted-foreground'>
                        <Clock className='size-3.5' />
                        <span className='text-sm'>
                          {format(parseISO(event.startDate), i18n.language === 'ko' ? 'a h:mm' : 'h:mm a', { locale })} - {format(parseISO(event.endDate), i18n.language === 'ko' ? 'a h:mm' : 'h:mm a', { locale })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
