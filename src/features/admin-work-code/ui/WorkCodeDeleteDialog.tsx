import { WorkCodeResp, useDeleteWorkCodeMutation } from '@/entities/work'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { useTranslation } from 'react-i18next'

interface WorkCodeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workCode: WorkCodeResp | null
  onSuccess?: () => void
}

const WorkCodeDeleteDialog = ({
  open,
  onOpenChange,
  workCode,
  onSuccess
}: WorkCodeDeleteDialogProps) => {
  const { t } = useTranslation('work')
  const { mutateAsync: deleteWorkCode } = useDeleteWorkCodeMutation()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('codeDelete')}
      description={t('codeDeleteConfirm', { name: workCode?.work_code_name })}
      onConfirm={async () => {
        if (workCode) await deleteWorkCode(workCode.work_code_id)
      }}
      onDone={onSuccess}
    />
  )
}

export { WorkCodeDeleteDialog }
