import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useSnackbar } from '@/shared/ds/snackbar'
import { usePostResendInvitationMutation } from '@/entities/user'
import { ConfirmDialog } from '@/shared/ui/confirm'

interface ResendEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userEmail: string
}

/** 초대 메일 다시 보내기 — 잃는 것이 없는 일이라 확정 [보내기] neutralSolid(I-24 51). 실패는 확인창 규칙(닫고 Snackbar + [다시 시도]) */
const ResendEmailDialog = ({ open, onOpenChange, userId, userEmail }: ResendEmailDialogProps) => {
  const { t } = useTranslation('admin')
  const snackbar = useSnackbar()
  const { mutateAsync: resendInvitation } = usePostResendInvitationMutation()
  const [email] = useState(userEmail)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('user.resendEmailTitle')}
      description={t('user.resendEmailConfirm', { email })}
      confirmLabel={t('user.send')}
      tone='neutralSolid'
      kind='send'
      onConfirm={() => resendInvitation(userId)}
      onDone={() => snackbar.show({ message: t('user.resendEmailDone'), tone: 'positive' })}
    />
  )
}

export { ResendEmailDialog }
