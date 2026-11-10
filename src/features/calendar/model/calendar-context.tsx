'use client';

import { createContext, useContext, useState } from 'react';

import type { GetHolidaysResp } from '@/entities/holiday';
import type { IUser } from '@/features/calendar/model/interfaces';
import type { TCalendarType, TCalendarView, TVisibleHours, TWorkingHours } from '@/features/calendar/model/types';
import type { Dispatch, SetStateAction } from 'react';

interface ICalendarContext {
  /** 보고 있는 날 — 월 · 목록은 이 날이 든 달, 주는 이 날이 든 주, 년은 이 날이 든 해. 1280 월 보기에서는 고른 날(그날 패널)이기도 하다 */
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  selectedUserIds: IUser['id'][] | 'all';
  setSelectedUserIds: (userIds: IUser['id'][] | 'all') => void;
  selectedTypeIds: TCalendarType['id'][] | 'all';
  setSelectedTypeIds: (typeIds: TCalendarType['id'][] | 'all') => void;
  view: TCalendarView;
  setView: (view: TCalendarView) => void;
  users: IUser[];
  workingHours: TWorkingHours;
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours>>;
  visibleHours: TVisibleHours;
  setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
  holidays: GetHolidaysResp[];
  setHolidays: Dispatch<SetStateAction<GetHolidaysResp[]>>;
  findHolidayByDate: (date: string) => GetHolidaysResp | undefined;
}

const CalendarContext = createContext({} as ICalendarContext);

const WORKING_HOURS = {
  0: { from: 0, to: 0 },
  1: { from: 7, to: 22 },
  2: { from: 7, to: 22 },
  3: { from: 7, to: 22 },
  4: { from: 7, to: 22 },
  5: { from: 7, to: 22 },
  6: { from: 0, to: 0 },
};

const VISIBLE_HOURS = { from: 7, to: 22 };

export function CalendarProvider({ children, users, initialView = 'month' }: { children: React.ReactNode; users: IUser[]; initialView?: TCalendarView }) {
  const [visibleHours, setVisibleHours] = useState<TVisibleHours>(VISIBLE_HOURS);
  const [workingHours, setWorkingHours] = useState<TWorkingHours>(WORKING_HOURS);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserIds, setSelectedUserIds] = useState<IUser['id'][] | 'all'>('all');
  const [selectedTypeIds, setSelectedTypeIds] = useState<TCalendarType['id'][] | 'all'>('all');
  const [view, setView] = useState<TCalendarView>(initialView);

  const [holidays, setHolidays] = useState<GetHolidaysResp[]>([]);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const findHolidayByDate = (date: string) => {
    return holidays.find(holiday => holiday.holiday_date === date);
  };

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate: handleSelectDate,
        selectedUserIds,
        setSelectedUserIds,
        selectedTypeIds,
        setSelectedTypeIds,
        view,
        setView,
        users,
        visibleHours,
        setVisibleHours,
        workingHours,
        setWorkingHours,
        holidays,
        setHolidays,
        findHolidayByDate,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context) throw new Error('useCalendar must be used within a CalendarProvider.');
  return context;
}
