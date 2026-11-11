import type { TFunction } from 'i18next'

import type { GetVacationPoliciesResp } from '@/entities/vacation-policy'
import { grantTimeText } from '@/shared/lib/groo/grant-time-text'

type Named = { code: string; name: string }[] | undefined

/** 코드값 → 사람 말. 목록에 없는 코드는 빈 글로 두지 않고 그대로 보인다(서버가 새 코드를 더했을 때) */
export const nameOf = (list: Named, code: string | null | undefined): string => {
  if (!code) return ''
  return list?.find((x) => x.code === code)?.name ?? code
}

/** 부여 방법 — 반복 부여 · 신청할 때 부여 · 관리자가 직접 부여 (서버 코드 REPEAT_GRANT · ON_REQUEST · MANUAL_GRANT 를 화면에 내지 않는다) */
export const grantMethodLabel = (t: TFunction, code: string): string => {
  const key = `adminPolicy.method.${code}`
  const text = t(key)
  return text === key ? code : text
}

/** 반복 단위 — 매년 · 매월 · 분기마다 · 반기마다 · 매일 */
export const repeatUnitLabel = (t: TFunction, code: string | null | undefined): string => {
  if (!code) return ''
  const key = `adminPolicy.unit.${code}`
  const text = t(key)
  return text === key ? code : text
}

export interface PolicyNames {
  vacationTypes: Named
  effectiveTypes: Named
  expirationTypes: Named
}

/** 줄 ① "{부여 방법} · {휴가 종류} · {부여 시간} · {반복 규칙}" — 가변이면 "입력한 시간", 부여 시간 0 이면 "제한 없음"(숫자로 가른다 — 서버 글은 언어마다 달라 "0일" · "0day(s)"), 반복 규칙은 반복 부여만 */
export const policyRuleLine = (t: TFunction, policy: GetVacationPoliciesResp, names: PolicyNames, language: string): string => {
  const time =
    policy.is_flexible_grant === 'Y'
      ? t('adminPolicy.flexibleTime')
      : policy.grant_time === 0
        ? t('policy.noLimit')
        : grantTimeText(policy.grant_time, policy.grant_time_str, language, t)
  const parts = [grantMethodLabel(t, policy.grant_method), nameOf(names.vacationTypes, policy.vacation_type), time]
  if (policy.grant_method === 'REPEAT_GRANT' && policy.repeat_grant_desc) parts.push(policy.repeat_grant_desc)
  return parts.filter(Boolean).join(' · ')
}

/** 줄 ② "유효기간 {발효} ~ {만료}" */
export const policyValidityLine = (t: TFunction, policy: GetVacationPoliciesResp, names: PolicyNames): string =>
  t('adminPolicy.validity', {
    start: nameOf(names.effectiveTypes, policy.effective_type),
    end: nameOf(names.expirationTypes, policy.expiration_type),
  })

/** 지울 수 있는 정책인가 — 서버 응답에 칸이 없으면(옛 서버) 지금처럼 지울 수 있다 */
export const canDeletePolicy = (policy: { can_deleted?: string }): boolean => policy.can_deleted !== 'N'
