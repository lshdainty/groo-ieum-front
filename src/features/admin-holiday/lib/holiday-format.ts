import dayjs from 'dayjs'

import { dsLanguage } from '@/shared/ds/i18n'
import type { GetHolidaysResp } from '@/entities/holiday'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

/** 공휴일 날짜 — "2026년 1월 1일 (목)"(관리 표는 한 해 목록이라 연도를 늘 붙인다). 영어는 "Thu, Jan 1, 2026" */
export const formatHolidayDate = (value: string): string => {
  const d = dayjs(value)
  if (!d.isValid()) return value
  if (dsLanguage().startsWith('en')) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(d.toDate())
  }
  return `${d.year()}년 ${d.month() + 1}월 ${d.date()}일 (${WEEKDAY_KO[d.day()]})`
}

/** 구분 코드 → 글 키(admin 이름공간) */
export const HOLIDAY_TYPE_KEY: Record<string, string> = {
  PUBLIC: 'holiday.typePublic',
  SUBSTITUTE: 'holiday.typeSubstitute',
  ETC: 'holiday.typeEtc',
}

/** 폼 · 일괄 생성이 고르는 구분 셋 — 차례는 공휴일 · 대체 · 기타 */
export const HOLIDAY_TYPES = ['PUBLIC', 'SUBSTITUTE', 'ETC'] as const
export type HolidayType = (typeof HOLIDAY_TYPES)[number]

/** 반복 칸 — 음력 · 매년 / 매년 / 음력 / 없음("—"). 글 키 넷은 adminHoliday.repeat* */
export const repeatKey = (row: Pick<GetHolidaysResp, 'lunar_yn' | 'is_recurring'>): string => {
  const lunar = row.lunar_yn === 'Y'
  const yearly = row.is_recurring === 'Y'
  if (lunar && yearly) return 'adminHoliday.repeatLunarYearly'
  if (yearly) return 'adminHoliday.repeatYearly'
  if (lunar) return 'adminHoliday.repeatLunar'
  return 'adminHoliday.repeatNone'
}

/** 줄 이름 — ⋮ 의 이름 "{이름} 더보기" 와 줄 선택의 이름 */
export const holidayRowName = (row: Pick<GetHolidaysResp, 'holiday_name'>): string => row.holiday_name.trim()
