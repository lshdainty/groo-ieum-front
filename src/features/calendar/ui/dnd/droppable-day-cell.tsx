'use client';

import { differenceInMilliseconds, parseISO } from 'date-fns';
import { useDrop } from 'react-dnd';

import { useUpdateEvent } from '@/features/calendar/lib/hooks/use-update-event';

import { ItemTypes } from '@/features/calendar/ui/dnd/draggable-event';
import { cn } from '@/shared/lib'

import type { ICalendarCell, IEvent } from '@/features/calendar/model/interfaces';

interface DroppableDayCellProps {
  cell: ICalendarCell;
  children: React.ReactNode;
  className?: string;
}

const DroppableDayCell = ({ cell, children, className }: DroppableDayCellProps) => {
  const { updateEvent } = useUpdateEvent();

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.EVENT,
      drop: (item: { event: IEvent }) => {
        const droppedEvent = item.event;

        const eventStartDate = parseISO(droppedEvent.startDate);
        const eventEndDate = parseISO(droppedEvent.endDate);

        const eventDurationMs = differenceInMilliseconds(eventEndDate, eventStartDate);

        const newStartDate = new Date(cell.date);
        newStartDate.setHours(eventStartDate.getHours(), eventStartDate.getMinutes(), eventStartDate.getSeconds(), eventStartDate.getMilliseconds());
        const newEndDate = new Date(newStartDate.getTime() + eventDurationMs);

        updateEvent({
          ...droppedEvent,
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
        });

        return { moved: true };
      },
      collect: monitor => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [cell.date, updateEvent]
  );

  return (
    <div ref={drop as unknown as React.RefObject<HTMLDivElement>} className={cn(className, isOver && canDrop && 'bg-bg-brand-weak')}>
      {children}
    </div>
  )
}

export { DroppableDayCell }
