import dayjs from 'dayjs'

import { dsLanguage } from '@/shared/ds/i18n'
import type { GetUserRequestedVacationsResp } from '@/entities/vacation'

const english = () => dsLanguage().startsWith('en')

/** "10월 26일 (월)" · 기간 글 — 화면 사이 한 벌(shared/lib/date-text, 시각은 오전 · 오후 12시간) */
export { formatDayText as formatRequestDay, formatPeriodText as formatRequestRange } from '@/shared/lib/date-text'

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
