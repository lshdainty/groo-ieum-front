import dayjs from 'dayjs'

import { dsLanguage } from '@/shared/ds/i18n'

/**
 * 날짜 · 시각 글(DESIGN.hr 날짜 · 시각 — 시각은 오전 · 오후 12시간, 영어는 AM / PM) — 화면 사이 한 벌.
 * 24시간 "09:00" 은 어디에도 쓰지 않는다. 형식이 필요한 자리(서버로 보내는 값 · 시각 칸의 값)는 이 글이 아니라 각자의 규칙이다.
 */

type DateInput = string | Date | dayjs.Dayjs

const english = () => dsLanguage().startsWith('en')

/** 범위 사이 글 — "~" 앞에서 줄이 끊기지 않게 앞에 붙는 공백(NBSP)이고, 뒤는 보통 공백이다 */
export const RANGE_SEP = ' ~ '

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** "오전 9:00" · "오후 12:30" · 영어 "9:00 AM" — 시는 앞 0 없이(0 시 = 오전 12:00 · 12 시 = 오후 12:00) */
export const formatHourMinute = (hour: number, minute = 0): string => {
  const h = ((hour % 24) + 24) % 24
  const h12 = h % 12 === 0 ? 12 : h % 12
  const mm = String(minute).padStart(2, '0')
  if (english()) return `${h12}:${mm} ${h < 12 ? 'AM' : 'PM'}`
  return `${h < 12 ? '오전' : '오후'} ${h12}:${mm}`
}

/** 날짜 · 시각 값에서 시각만 — "2026-10-20T13:00:00" → "오후 1:00" */
export const formatClock = (value: DateInput): string => {
  const d = dayjs(value)
  return d.isValid() ? formatHourMinute(d.hour(), d.minute()) : String(value)
}

/** 시각 범위 — "오전 9:00 ~ 오후 1:00" · 같은 오전 · 오후면 끝의 말머리를 뗀다("오후 7:00 ~ 11:00", 한국어만) */
export const formatClockRange = (start: DateInput, end: DateInput): string => {
  const first = formatClock(start)
  let last = formatClock(end)
  if (!english()) {
    const head = /^(오전|오후) /.exec(first)?.[1]
    if (head && last.startsWith(`${head} `)) last = last.slice(head.length + 1)
  }
  return `${first}${RANGE_SEP}${last}`
}

/** 유연근무 "9 ~ 18" 같은 시 범위 — "오전 9:00 ~ 오후 6:00". 끝이 시작보다 작거나 같고 12 보다 작으면 저녁 시각으로 본다("9 ~ 6") */
export const formatHourRange = (startHour: number, endHour: number): string => {
  const end = endHour <= startHour && endHour < 12 ? endHour + 12 : endHour
  return `${formatHourMinute(startHour)}${RANGE_SEP}${formatHourMinute(end)}`
}

/** "10월 26일 (월)" — 올해가 아니면 연도를 앞에 붙인다("2027년 1월 4일 (월)"). `now` 는 시험 · 하네스가 시계를 고정하는 자리 */
export const formatDayText = (value: DateInput, now: dayjs.Dayjs = dayjs()): string => {
  const d = dayjs(value)
  if (!d.isValid()) return String(value)
  const sameYear = d.year() === now.year()
  if (english()) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', weekday: 'short', ...(sameYear ? {} : { year: 'numeric' }) }).format(d.toDate())
  }
  return `${sameYear ? '' : `${d.year()}년 `}${d.month() + 1}월 ${d.date()}일 (${WEEKDAYS[d.day()]})`
}

/** 범위의 끝 날짜 — 시작과 같은 해 · 달이면 그것을 뗀다("10월 8일 (목) ~ 9일 (금)"), 해가 다르면 해를 붙인다 */
const formatEndDayText = (end: dayjs.Dayjs, start: dayjs.Dayjs): string => {
  if (english()) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', weekday: 'short', ...(end.year() === start.year() ? {} : { year: 'numeric' }) }).format(end.toDate())
  }
  const sameYear = end.year() === start.year()
  const sameMonth = sameYear && end.month() === start.month()
  return `${sameYear ? '' : `${end.year()}년 `}${sameMonth ? '' : `${end.month() + 1}월 `}${end.date()}일 (${WEEKDAYS[end.day()]})`
}

/** 종일 — 시작이 0:00 이고 끝이 0:00 또는 그날의 끝(23:59). 서버는 종일 휴가를 00:00:00 ~ 23:59:59 로 둔다 */
export const isAllDay = (start: DateInput, end: DateInput | null | undefined): boolean => {
  const s = dayjs(start)
  if (!s.isValid() || s.hour() !== 0 || s.minute() !== 0) return false
  if (!end) return true
  const e = dayjs(end)
  if (!e.isValid()) return true
  return (e.hour() === 0 && e.minute() === 0) || (e.hour() === 23 && e.minute() === 59)
}

/**
 * 기간 글(휴가 사용 · 신청 대상 날짜) —
 * 종일 하루 "10월 30일 (금)" · 종일 여러 날 "10월 8일 (목) ~ 9일 (금)"(해가 다르면 해를 붙인다) ·
 * 같은 날 시각 "10월 20일 (화) 오전 9:00 ~ 오후 1:00" · 시각이 있는 여러 날 "10월 8일 (목) 오전 9:00 ~ 9일 (금) 오후 6:00".
 * 범위의 "~" 는 앞 낱말에 붙어(RANGE_SEP) 줄이 "~" 앞에서 끊기지 않는다.
 */
export const formatPeriodText = (start: string, end: string | null | undefined, now: dayjs.Dayjs = dayjs()): string => {
  const s = dayjs(start)
  if (!s.isValid()) return start
  const first = formatDayText(s, now)
  const e = end ? dayjs(end) : null
  if (!e || !e.isValid()) return first
  const allDay = isAllDay(s, e)
  if (s.isSame(e, 'day')) return allDay ? first : `${first} ${formatClockRange(s, e)}`
  return allDay
    ? `${first}${RANGE_SEP}${formatEndDayText(e, s)}`
    : `${first} ${formatClock(s)}${RANGE_SEP}${formatEndDayText(e, s)} ${formatClock(e)}`
}
