import { addDays, areIntervalsOverlapping, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { dayTone } from '@/features/calendar/ui/month-view/day-tone';
import { formatDayText, formatHourMinute } from '@/shared/lib/date-text';
import { useCanAddEvent } from '@/features/calendar/model/use-can-edit-event';
import { useCalendar } from '@/features/calendar/model/calendar-context';

import { DroppableTimeBlock } from '@/features/calendar/ui/dnd/droppable-time-block';
import { CalendarTimeline } from '@/features/calendar/ui/week-and-day-view/calendar-time-line';
import { EventBlock } from '@/features/calendar/ui/week-and-day-view/event-block';
import { WeekViewMultiDayEventsRow } from '@/features/calendar/ui/week-and-day-view/week-view-multi-day-events-row';

import { getEventBlockStyle, getVisibleHours, groupEvents, isWorkingHour } from '@/features/calendar/lib/helpers';
import { cn } from '@/shared/lib'

import type { IEvent } from '@/features/calendar/model/interfaces';

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  onEventClick: (event: IEvent) => void;
  /** 빈 시간 칸을 누름 → 그 날 · 시각으로 일정 폼 */
  onCreate: (date: Date, startTime: { hour: number; minute: number }) => void;
}

export function CalendarWeekView({ singleDayEvents, multiDayEvents, onEventClick, onCreate }: IProps) {
  const { i18n } = useTranslation();
  const { selectedDate, workingHours, visibleHours, findHolidayByDate } = useCalendar();
  const canAddEvent = useCanAddEvent();

  const locale = i18n.language === 'ko' ? ko : enUS;
  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, singleDayEvents);

  const weekStart = startOfWeek(selectedDate, { locale });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className='w-full h-full'>
      <div className='flex h-full flex-col'>
        {/* 머리도 스크롤 상자와 같은 스크롤바 자리를 비운다 — 열이 머리 날짜와 어긋나지 않는다 */}
        <div className='overflow-x-hidden overflow-y-hidden [scrollbar-gutter:stable]'>
          <WeekViewMultiDayEventsRow selectedDate={selectedDate} multiDayEvents={multiDayEvents} onEventClick={onEventClick} />

          {/* Week header */}
          <div className='relative z-20 flex border-b border-stroke-neutral-subtle'>
            <div className='w-18'></div>
            <div className='grid flex-1 grid-cols-7 divide-x divide-stroke-neutral-subtle border-l border-stroke-neutral-subtle'>
              {weekDays.map((day, index) => {
                const dayOfWeek = day.getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;

                // 공휴일 정보 가져오기
                const holiday = findHolidayByDate(dayjs(day).format('YYYY-MM-DD'));

                const tone = dayTone({ currentMonth: true, sunday: isSunday, saturday: isSaturday, holiday });

                return (
                  <div key={index} className='py-2 text-center text-xs font-medium'>
                    <div className={tone}>
                      {format(day, 'EE', { locale })} <span className='ml-1 font-semibold'>{format(day, 'd')}</span>
                    </div>
                    {holiday && <div className={cn('mt-0.5 text-xs', tone)}>{holiday.holiday_name}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]'>
          <div className='flex overflow-hidden'>
            {/* Hours column */}
            <div className='relative w-18'>
              {hours.map((hour, index) => (
                <div key={hour} className='relative' style={{ height: '96px' }}>
                  <div className='absolute -top-3 right-2 flex h-6 items-center'>
                    {index !== 0 && <span className='text-xs text-fg-neutral-subtle'>{formatHourMinute(hour)}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Week grid */}
            <div className='relative flex-1 border-l border-stroke-neutral-subtle'>
              <div className='grid grid-cols-7 divide-x divide-stroke-neutral-subtle'>
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = singleDayEvents.filter(event => isSameDay(parseISO(event.startDate), day) || isSameDay(parseISO(event.endDate), day));
                  const groupedEvents = groupEvents(dayEvents);

                  return (
                    <div key={dayIndex} className='relative'>
                      {hours.map((hour, index) => {
                        const isDisabled = !isWorkingHour(day, hour, workingHours);

                        return (
                          <div key={hour} className={cn('relative', isDisabled && 'bg-bg-neutral-weak')} style={{ height: '96px' }}>
                            {index !== 0 && <div className='pointer-events-none absolute inset-x-0 top-0 border-b border-stroke-neutral-subtle'></div>}

                            <DroppableTimeBlock date={day} hour={hour} minute={0}>
                              {canAddEvent && (
                                <button
                                  type='button'
                                  aria-label={`${formatDayText(day)} ${formatHourMinute(hour, 0)}`}
                                  className='absolute inset-x-0 top-0 h-[48px] cursor-pointer transition-colors hover:bg-bg-neutral-weak focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring'
                                  onClick={() => onCreate(day, { hour, minute: 0 })}
                                />
                              )}
                            </DroppableTimeBlock>

                            <div className='pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-stroke-neutral-subtle'></div>

                            <DroppableTimeBlock date={day} hour={hour} minute={30}>
                              {canAddEvent && (
                                <button
                                  type='button'
                                  aria-label={`${formatDayText(day)} ${formatHourMinute(hour, 30)}`}
                                  className='absolute inset-x-0 top-[48px] h-[48px] cursor-pointer transition-colors hover:bg-bg-neutral-weak focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring'
                                  onClick={() => onCreate(day, { hour, minute: 30 })}
                                />
                              )}
                            </DroppableTimeBlock>
                          </div>
                        );
                      })}

                      {groupedEvents.map((group, groupIndex) =>
                        group.map(event => {
                          let style = getEventBlockStyle(event, day, groupIndex, groupedEvents.length, { from: earliestEventHour, to: latestEventHour });
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
                              <EventBlock event={event} onClick={onEventClick} />
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>

              <CalendarTimeline firstVisibleHour={earliestEventHour} lastVisibleHour={latestEventHour} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
