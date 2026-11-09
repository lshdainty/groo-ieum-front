import { useDeleteVacationPlanMutation } from '@/entities/vacation-plan'
import { type VacationPlanResp } from '@/entities/vacation-plan'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { useTranslation } from 'react-i18next'

interface VacationPlanDeleteDialogProps {
  plan: VacationPlanResp
  trigger: React.ReactNode
}

const VacationPlanDeleteDialog = ({
  plan,
  trigger
}: VacationPlanDeleteDialogProps) => {
  const { t } = useTranslation('vacation')
  const deleteVacationPlan = useDeleteVacationPlanMutation()

  return (
    <ConfirmDialog
      trigger={trigger}
      title={t('plan.deleteTitle')}
      description={t('plan.deleteConfirm', { name: plan.name })}
      onConfirm={() => deleteVacationPlan.mutateAsync(plan.code)}
    />
  )
}

export { VacationPlanDeleteDialog }
