import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInDays,
  differenceInMinutes,
  eachDayOfInterval,
  endOfMonth,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

import type { GetEventsByPeriodResp } from '@/entities/calendar-event';
import type { ICalendarCell, IEvent, IUser } from '@/features/calendar/model/interfaces';
import type { TCalendarType, TCalendarView, TEventKind, TVisibleHours, TWorkingHours } from '@/features/calendar/model/types';
import { CHART_HUE, calendarTypes } from '@/features/calendar/model/types';
import dayjs from 'dayjs';

// ================ Header helper functions ================ //

export function navigateDate(date: Date, view: TCalendarView, direction: 'previous' | 'next'): Date {
  const operations = {
    agenda: direction === 'next' ? addMonths : subMonths,
    year: direction === 'next' ? addYears : subYears,
    month: direction === 'next' ? addMonths : subMonths,
    week: direction === 'next' ? addWeeks : subWeeks,
    day: direction === 'next' ? addDays : subDays,
  };

  return operations[view](date, 1);
}

// ================ Week and day view helper functions ================ //

export function groupEvents(dayEvents: IEvent[]) {
  const sortedEvents = dayEvents.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  const groups: IEvent[][] = [];

  for (const event of sortedEvents) {
    const eventStart = parseISO(event.startDate);

    let placed = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const lastEventEnd = parseISO(lastEventInGroup.endDate);

      if (eventStart >= lastEventEnd) {
        group.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) groups.push([event]);
  }

  return groups;
}

export function getEventBlockStyle(event: IEvent, day: Date, groupIndex: number, groupSize: number, visibleHoursRange?: { from: number; to: number }) {
  const startDate = parseISO(event.startDate);
  const dayStart = new Date(day.setHours(0, 0, 0, 0));
  const eventStart = startDate < dayStart ? dayStart : startDate;
  const startMinutes = differenceInMinutes(eventStart, dayStart);

  let top;

  if (visibleHoursRange) {
    const visibleStartMinutes = visibleHoursRange.from * 60;
    const visibleEndMinutes = visibleHoursRange.to * 60;
    const visibleRangeMinutes = visibleEndMinutes - visibleStartMinutes;
    top = ((startMinutes - visibleStartMinutes) / visibleRangeMinutes) * 100;
  } else {
    top = (startMinutes / 1440) * 100;
  }

  const width = 100 / groupSize;
  const left = groupIndex * width;

  return { top: `${top}%`, width: `${width}%`, left: `${left}%` };
}

export function isWorkingHour(day: Date, hour: number, workingHours: TWorkingHours) {
  const dayIndex = day.getDay() as keyof typeof workingHours;
  const dayHours = workingHours[dayIndex];
  return hour >= dayHours.from && hour < dayHours.to;
}

export function getVisibleHours(visibleHours: TVisibleHours, singleDayEvents: IEvent[]) {
  let earliestEventHour = visibleHours.from;
  let latestEventHour = visibleHours.to;

  singleDayEvents.forEach(event => {
    const startHour = parseISO(event.startDate).getHours();
    const endTime = parseISO(event.endDate);
    const endHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0);
    if (startHour < earliestEventHour) earliestEventHour = startHour;
    if (endHour > latestEventHour) latestEventHour = endHour;
  });

  latestEventHour = Math.min(latestEventHour, 24);

  const hours = Array.from({ length: latestEventHour - earliestEventHour }, (_, i) => i + earliestEventHour);

  return { hours, earliestEventHour, latestEventHour };
}

// ================ Event display helper functions ================ //

/**
 * 이벤트 표시명 반환
 * BIRTHPARTY는 사용자 이름 없이 타이틀만 표시
 */
export function getEventDisplayName(event: IEvent): string {
  if (event.type.id === 'BIRTHPARTY') return event.title;
  return `${event.user.name} ${event.title}`;
}

// ================ Month view helper functions ================ //

/**
 * 이벤트의 고유 키 생성 (type.type + id 조합)
 * schedule과 vacation 이벤트가 같은 id를 가질 수 있으므로 복합 키 사용
 */
export function getEventUniqueKey(event: IEvent): string {
  return `${event.kind}-${event.id}`;
}

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  const totalDays = firstDayOfMonth + daysInMonth;

  const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    currentMonth: false,
    date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - firstDayOfMonth + i + 1),
  }));

  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(currentYear, currentMonth, i + 1),
  }));

  const nextMonthCells = Array.from({ length: (7 - (totalDays % 7)) % 7 }, (_, i) => ({
    day: i + 1,
    currentMonth: false,
    date: new Date(currentYear, currentMonth + 1, i + 1),
  }));

  return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];
}

export function calculateMonthEventPositions(multiDayEvents: IEvent[], singleDayEvents: IEvent[], selectedDate: Date, maxSlots = 3) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const eventPositions: { [key: string]: number } = {};
  const occupiedPositions: { [key: string]: boolean[] } = {};

  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach(day => {
    const dayKey = startOfDay(day).toISOString();
    occupiedPositions[dayKey] = Array(maxSlots).fill(false);
  });

  const sortedEvents = [
    ...multiDayEvents.sort((a, b) => {
      const aDuration = differenceInDays(parseISO(a.endDate), parseISO(a.startDate));
      const bDuration = differenceInDays(parseISO(b.endDate), parseISO(b.startDate));
      return bDuration - aDuration || parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime();
    }),
    ...singleDayEvents.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()),
  ];

  sortedEvents.forEach(event => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    const eventKey = getEventUniqueKey(event);

    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : startOfDay(eventStart),
      end: eventEnd > monthEnd ? monthEnd : startOfDay(eventEnd),
    });

    let position = -1;

    for (let i = 0; i < maxSlots; i++) {
      if (
        eventDays.every(day => {
          const dayKey = startOfDay(day).toISOString();
          const dayPositions = occupiedPositions[dayKey];
          return dayPositions && !dayPositions[i];
        })
      ) {
        position = i;
        break;
      }
    }

    if (position !== -1) {
      eventDays.forEach(day => {
        const dayKey = startOfDay(day).toISOString();
        occupiedPositions[dayKey][position] = true;
      });
      eventPositions[eventKey] = position;
    }
  });

  return eventPositions;
}

