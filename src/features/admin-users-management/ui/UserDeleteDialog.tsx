import { useState } from 'react'
import { GetUsersResp } from '@/entities/user'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { useTranslation } from 'react-i18next'

interface UserDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: GetUsersResp
  /** 지운다 — 실패하면 던진다(확인창이 닫히고 실패 알림이 뜬다) */
  onDelete: (id: string) => Promise<unknown>
}

const UserDeleteDialog = ({ open, onOpenChange, user, onDelete }: UserDeleteDialogProps) => {
  const { t } = useTranslation('admin')
  // 여는 때의 사용자를 붙잡는다 — 지운 뒤 목록이 먼저 바뀌어도 설명 글이 비지 않게
  const [target] = useState(user)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('user.deleteTitle')}
      description={t('user.deleteConfirm', { name: target.user_name })}
      onConfirm={() => onDelete(target.user_id)}
    />
  )
}

export { UserDeleteDialog }
