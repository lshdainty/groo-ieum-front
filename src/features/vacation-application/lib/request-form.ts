import dayjs from 'dayjs'

import type { PostRequestVacationReq } from '@/entities/vacation'
import type { GetUserApproversResp } from '@/entities/user'
import type { GetUserVacationPoliciesResp } from '@/entities/vacation-policy'
import type { TimeValue } from '@/shared/ds/time-picker'

/** 신청 폼이 들고 있는 값 — 날짜는 "YYYY-MM-DD", 시각은 24시간 { hour, minute }(초과근무 정책만), 받을 휴가는 서버 단위(하루 = 1) */
export interface RequestFormValues {
  title: string
  day: string
  start: TimeValue | null
  end: TimeValue | null
  grantTime: number
  reason: string
  approvers: string[]
}

export const emptyRequestForm = (): RequestFormValues => ({ title: '', day: '', start: null, end: null, grantTime: 0, reason: '', approvers: [] })

export const isOvertimePolicy = (p?: GetUserVacationPoliciesResp): boolean => p?.vacation_type?.toLowerCase() === 'overtime'

/** 처음 값과 다르면 닫을 때 "작성한 내용이 사라져요" 를 묻고, 정책을 바꿀 때 "입력한 내용이 지워져요" 를 묻는다 */
export const requestFormChanged = (v: RequestFormValues): boolean =>
  v.title.trim() !== '' || v.day !== '' || v.start !== null || v.end !== null || v.grantTime > 0 || v.reason.trim() !== '' || v.approvers.some((a) => !!a)

const minutes = (t: TimeValue): number => t.hour * 60 + t.minute

/** 끝 시각이 시작보다 이르면 밤을 넘긴 것이다 — 끝 날짜는 다음 날로 보낸다(11-11 결정 1B, 서버 `@DateRange` 는 시작 ≤ 끝이면 받는다) */
export const endIsNextDay = (start: TimeValue | null, end: TimeValue | null): boolean => !!start && !!end && minutes(end) < minutes(start)

/** 초과근무 시간(분) — 끝이 시작보다 이르면 다음 날 끝으로 센다(22:00 ~ 01:00 = 180분). 같으면 0 · 하루(24시간)를 넘는 근무는 적을 수 없다. 보이는 글만이다(서버 부여 시간은 정책 값) */
export const overtimeMinutes = (start: TimeValue | null, end: TimeValue | null): number => {
  if (!start || !end) return 0
  const diff = minutes(end) - minutes(start)
  return diff > 0 ? diff : diff < 0 ? diff + 24 * 60 : 0
}

/** 결재 단계 수 — min(정책 요구 인원, 가용 결재자 수), 자동 승인이면 고를 것이 없다 */
export const requiredApprovers = (policy: GetUserVacationPoliciesResp | undefined, data: GetUserApproversResp): number => {
  if (!policy || data.is_auto_approval) return 0
  return Math.min(policy.approval_required_count || 0, data.max_available_count || 0)
}

export interface RequestFormErrors {
  title?: true
  day?: true
  start?: true
  end?: 'required' | 'order'
  grant?: true
  reason?: true
  /** 비어 있는 단계(1부터) */
  approvers: number[]
}

export const requestFormErrors = (v: RequestFormValues, policy: GetUserVacationPoliciesResp | undefined, required: number): RequestFormErrors => {
  const overtime = isOvertimePolicy(policy)
  const flexible = policy?.is_flexible_grant === 'Y'
  const e: RequestFormErrors = { approvers: [] }
  if (!v.title.trim()) e.title = true
  if (!v.day) e.day = true
  if (overtime) {
    if (!v.start) e.start = true
    if (!v.end) e.end = 'required'
    else if (v.start && minutes(v.end) === minutes(v.start)) e.end = 'order'
  }
  if (flexible && v.grantTime < 0.0625) e.grant = true
  if (!v.reason.trim()) e.reason = true
  for (let i = 0; i < required; i++) if (!v.approvers[i]) e.approvers.push(i + 1)
  return e
}

export const hasRequestErrors = (e: RequestFormErrors): boolean => !!(e.title || e.day || e.start || e.end || e.grant || e.reason || e.approvers.length > 0)

const pad = (n: number): string => String(n).padStart(2, '0')
const clock = (t: TimeValue): string => `${pad(t.hour)}:${pad(t.minute)}`

const endDayOf = (v: RequestFormValues): string => (endIsNextDay(v.start, v.end) ? dayjs(v.day).add(1, 'day').format('YYYY-MM-DD') : v.day)

/** 서버 본문 — 키 · 시각 꼴(`YYYY-MM-DDTHH:mm:00` · 일반 휴가는 00:00:00 + 끝 null · 끝이 시작보다 이르면 끝 날짜 +1일) · grant_time(가변 정책만)은 지금 그대로 */
export const requestPayloadOf = (userId: string, policy: GetUserVacationPoliciesResp, v: RequestFormValues): PostRequestVacationReq => {
  const overtime = isOvertimePolicy(policy)
  const base = {
    user_id: userId,
    policy_id: policy.vacation_policy_id,
    desc: v.title.trim(),
    approver_ids: v.approvers.filter((a) => a),
    request_start_time: overtime && v.start ? `${v.day}T${clock(v.start)}:00` : `${v.day}T00:00:00`,
    request_end_time: overtime && v.end ? `${endDayOf(v)}T${clock(v.end)}:00` : null,
    request_desc: v.reason.trim(),
  }
  return policy.is_flexible_grant === 'Y' && v.grantTime ? { ...base, grant_time: v.grantTime } : base
}
