import { useTranslation } from 'react-i18next'

import { useCompanyTypesQuery } from '@/entities/type'
import { useDeleteUserMutation, usePutUserMutation, type GetUsersResp } from '@/entities/user'
import { UserEditDialog } from '@/features/user-profile/ui/UserEditDialog'
import { useManagementContext } from '../model/ManagementContext'
import { ResendEmailDialog } from './ResendEmailDialog'
import { UserDeleteDialog } from './UserDeleteDialog'
import { UserInviteDialog } from './UserInviteDialog'
import { UserPasswordResetDialog } from './UserPasswordResetDialog'
import { UserVacationPlanDialog } from './UserVacationPlanDialog'

/** 사용자 관리의 표면 모음 — 화면이 폭으로 트리를 가르는 자리 밖에 둔다(열린 폼 · 확인창이 폭 변화에 닫히지 않게) */
export function UserDialogs({ users }: { users: GetUsersResp[] }) {
  const { t } = useTranslation('admin')
  const ctx = useManagementContext()
  const { data: companyTypes } = useCompanyTypesQuery()
  const { mutateAsync: putUser } = usePutUserMutation()
  const { mutateAsync: deleteUser } = useDeleteUserMutation()
  const find = (id: string | null) => users.find((u) => u.user_id === id)

  const edit = find(ctx.showEditDialog)
  const inviteEdit = find(ctx.showInviteEditDialog)
  const plan = find(ctx.showPlanDialog)
  const resend = find(ctx.showResendDialog)
  const reset = find(ctx.showPasswordResetDialog)
  const del = find(ctx.showDeleteDialog)

  return (
    <>
      {/* 초대 — 빈 목록에서도 연다 */}
      {ctx.showInviteDialog && <UserInviteDialog open onOpenChange={ctx.setShowInviteDialog} title={t('user.inviteTitle')} companyOptions={companyTypes || []} />}
      {inviteEdit && (
        <UserInviteDialog
          open
          onOpenChange={(open) => !open && ctx.setShowInviteEditDialog(null)}
          title={t('user.inviteEdit')}
          companyOptions={companyTypes || []}
          initialData={{
            user_id: inviteEdit.user_id,
            user_name: inviteEdit.user_name,
            user_email: inviteEdit.user_email,
            user_company_type: inviteEdit.user_company_type,
            user_work_time: inviteEdit.user_work_time,
            join_date: inviteEdit.join_date,
            country_code: inviteEdit.country_code,
          }}
        />
      )}
      {edit && (
        <UserEditDialog
          open
          onOpenChange={(open) => !open && ctx.setShowEditDialog(null)}
          user={edit}
          title={t('user.editTitle')}
          onSave={(u) => putUser(u)}
        />
      )}
      {plan && <UserVacationPlanDialog open onOpenChange={(open) => !open && ctx.setPlanDialog(null)} userId={plan.user_id} userName={plan.user_name} />}
      {resend && <ResendEmailDialog open onOpenChange={(open) => !open && ctx.setShowResendDialog(null)} userId={resend.user_id} userEmail={resend.user_email} />}
      {reset && <UserPasswordResetDialog open onOpenChange={(open) => !open && ctx.setShowPasswordResetDialog(null)} userId={reset.user_id} userName={reset.user_name} />}
      {del && <UserDeleteDialog open onOpenChange={(open) => !open && ctx.setShowDeleteDialog(null)} user={del} onDelete={(id) => deleteUser(id)} />}
    </>
  )
}
