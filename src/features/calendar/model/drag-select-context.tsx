'use client';

import dayjs from 'dayjs';
import { createContext, useCallback, useContext, useState } from 'react';

interface DragSelectContextType {
  /** 그 날이 끌고 있는 범위 안에 드는지 */
  isDateInSelection: (date: Date) => boolean;
  startSelection: (date: Date) => void;
  updateSelection: (date: Date) => void;
  endSelection: () => void;
}

const DragSelectContext = createContext<DragSelectContextType | null>(null);

export const useDragSelect = () => {
  const context = useContext(DragSelectContext);
  if (!context) throw new Error('useDragSelect must be used within a DragSelectProvider');
  return context;
};

/**
 * 월 격자 누름 · 끌기(768 이상 — G 35). 한 날을 누르면 그 날을 고르고(`onSelectDay`), 이미 고른 날을 다시 누르면 그 날로 일정 폼(`onCreate`).
 * 두 날 이상을 끌어 놓으면 그 기간으로 일정 폼. 폼을 만들 수 없는 사람(`canCreate` false)은 고르기만 된다.
 */
export const DragSelectProvider = ({
  children,
  selectedDate,
  canCreate,
  onSelectDay,
  onCreate,
}: {
  children: React.ReactNode;
  selectedDate: Date;
  canCreate: boolean;
  onSelectDay: (date: Date) => void;
  onCreate: (start: Date, end?: Date) => void;
}) => {
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [current, setCurrent] = useState<Date | null>(null);

  const startSelection = useCallback((date: Date) => {
    setAnchor(date);
    setCurrent(date);
  }, []);

  const updateSelection = useCallback(
    (date: Date) => {
      if (anchor) setCurrent(date);
    },
    [anchor]
  );

  const endSelection = useCallback(() => {
    if (anchor && current) {
      if (dayjs(anchor).isSame(current, 'day')) {
        if (dayjs(anchor).isSame(selectedDate, 'day')) {
          if (canCreate) onCreate(anchor);
        } else {
          onSelectDay(anchor);
        }
      } else if (canCreate) {
        const first = dayjs(anchor).isBefore(current) ? anchor : current;
        const last = dayjs(anchor).isBefore(current) ? current : anchor;
        onCreate(first, last);
      }
    }
    setAnchor(null);
    setCurrent(null);
  }, [anchor, current, selectedDate, canCreate, onSelectDay, onCreate]);

  const isDateInSelection = useCallback(
    (date: Date) => {
      if (!anchor || !current || dayjs(anchor).isSame(current, 'day')) return false;
      const first = dayjs(anchor).isBefore(current) ? anchor : current;
      const last = dayjs(anchor).isBefore(current) ? current : anchor;
      const d = dayjs(date).startOf('day');
      return !d.isBefore(dayjs(first).startOf('day')) && !d.isAfter(dayjs(last).startOf('day'));
    },
    [anchor, current]
  );

  return (
    <DragSelectContext.Provider value={{ isDateInSelection, startSelection, updateSelection, endSelection }}>
      {children}
    </DragSelectContext.Provider>
  );
};
