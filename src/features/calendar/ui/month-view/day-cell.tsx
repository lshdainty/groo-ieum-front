import { isToday, startOfDay } from 'date-fns';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { useCalendar } from '@/features/calendar/model/calendar-context';
import { useDragSelect } from '@/features/calendar/model/drag-select-context';

import { DroppableDayCell } from '@/features/calendar/ui/dnd/droppable-day-cell';
import { EventBullet } from '@/features/calendar/ui/month-view/event-bullet';
import { MonthEventBadge } from '@/features/calendar/ui/month-view/month-event-badge';

import { getMonthCellEvents } from '@/features/calendar/lib/helpers';
import { cn } from '@/shared/lib'

import type { ICalendarCell, IEvent } from '@/features/calendar/model/interfaces';

interface IProps {
  cell: ICalendarCell;
  events: IEvent[];
  eventPositions: Record<string, number>;
  maxVisibleEvents: number;
}

const DayCell = ({ cell, events, eventPositions, maxVisibleEvents }: IProps) => {
  const { setSelectedDate, setView, findHolidayByDate } = useCalendar();
  const { selectionStart, selectionEnd, startSelection, updateSelection, endSelection } = useDragSelect();

  const { day, currentMonth, date } = cell;

  const cellEvents = useMemo(() => getMonthCellEvents(date, events, eventPositions), [date, events, eventPositions]);
  const isSunday = date.getDay() === 0;
  const isSaturday = date.getDay() === 6;

  // 공휴일 정보 가져오기
  const holiday = findHolidayByDate(dayjs(date).format('YYYY-MM-DD'));

  // 공휴일 색상 결정
  let holidayColor = '';
  if (holiday) {
    if (holiday.holiday_type === 'PUBLIC' || holiday.holiday_type === 'SUBSTITUTE') {
      holidayColor = '#ff6767'; // 빨강
    } else if (holiday.holiday_type === 'ETC') {
      holidayColor = '#6767ff'; // 파랑
    }
  }

  const handleClick = () => {
    setSelectedDate(date);
    setView('day');
  };

  const isSelected = useMemo(() => {
    if (!selectionStart || !selectionEnd) return false;
    
    const start = dayjs(selectionStart).isBefore(selectionEnd) ? selectionStart : selectionEnd;
    const end = dayjs(selectionStart).isBefore(selectionEnd) ? selectionEnd : selectionStart;
    
    // Compare dates (ignoring time)
    const cellDate = dayjs(date).startOf('day');
    const startDate = dayjs(start).startOf('day');
    const endDate = dayjs(end).startOf('day');

    return (cellDate.isSame(startDate) || cellDate.isAfter(startDate)) && 
           (cellDate.isSame(endDate) || cellDate.isBefore(endDate));
  }, [date, selectionStart, selectionEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent selection if clicking on a button or event
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('[role="button"]') ||
      target.closest('[draggable]')
    ) {
      return;
    }
    startSelection(date);
  };

  const handleMouseEnter = () => {
    updateSelection(date);
  };

  const handleMouseUp = () => {
    endSelection();
  };

  return (
    <DroppableDayCell cell={cell}>
      <div 
        className={cn(
          'flex h-full flex-col gap-1 border-l border-t py-1.5 min-[64rem]:pb-2 min-[64rem]:pt-1 select-none', 
          isSunday && 'border-l-0',
          isSelected && 'bg-blue-100/50 dark:bg-blue-900/20 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.5)]'
        )}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
      >
        {/* 첫 번째 줄: 날짜와 공휴일 */}
        <div className='flex items-center justify-between px-1'>
          <div className='flex items-center gap-1 flex-1 min-w-0'>
            <button
              onClick={handleClick}
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-xs font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex-shrink-0',
                !currentMonth && 'opacity-20',
                isToday(date) && 'bg-primary font-bold text-primary-foreground hover:bg-primary'
              )}
              style={{
                color: isToday(date) ? undefined : holidayColor || (isSunday ? '#ff6767' : isSaturday ? '#6767ff' : undefined)
              }}
            >
              {day}
            </button>

            {holiday && (
              <span
                className={cn('hidden min-[64rem]:block text-xs truncate', !currentMonth && 'opacity-20')}
                style={{ color: holidayColor }}
              >
                {holiday.holiday_name}
              </span>
            )}
          </div>

          {cellEvents.length > maxVisibleEvents && (
            <button
              onClick={handleClick}
              className={cn(
                'text-xs font-semibold text-muted-foreground flex-shrink-0 px-0.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded',
                !currentMonth && 'opacity-50'
              )}
            >
              <span className='min-[40rem]:hidden'>+{cellEvents.length - maxVisibleEvents}</span>
              <span className='hidden min-[40rem]:inline'>{cellEvents.length - maxVisibleEvents} more</span>
            </button>
          )}
        </div>

        {/* 두 번째 줄: 이벤트들 */}
        <div className={cn('flex flex-1 h-6 gap-1 px-2 min-[64rem]:flex-col min-[64rem]:gap-2 min-[64rem]:px-0', !currentMonth && 'opacity-50')}>
          {Array.from({ length: maxVisibleEvents }, (_, i) => i).map(position => {
            const event = cellEvents.find(e => e.position === position);
            const eventKey = event ? `event-${event.id}-${position}` : `empty-${position}`;

            return (
              <div key={eventKey} className='min-[64rem]:min-h-[28px]'>
                {event && (
                  <>
                    <EventBullet className='min-[64rem]:hidden' color={event.type.color} />
                    <MonthEventBadge className='hidden min-[64rem]:flex' event={event} cellDate={startOfDay(date)} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DroppableDayCell>
  )
}

export { DayCell };

