import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useSnackbar } from '@/shared/ds/snackbar'
import { useResetPasswordMutation } from '@/entities/user'
import { ConfirmDialog } from '@/shared/ui/confirm'

interface UserPasswordResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
}

/** 비밀번호 초기화 — 잃는 것은 지금 비밀번호뿐이라 확정 [초기화] neutralSolid(I-24 51) */
const UserPasswordResetDialog = ({ open, onOpenChange, userId, userName }: UserPasswordResetDialogProps) => {
  const { t } = useTranslation('admin')
  const snackbar = useSnackbar()
  const { mutateAsync: resetPassword } = useResetPasswordMutation()
  const [name] = useState(userName)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('user.passwordResetTitle')}
      description={t('user.passwordResetConfirm', { name })}
      confirmLabel={t('user.reset')}
      tone='neutralSolid'
      kind='reset'
      onConfirm={() => resetPassword({ user_id: userId })}
      onDone={() => snackbar.show({ message: t('user.passwordResetSuccess'), tone: 'positive' })}
    />
  )
}

export { UserPasswordResetDialog }
