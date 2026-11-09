import dayjs from 'dayjs'

import { dsLanguage } from '@/shared/ds/i18n'
import type { GetUserRequestedVacationsResp } from '@/entities/vacation'

const english = () => dsLanguage().startsWith('en')

/** "10월 26일 (월)" — 올해가 아니면 연도를 앞에 붙인다("2027년 1월 4일 (월)"). `now` 는 시험 · 하네스가 시계를 고정하는 자리 */
export const formatRequestDay = (value: string, now: dayjs.Dayjs = dayjs()): string => {
  const d = dayjs(value)
  if (!d.isValid()) return value
  const sameYear = d.year() === now.year()
  if (english()) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', weekday: 'short', ...(sameYear ? {} : { year: 'numeric' }) }).format(d.toDate())
  }
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.day()]
  return `${sameYear ? '' : `${d.year()}년 `}${d.month() + 1}월 ${d.date()}일 (${weekday})`
}

const clock = (value: string) => dayjs(value).format('HH:mm')

/**
 * 신청 날짜 칸 — 하루면 "10월 26일 (월)", 시각이 있으면 "10월 20일 (화) 09:00 ~ 13:00".
 * 여러 날 신청이면 "11월 2일 (월) ~ 11월 6일 (금)" (끝 시각이 다른 날이면 날짜 범위). 범위의 "~" 는 앞 낱말에 붙여 줄바꿈이 "~" 앞에서 끊기지 않게 쓰는 쪽이 처리한다.
 */
export const formatRequestRange = (start: string, end: string | null, now: dayjs.Dayjs = dayjs()): string => {
  const first = formatRequestDay(start, now)
  if (!end) return first
  const s = dayjs(start)
  const e = dayjs(end)
  if (!e.isValid()) return first
  if (s.isSame(e, 'day')) {
    // 시각이 같은 날 안에서 시작 · 끝으로 있으면 시각 범위(자정 0:00 ~ 0:00 은 시각이 없는 신청)
    const hasTime = s.hour() !== 0 || s.minute() !== 0 || e.hour() !== 0 || e.minute() !== 0
    return hasTime ? `${first} ${clock(start)} ~ ${clock(end)}` : first
  }
  return `${first} ~ ${formatRequestDay(end, now)}`
}

/** 신청일 — 올해면 "10월 21일", 아니면 연도를 붙인다 */
export const formatRequestedAt = (value: string, now: dayjs.Dayjs = dayjs()): string => {
  const d = dayjs(value)
  if (!d.isValid()) return value
  const sameYear = d.year() === now.year()
  if (english()) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) }).format(d.toDate())
  }
  return `${sameYear ? '' : `${d.year()}년 `}${d.month() + 1}월 ${d.date()}일`
}

/** 줄 이름 — ⋮ · 단추의 "{줄 이름} 상세 보기" · 폰 줄 제목. "신청자 · 정책" */
export const approvalRowName = (row: GetUserRequestedVacationsResp): string =>
  [row.applicant_name, row.policy_name].filter((v) => v && v.trim()).join(' · ')

/** 내가 지금 결재할 차례 — 현재 결재자가 나이고 대기 · 진행 중 */
export const needsMyApproval = (row: GetUserRequestedVacationsResp, loginUserId: string): boolean =>
  !!loginUserId && row.current_approver_id === loginUserId && (row.grant_status === 'PENDING' || row.grant_status === 'PROGRESS')
