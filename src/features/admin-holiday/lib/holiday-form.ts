import dayjs from 'dayjs'

import type { GetHolidaysResp, PostHolidayReq } from '@/entities/holiday'
import type { HolidayType } from './holiday-format'

/** 공휴일 폼의 값 — 구분 · 음력 · 반복은 화면 말(칩 · 체크)이고 요청에서 Y / N 으로 바뀐다 */
export interface HolidayFormValues {
  name: string
  date: string
  type: HolidayType
  lunar: boolean
  lunarDate: string
  country: string
  recurring: boolean
}

export const emptyHolidayForm = (country: string): HolidayFormValues => ({
  name: '',
  // 새로 만들 때 날짜는 비워 둔다 — 고르게 한다(지금 폼도 빈 값)
  date: '',
  type: 'PUBLIC',
  lunar: false,
  lunarDate: '',
  country,
  recurring: true,
})

export const holidayFormOf = (row: GetHolidaysResp): HolidayFormValues => ({
  name: row.holiday_name,
  date: row.holiday_date ? dayjs(row.holiday_date).format('YYYY-MM-DD') : '',
  type: (row.holiday_type === 'SUBSTITUTE' || row.holiday_type === 'ETC' ? row.holiday_type : 'PUBLIC') as HolidayType,
  lunar: row.lunar_yn === 'Y',
  lunarDate: row.lunar_date ? dayjs(row.lunar_date).format('YYYY-MM-DD') : '',
  country: row.country_code,
  recurring: row.is_recurring === 'Y',
})

/** 칸 오류 — 이름 · 날짜(trim 한 값으로 본다) */
export const holidayFormErrors = (v: HolidayFormValues): { name?: true; date?: true; country?: true } => {
  const errors: { name?: true; date?: true; country?: true } = {}
  if (!v.name.trim()) errors.name = true
  if (!v.date) errors.date = true
  if (!v.country) errors.country = true
  return errors
}

export const holidayFormChanged = (a: HolidayFormValues, b: HolidayFormValues): boolean =>
  a.name.trim() !== b.name.trim() ||
  a.date !== b.date ||
  a.type !== b.type ||
  a.lunar !== b.lunar ||
  (a.lunar && a.lunarDate !== b.lunarDate) ||
  a.country !== b.country ||
  a.recurring !== b.recurring

/**
 * 저장 본문 — 아이콘 칸은 폼에서 걷었다(Q6 → A): 수정은 지금 저장된 값을 그대로, 새로 만들 때는 지금 폼의 처음 값 ""(빈 값)을 싣는다.
 * 양력이면 음력 날짜는 비운다(지금 폼은 양력으로 돌려도 남은 값을 실었다 — 숨긴 칸 값이 새는 것을 막는다).
 */
export const holidayPayloadOf = (v: HolidayFormValues, icon: string): PostHolidayReq => ({
  holiday_name: v.name.trim(),
  holiday_date: v.date,
  holiday_type: v.type,
  holiday_icon: icon,
  country_code: v.country,
  lunar_yn: v.lunar ? 'Y' : 'N',
  lunar_date: v.lunar ? v.lunarDate : '',
  is_recurring: v.recurring ? 'Y' : 'N',
})
