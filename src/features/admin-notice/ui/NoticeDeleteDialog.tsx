import { NoticeListResp } from '@/entities/notice'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { useTranslation } from 'react-i18next'

interface NoticeDeleteDialogProps {
  notice: NoticeListResp
  trigger: React.ReactNode
  /** 지운다 — 실패하면 던진다(확인창이 닫히고 실패 알림이 뜬다) */
  onDelete: (noticeId: number) => Promise<unknown>
}

const NoticeDeleteDialog = ({ notice, trigger, onDelete }: NoticeDeleteDialogProps) => {
  const { t } = useTranslation('admin')

  return (
    <ConfirmDialog
      trigger={trigger}
      title={t('notice.deleteTitle')}
      description={t('notice.deleteConfirm', { title: notice.title })}
      onConfirm={() => onDelete(notice.notice_id)}
    />
  )
}

export { NoticeDeleteDialog }
