import { KeyRound, MailPlus, Pencil, ShieldEllipsis, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResponsiveMenuContent, ResponsiveMenuGroup, ResponsiveMenuItem } from '@/shared/ds/menu'
import type { GetUsersResp } from '@/entities/user'
import type { UserActions } from '../lib/user-format'
import { useManagementContext } from '../model/ManagementContext'

/** 줄 동작이 하나라도 있는가 — 없으면 ⋮ 를 그리지 않는다 */
export const hasUserActions = (a: UserActions): boolean => a.resend || a.edit || a.editDisabled || a.inviteEdit || a.plan || a.reset || a.remove

/**
 * 사용자 줄 ⋮ 의 내용(I-24 F 29) — 1280 이상 Menu · 미만 Menu Sheet(머리 = 이름). 상태별 갈래:
 * 가입 완료 = 수정 · 휴가 플랜 · 비밀번호 초기화 · (가름) 삭제 / 초대 대기 = 다시 보내기 · 초대 정보 수정 · (가름) 삭제 /
 * 그 밖(만료 등) = 다시 보내기 · 막힌 수정 · (가름) 삭제. 고른 동작은 ManagementContext 의 표면 상태를 연다(표면은 UserDialogs).
 */
export function UserRowMenuContent({ user, actions }: { user: GetUsersResp; actions: UserActions }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const ctx = useManagementContext()
  const id = user.user_id
  const top = actions.resend || actions.edit || actions.editDisabled || actions.inviteEdit || actions.plan || actions.reset
  return (
    <ResponsiveMenuContent title={user.user_name} description={id}>
      {top && (
        <ResponsiveMenuGroup>
          {actions.resend && <ResponsiveMenuItem label={t('user.resendEmail')} icon={<MailPlus />} onSelect={() => ctx.setShowResendDialog(id)} />}
          {actions.edit && <ResponsiveMenuItem label={t('user.editTitle')} icon={<Pencil />} onSelect={() => ctx.setShowEditDialog(id)} />}
          {actions.inviteEdit && <ResponsiveMenuItem label={t('user.inviteEdit')} icon={<Pencil />} onSelect={() => ctx.setShowInviteEditDialog(id)} />}
          {actions.editDisabled && <ResponsiveMenuItem label={t('user.editTitle')} icon={<Pencil />} disabled />}
          {actions.plan && <ResponsiveMenuItem label={t('user.vacationPlan')} icon={<ShieldEllipsis />} onSelect={() => ctx.setPlanDialog(id)} />}
          {actions.reset && <ResponsiveMenuItem label={t('user.passwordReset')} icon={<KeyRound />} onSelect={() => ctx.setShowPasswordResetDialog(id)} />}
        </ResponsiveMenuGroup>
      )}
      {actions.remove && (
        <ResponsiveMenuGroup>
          <ResponsiveMenuItem label={tc('delete')} icon={<Trash2 />} tone='critical' onSelect={() => ctx.setShowDeleteDialog(id)} />
        </ResponsiveMenuGroup>
      )}
    </ResponsiveMenuContent>
  )
}
