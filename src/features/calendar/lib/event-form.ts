import dayjs from 'dayjs'

import type { TimeValue } from '@/shared/ds/time-picker'
import { calendarTypes } from '@/features/calendar/model/types'
import type { IEvent } from '@/features/calendar/model/interfaces'

/** 일정 폼 값 — 날짜는 "YYYY-MM-DD", 시각은 시 · 분(시각 종류만 쓴다) */
export interface EventFormValues {
  desc: string
  /** 대상 사람(관리자가 남의 휴가를 올릴 때 — 아니면 로그인 사람) */
  targetUser: string
  /** 종류 코드 */
  type: string
  /** 쓸 휴가 코드(휴가 종류만) */
  vacationType: string
  startDate: string
  endDate: string
  startTime: TimeValue | null
}

export interface EventFormErrors {
  desc: boolean
  type: boolean
  vacationType: boolean
  endDate: boolean
  startTime: boolean
}

export const typeOf = (code: string) => calendarTypes.find((c) => c.id === code)

/** 새 일정 폼의 시작 값 — 그 날 · 시각(없으면 오전 9:00) */
export const initialValues = (opts: { date?: Date; endDate?: Date; startTime?: { hour: number; minute: number }; targetUser: string }): EventFormValues => {
  const start = dayjs(opts.date ?? new Date()).format('YYYY-MM-DD')
  return {
    desc: '',
    targetUser: opts.targetUser,
    type: '',
    vacationType: '',
    startDate: start,
    endDate: dayjs(opts.endDate ?? opts.date ?? new Date()).format('YYYY-MM-DD'),
    startTime: opts.startTime ?? { hour: 9, minute: 0 },
  }
}

/** 고치는 기록의 값으로 폼을 채운다 — 종류 · 쓸 휴가 · 사람을 그 기록 값으로(C 14 의 결함 셋과 같은 이유) */
export const valuesOfEvent = (event: IEvent): EventFormValues => {
  const start = dayjs(event.startDate)
  return {
    // DB 가 null 을 허용한다 — 빈 글로 받는다
    desc: event.description ?? '',
    targetUser: event.user.id,
    type: event.type.id,
    vacationType: event.vacationType ?? '',
    startDate: start.format('YYYY-MM-DD'),
    endDate: dayjs(event.endDate).format('YYYY-MM-DD'),
    startTime: { hour: start.hour(), minute: start.minute() },
  }
}

export const eventFormErrors = (v: EventFormValues): EventFormErrors => {
  const type = typeOf(v.type)
  return {
    desc: v.desc.trim() === '',
    type: !type,
    vacationType: type?.type === 'vacation' && !v.vacationType,
    endDate: dayjs(v.endDate).isBefore(dayjs(v.startDate), 'day'),
    startTime: !!type && !type.isDate && !v.startTime,
  }
}

export const hasEventFormErrors = (e: EventFormErrors): boolean => e.desc || e.type || e.vacationType || e.endDate || e.startTime

/** 바뀐 값이 있나 — 닫을 때 "작성한 내용이 사라져요" 를 묻는 기준(앞뒤 공백은 비교에서 뺀다) */
export const eventFormChanged = (a: EventFormValues, b: EventFormValues): boolean =>
  a.desc.trim() !== b.desc.trim() ||
  a.targetUser !== b.targetUser ||
  a.type !== b.type ||
  a.vacationType !== b.vacationType ||
  a.startDate !== b.startDate ||
  a.endDate !== b.endDate ||
  a.startTime?.hour !== b.startTime?.hour ||
  a.startTime?.minute !== b.startTime?.minute
