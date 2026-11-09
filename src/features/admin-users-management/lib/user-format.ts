import type { GetUsersResp } from '@/entities/user'

export type UserStatusTone = 'positive' | 'neutral' | 'warning'

/** 초대 상태 → 배지 톤 · 글 키(admin 이름공간). 가입 완료 positive · 초대 대기 neutral · 초대 만료 warning */
export const userStatusOf = (status: string | undefined): { tone: UserStatusTone; key: string } | null => {
  switch (status) {
    case 'ACTIVE':
      return { tone: 'positive', key: 'user.statusActive' }
    case 'PENDING':
      return { tone: 'neutral', key: 'user.statusPending' }
    case 'EXPIRED':
      return { tone: 'warning', key: 'user.statusExpired' }
    case 'INACTIVE':
      return { tone: 'neutral', key: 'user.statusInactive' }
    default:
      return null
  }
}

export { formatWorkTime } from '@/shared/lib/work-time'

/** 줄 ⋮ 에서 고를 수 있는 동작 — 상태 · 권한으로 정한다(UserTable 의 지금 갈래 그대로) */
export interface UserActions {
  resend: boolean
  edit: boolean
  inviteEdit: boolean
  /** 만료 등 — 지금 그대로 막힌 "사용자 수정" 줄 */
  editDisabled: boolean
  plan: boolean
  reset: boolean
  remove: boolean
}

export const userActionsOf = (
  user: Pick<GetUsersResp, 'invitation_status'>,
  can: { manage: boolean; manageVacation: boolean },
): UserActions => {
  const status = user.invitation_status
  const active = status === 'ACTIVE'
  const pending = status === 'PENDING'
  return {
    resend: can.manage && !active,
    edit: can.manage && active,
    editDisabled: !active && !pending,
    inviteEdit: can.manage && pending,
    plan: active && can.manage && can.manageVacation,
    reset: active && can.manage,
    remove: can.manage,
  }
}

/** 줄 동작이 하나라도 있는가 — 없으면 ⋮ 를 그리지 않는다 */
export const hasUserActions = (a: UserActions): boolean => a.resend || a.edit || a.editDisabled || a.inviteEdit || a.plan || a.reset || a.remove

