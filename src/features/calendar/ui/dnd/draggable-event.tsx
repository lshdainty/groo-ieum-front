'use client';

import { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { cn } from '@/shared/lib'

import type { IEvent } from '@/features/calendar/model/interfaces';

export const ItemTypes = {
  EVENT: 'event',
};

interface DraggableEventProps {
  event: IEvent;
  children: React.ReactNode;
  /** 끌 수 없는 일정(권한 없음 · 이미 지난 기록) — 서버가 거절할 이동을 시작하지 않는다 */
  disabled?: boolean;
}

const DraggableEvent = ({ event, children, disabled = false }: DraggableEventProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: () => {
      const width = ref.current?.offsetWidth || 0;
      const height = ref.current?.offsetHeight || 0;
      return { event, children, width, height };
    },
    canDrag: !disabled,
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }), [disabled, event]);

  // Hide the default drag preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  drag(ref);

  return (
    <div ref={ref} className={cn(isDragging && 'opacity-40')}>
      {children}
    </div>
  )
}

export { DraggableEvent }
