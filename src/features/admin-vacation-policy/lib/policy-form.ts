import type { PostVacationPolicyReq } from '@/entities/vacation-policy'

/** 만들기 폼의 부여 방법 — 서버 코드 그대로(화면에는 사람 말로 낸다, policy-format.ts) */
export type GrantMethod = 'REPEAT_GRANT' | 'ON_REQUEST' | 'MANUAL_GRANT'
export const GRANT_METHODS: GrantMethod[] = ['REPEAT_GRANT', 'ON_REQUEST', 'MANUAL_GRANT']
export const REPEAT_UNITS = ['YEARLY', 'MONTHLY', 'QUARTERLY', 'HALF', 'DAILY'] as const
export type RepeatUnit = (typeof REPEAT_UNITS)[number]

export const NAME_MAX = 50
export const DESC_MAX = 1000
export const INTERVAL_MAX = 100
export const MAX_COUNT_MAX = 100

export interface PolicyFormValues {
  name: string
  desc: string
  vacationType: string
  repeatUnit: RepeatUnit | ''
  repeatInterval: number
  /** 매년 부여하는 달(1 ~ 12) — 비면 "첫 부여 날짜의 달" */
  month: string
  /** 부여하는 날(1 ~ 31) */
  day: string
  firstGrantDate: string
  /** 계속 반복 Y · 정한 횟수만 N */
  recurring: 'Y' | 'N'
  maxGrantCount: number
  /** 정한 시간 N · 입력한 시간 Y */
  flexible: 'N' | 'Y'
  grantTime: number
  minute: boolean
  approvalCount: number
  effectiveType: string
  expirationType: string
}

export const initialValues = (): PolicyFormValues => ({
  name: '',
  desc: '',
  vacationType: '',
  repeatUnit: '',
  repeatInterval: 1,
  month: '',
  day: '',
  firstGrantDate: '',
  recurring: 'Y',
  maxGrantCount: 1,
  flexible: 'N',
  grantTime: 0,
  minute: false,
  approvalCount: 0,
  effectiveType: '',
  expirationType: '',
})

export type PolicyFormErrorKey =
  | 'name'
  | 'vacationType'
  | 'repeatUnit'
  | 'repeatInterval'
  | 'month'
  | 'day'
  | 'firstGrantDate'
  | 'maxGrantCount'
  | 'grantTime'
  | 'effectiveType'
  | 'expirationType'

/** 이 방법에서 보이는 칸 — 칸 대조표(I-24 H 39)의 ● 열. 보이지 않는 칸은 검사도 보내지도 않는다 */
export const fieldsOf = (method: GrantMethod) => ({
  repeat: method === 'REPEAT_GRANT',
  flexible: method !== 'REPEAT_GRANT',
  approval: method === 'ON_REQUEST',
})

/** "부여하는 날" 줄의 모양 — 매년 = 월 · 일 / 매월 · 분기 · 반기 = 일 / 매일 = 줄 없음 */
export const dayRuleOf = (unit: RepeatUnit | ''): 'monthDay' | 'day' | 'none' =>
  unit === 'YEARLY' ? 'monthDay' : unit === 'DAILY' || unit === '' ? 'none' : 'day'

const inRange = (text: string, min: number, max: number): boolean => {
  if (text === '') return true
  const n = Number(text)
  return Number.isInteger(n) && n >= min && n <= max
}

/** 누를 때 검사 — 지금 폼의 zod 규칙 갈래 그대로(칸 이름 → 오류). 비어 있으면 통과 */
export const validate = (method: GrantMethod, v: PolicyFormValues): Partial<Record<PolicyFormErrorKey, true>> => {
  const e: Partial<Record<PolicyFormErrorKey, true>> = {}
  const f = fieldsOf(method)
  if (v.name.trim() === '') e.name = true
  if (!v.vacationType) e.vacationType = true
  if (!v.effectiveType) e.effectiveType = true
  if (!v.expirationType) e.expirationType = true
  // 부여 시간 — 반복 부여는 늘 필수, 그 밖은 "정한 시간"일 때만
  if ((method === 'REPEAT_GRANT' || v.flexible === 'N') && !(v.grantTime > 0)) e.grantTime = true
  if (f.repeat) {
    if (!v.repeatUnit) e.repeatUnit = true
    if (!(v.repeatInterval > 0)) e.repeatInterval = true
    if (!v.firstGrantDate) e.firstGrantDate = true
    if (v.recurring === 'N' && !(v.maxGrantCount > 0)) e.maxGrantCount = true
    const rule = dayRuleOf(v.repeatUnit)
    if (rule === 'monthDay') {
      if (!inRange(v.month, 1, 12)) e.month = true
      // 매년은 일만 정할 수 없다 — 달도 함께
      else if (v.month === '' && v.day !== '') e.month = true
    }
    if (rule !== 'none' && !inRange(v.day, 1, 31)) e.day = true
  }
  return e
}

/** 요청 본문 — 지금 CreateVacationPolicyReq 그대로(칸 이름 · 값 · Y/N). 고른 방법에 없는 칸은 지금처럼 null 로 보낸다 */
export const toPayload = (method: GrantMethod, v: PolicyFormValues): PostVacationPolicyReq => {
  const repeat = method === 'REPEAT_GRANT'
  const rule = dayRuleOf(v.repeatUnit)
  const flexible = repeat ? 'N' : v.flexible
  const base = {
    vacation_policy_name: v.name.trim(),
    vacation_policy_desc: v.desc || '',
    vacation_type: v.vacationType,
    grant_method: method,
    // 가변(입력한 시간)이면 부여 시간은 null, 아니면 고른 시간
    grant_time: flexible === 'Y' ? null : v.grantTime || 0,
    is_flexible_grant: flexible,
    minute_grant_yn: v.minute ? 'Y' : 'N',
    effective_type: v.effectiveType || null,
    expiration_type: v.expirationType || null,
  }
  return {
    ...base,
    approval_required_count: method === 'ON_REQUEST' ? v.approvalCount || 0 : null,
    repeat_unit: repeat ? v.repeatUnit || null : null,
    repeat_interval: repeat ? v.repeatInterval || null : null,
    specific_months: repeat && rule === 'monthDay' && v.month !== '' ? Number(v.month) : null,
    specific_days: repeat && rule !== 'none' && v.day !== '' ? Number(v.day) : null,
    first_grant_date: repeat && v.firstGrantDate ? `${v.firstGrantDate}T00:00:00` : null,
    is_recurring: repeat ? v.recurring : null,
    max_grant_count: repeat && v.recurring === 'N' ? v.maxGrantCount || null : null,
  } as unknown as PostVacationPolicyReq
}

/** 승인 필요 횟수의 상한 — 부서 나무에서 부서장이 있는 부서를 위로 따라가며 센 최댓값(부서장이 하나도 없으면 0) */
export const approvalLimitOf = (tree: { head_user_id?: string | null; children?: unknown[] }[] | undefined): number => {
  type Node = { head_user_id?: string | null; children?: unknown[] }
  const walk = (nodes: Node[], count: number): number => {
    let best = count
    for (const node of nodes) {
      const here = count + (node.head_user_id ? 1 : 0)
      best = Math.max(best, here, walk((node.children ?? []) as Node[], here))
    }
    return best
  }
  return walk(tree ?? [], 0)
}
