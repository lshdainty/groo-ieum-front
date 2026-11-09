import dayjs from 'dayjs'

import type { PostManualGrantVacationReq } from '@/entities/vacation'

/** 휴가 부여 폼이 들고 있는 값 — 정책 번호는 글, 날짜는 "YYYY-MM-DD"(직접 정할 때만 쓴다), 부여 시간은 서버 단위(하루 = 1) */
export interface GrantFormValues {
  policyId: string
  customDates: boolean
  grantDate: string
  expiryDate: string
  grantTime: number
  reason: string
}

export const grantFormOf = (today: string = dayjs().format('YYYY-MM-DD')): GrantFormValues => ({
  policyId: '',
  customDates: false,
  grantDate: today,
  expiryDate: today,
  grantTime: 0,
  reason: '',
})

/** 처음 값과 다르면 닫을 때 "작성한 내용이 사라져요" 를 묻는다 */
export const grantFormChanged = (v: GrantFormValues): boolean => v.policyId !== '' || v.reason.trim() !== '' || v.grantTime > 0 || v.customDates

/** 칸 오류 — 정책 · 부여 시간(0 보다 커야) · 사유 필수, 직접 정하면 두 날짜 필수. 오류가 없으면 빈 객체 */
export const grantFormErrors = (v: GrantFormValues): { policy?: true; grantTime?: true; reason?: true; grantDate?: true; expiryDate?: true } => ({
  ...(v.policyId ? {} : { policy: true as const }),
  ...(v.grantTime >= 0.0625 ? {} : { grantTime: true as const }),
  ...(v.reason.trim() ? {} : { reason: true as const }),
  ...(v.customDates && !v.grantDate ? { grantDate: true as const } : {}),
  ...(v.customDates && !v.expiryDate ? { expiryDate: true as const } : {}),
})

/** 서버 본문 — 키는 지금 그대로. 직접 정하지 않으면 날짜는 null(정책 규칙을 따른다) */
export const grantPayloadOf = (userId: string, v: GrantFormValues): PostManualGrantVacationReq => ({
  user_id: userId,
  vacation_policy_id: parseInt(v.policyId, 10),
  grant_time: v.grantTime,
  grant_date: v.customDates && v.grantDate ? `${v.grantDate}T00:00:00` : null,
  expiry_date: v.customDates && v.expiryDate ? `${v.expiryDate}T23:59:59` : null,
  grant_desc: v.reason.trim(),
})
