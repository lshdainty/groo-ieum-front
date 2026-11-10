import type { TCalendarType, TEventKind } from '@/features/calendar/model/types';

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IEvent {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  description: string;
  vacationType?: string;
  user: IUser;
  type: TCalendarType;
  /** 휴가 사용 기록 / 일정 — `id` 가 어느 표의 행 번호인지. 서버 `domain_type` 에서 오고 종류 코드로 짐작하지 않는다 */
  kind: TEventKind;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
