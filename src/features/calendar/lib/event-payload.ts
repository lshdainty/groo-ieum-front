import dayjs from 'dayjs'

import { TIMED_MINUTES, calendarTypes } from '@/features/calendar/model/types'
import type { TEventKind } from '@/features/calendar/model/types'

const FORMAT = 'YYYY-MM-DDTHH:mm:ss'

export interface EventFormPayloadInput {
  userId: string
  /** 종류 코드(MORNINGOFF · BUSINESSTRIP …) */
  calendarType: string
  vacationType?: string
  desc?: string
  startDate: string
  endDate: string
  startHour?: string
  startMinute?: string
  /** 대상 사람의 근무 시간 칸("13 ~ 21") — 점심 · 저녁 휴식을 끝 시각에 더하는 데 쓴다 */
  userWorkTime?: string
}

// 오후반 여부 확인 (13시 출근자)
const isAfternoonShift = (workTime?: string): boolean => workTime === '13 ~ 21'

// 휴식시간 포함하여 종료시간 계산 — 오전반은 점심(12 ~ 13), 오후반은 저녁(18 ~ 19)이 걸치면 한 시간을 더한다
const endHourWithBreak = (startHour: number, plusHour: number, workTime?: string): number => {
  const endHour = startHour + plusHour
  if (isAfternoonShift(workTime)) {
    if (startHour < 18 && endHour > 18) return endHour + 1
  } else if (startHour < 12 && endHour > 12) {
    return endHour + 1
  }
  return endHour
}

/** 종류 코드로 어느 쪽 기록인지(휴가 사용 / 일정) — 새로 만들 때 쓴다. 이미 있는 기록의 수정 · 삭제는 기록이 가진 kind 를 따른다 */
export const kindOfType = (calendarType: string): TEventKind | undefined => calendarTypes.find((c) => c.id === calendarType)?.type

/** 폼 값 → 요청 본문의 시작 · 끝 시각. 종일 종류는 날짜의 0시 ~ 끝, 시각 종류는 시작에서 종류가 쓰는 시간만큼 */
export const eventRange = (input: EventFormPayloadInput): { start_date: string; end_date: string } => {
  const type = calendarTypes.find((c) => c.id === input.calendarType)
  if (!type || type.isDate) {
    return { start_date: dayjs(input.startDate).startOf('day').format(FORMAT), end_date: dayjs(input.endDate).endOf('day').format(FORMAT) }
  }
  const startHour = Number(input.startHour)
  const startMinute = Number(input.startMinute)
  const start = dayjs(input.startDate).hour(startHour).minute(startMinute).second(0)
  const minutes = TIMED_MINUTES[input.calendarType] ?? 0
  // 30분 휴가는 시작에서 30분 뒤(휴식 없음) · 시간 단위 종류는 휴식을 더한 끝 시
  const end =
    minutes % 60 !== 0
      ? start.add(minutes, 'minute')
      : dayjs(input.endDate).hour(endHourWithBreak(startHour, minutes / 60, input.userWorkTime)).minute(startMinute).second(0)
  return { start_date: start.format(FORMAT), end_date: end.format(FORMAT) }
}
