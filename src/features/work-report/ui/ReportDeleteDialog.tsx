import { ConfirmDialog } from '@/shared/ui/confirm'
import { WorkHistory } from '@/features/work-report/model/types'
import { useTranslation } from 'react-i18next'

interface ReportDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workHistory: WorkHistory | null
  /** 지운다 — 실패하면 던진다(확인창이 닫히고 실패 알림이 뜬다) */
  onConfirm: () => Promise<unknown>
}

const ReportDeleteDialog = ({ open, onOpenChange, workHistory, onConfirm }: ReportDeleteDialogProps) => {
  const { t } = useTranslation('work')

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('report.deleteTitle')}
      description={t('report.deleteConfirm', { date: workHistory?.date })}
      onConfirm={onConfirm}
    />
  )
}

export { ReportDeleteDialog }
