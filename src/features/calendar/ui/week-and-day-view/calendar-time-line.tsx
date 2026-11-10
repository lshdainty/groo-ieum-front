import { useEffect, useState } from 'react';

import { formatClock } from '@/shared/lib/date-text';

interface IProps {
  firstVisibleHour: number;
  lastVisibleHour: number;
}

const CalendarTimeline = ({ firstVisibleHour, lastVisibleHour }: IProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentTimePosition = () => {
    const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    const visibleStartMinutes = firstVisibleHour * 60;
    const visibleEndMinutes = lastVisibleHour * 60;
    const visibleRangeMinutes = visibleEndMinutes - visibleStartMinutes;

    return ((minutes - visibleStartMinutes) / visibleRangeMinutes) * 100;
  };

  const formatCurrentTime = () => {
    return formatClock(currentTime);
  };

  const currentHour = currentTime.getHours();
  if (currentHour < firstVisibleHour || currentHour >= lastVisibleHour) return null;

  return (
    <div className='pointer-events-none absolute inset-x-0 z-50 border-t border-stroke-brand-solid' style={{ top: `${getCurrentTimePosition()}%` }}>
      <div className='absolute left-0 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg-brand-solid'></div>
      <div className='absolute -left-18 flex w-16 -translate-y-1/2 justify-end bg-bg-layer-default pr-1 text-xs font-medium text-fg-brand'>{formatCurrentTime()}</div>
    </div>
  )
}

export { CalendarTimeline }