export function getMonthCellEvents(date: Date, events: IEvent[], eventPositions: Record<string, number>) {
  const eventsForDate = events.filter(event => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    const cellDateStart = startOfDay(date);

    // startOfDay를 사용해서 날짜만 비교
    return isSameDay(cellDateStart, eventStart) ||
           isSameDay(cellDateStart, eventEnd) ||
           (cellDateStart >= startOfDay(eventStart) && cellDateStart <= startOfDay(eventEnd));
  });

  return eventsForDate
    .map(event => ({
      ...event,
      position: eventPositions[getEventUniqueKey(event)] ?? -1,
      isMultiDay: event.startDate !== event.endDate,
    }))
    .sort((a, b) => {
      if (a.isMultiDay && !b.isMultiDay) return -1;
      if (!a.isMultiDay && b.isMultiDay) return 1;
      return a.position - b.position;
    });
}

// ================ Data transformation functions ================ //

export interface ApiUserResponse {
  user_id: string;
  user_name: string;
  profile_url: string;
}

/**
 * calendar_type 문자열로 TCalendarType 객체 찾기 — 모르는 코드는 회색 "종일" 종류로 읽되 kind(휴가 / 일정)는 서버 domain_type 을 따른다.
 * (옛 코드는 모르는 코드를 연차로 바꿔 일정 행 번호가 휴가 사용 기록 번호처럼 쓰였다)
 */
export function getCalendarType(calendarTypeId: string, kind: TEventKind): TCalendarType {
  const found = calendarTypes.find(type => type.id === calendarTypeId.toUpperCase() && type.type === kind);
  if (found) return found;
  return { id: calendarTypeId.toUpperCase(), name: calendarTypeId, nameKey: '', type: kind, isDate: true, color: 'gray' };
}

/**
 * API 사용자 응답을 IUser 인터페이스로 변환
 */
export function convertApiUserToIUser(apiUser: ApiUserResponse): IUser {
  return {
    id: apiUser.user_id,
    name: apiUser.user_name,
    picturePath: apiUser.profile_url || null,
  };
}

/**
 * API 이벤트 응답을 IEvent 인터페이스로 변환
 */
export function convertApiEventToIEvent(apiEvent: GetEventsByPeriodResp, users: IUser[]): IEvent {
  // 사용자 목록에 없는 사람(시스템 계정 · 목록을 못 받음)은 일정이 가진 이름으로 그린다
  const user = users.find(u => u.id === apiEvent.user_id) ?? { id: apiEvent.user_id, name: apiEvent.user_name, picturePath: null };

  // 휴가 사용 기록 번호와 일정 번호는 서로 다른 표의 행 번호다 — 어느 쪽인지는 domain_type 이 정한다
  const kind: TEventKind = apiEvent.domain_type === 'vacation' ? 'vacation' : 'schedule';
  const calendarType = getCalendarType(apiEvent.calendar_type, kind);

  return {
    id: apiEvent.calendar_id,
    kind,
    startDate: dayjs(apiEvent.start_date).format('YYYY-MM-DDTHH:mm:ss'),
    endDate: dayjs(apiEvent.end_date).format('YYYY-MM-DDTHH:mm:ss'),
    title: apiEvent.calendar_name,
    description: apiEvent.calendar_desc || '',
    vacationType: kind === 'vacation' ? apiEvent.vacation_type : undefined,
    user: user,
    type: calendarType,
  };
}

/**
 * API 응답 배열을 변환
 */
export function convertApiEvents(
  apiEvents: GetEventsByPeriodResp[],
  apiUsers: ApiUserResponse[]
): { events: IEvent[], users: IUser[] } {
  const users = apiUsers.map(convertApiUserToIUser);
  const events = apiEvents.map(apiEvent => convertApiEventToIEvent(apiEvent, users));

  return { events, users };
}

// ================ Event tone ================ //

/** 칩 · 막대 색 — 종류의 색 이름을 차트 색으로 읽어 바탕 `chart-{색}-weak` · 글 `chart-{색}-contrast` · 막대 `chart-{색}` */
export function eventTone(event: Pick<IEvent, 'type'>): { color: string; bg: string; fg: string } {
  const hue = CHART_HUE[event.type.color];
  return { color: `var(--color-chart-${hue})`, bg: `var(--color-chart-${hue}-weak)`, fg: `var(--color-chart-${hue}-contrast)` };
}

/** 그 날에 걸친 일정 — 시작 · 끝 날짜 사이에 그날이 든다 */
export function eventsOnDay(events: IEvent[], day: Date): IEvent[] {
  const d = startOfDay(day);
  return events
    .filter(e => startOfDay(parseISO(e.startDate)) <= d && d <= startOfDay(parseISO(e.endDate)))
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
}
