import type { TFunction } from 'i18next'

import { formatDayText, formatPeriodText } from '@/shared/lib/date-text'
import type { ApproverInfo, GetUserRequestedVacationsResp } from '@/entities/vacation'

type Request = GetUserRequestedVacationsResp
type T = TFunction<'vacation', undefined>

/** 줄 · 상세 제목 — 신청 제목, 없으면 정책 이름 */
export const requestTitle = (r: Request): string => (r.desc?.trim() ? r.desc : r.policy_name)

/** 취소는 서버가 대기(PENDING)만 받는다(VacationServiceImpl cancelVacationRequest) */
export const canCancelRequest = (r: Request): boolean => r.grant_status === 'PENDING'

/** 대상 날짜 — "10월 21일 (수) 오후 7:00~11:00" · 시각이 없으면 "10월 17일 (토)". 신청 시각은 날짜만 보낸 정책이면 00:00 ~ null 이다 */
export const requestTargetText = (r: Request): string => {
  if (!r.request_end_time) return formatDayText(r.request_start_time)
  return formatPeriodText(r.request_start_time, r.request_end_time)
}

const ordered = (r: Request): ApproverInfo[] => [...(r.approvers ?? [])].sort((a, b) => a.approval_order - b.approval_order)

const APPROVED = new Set(['ACTIVE', 'EXHAUSTED', 'EXPIRED'])

/** 줄 아래 진행 글(I-25 D 20) — 응답의 결재선으로 짓는다. 값이 비면 그 조각을 빼고 문장이 되게 */
export const progressText = (r: Request, t: T): string => {
  const list = ordered(r)
  const n = list.length
  const status = r.grant_status
  if (status === 'CANCELED') return t('req.progressCanceled')
  if (status === 'REVOKED') return t('req.progressRevoked')
  if (status === 'REJECTED') {
    const rejected = list.find((a) => a.approval_status === 'REJECTED')
    if (!rejected) return t('status.rejected')
    return rejected.approver_name
      ? t('req.progressRejected', { k: rejected.approval_order, name: rejected.approver_name })
      : t('req.progressRejectedNoName', { k: rejected.approval_order })
  }
  if (APPROVED.has(status)) {
    if (n === 0) return t('req.progressAuto')
    const dates = list.map((a) => a.approval_date).filter((d): d is string => !!d).sort()
    const last = dates[dates.length - 1]
    return last ? t('req.progressApproved', { date: formatDayText(last) }) : t('req.progressApprovedNoDate')
  }
  const current = list.find((a) => a.approver_id === r.current_approver_id)
  const name = r.current_approver_name ?? current?.approver_name
  if (!name || !current) return t('req.progressWaiting')
  const k = current.approval_order
  if (status === 'PROGRESS') return t('req.progressProgress', { done: k - 1, name, k, n })
  return t('req.progressPending', { name, k, n })
}
