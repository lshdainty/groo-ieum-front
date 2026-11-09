import { useDeleteVacationPolicyMutation } from '@/entities/vacation-policy'
import { type GetVacationPoliciesResp } from '@/entities/vacation-policy'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { useTranslation } from 'react-i18next'

interface VacationPolicyDeleteDialogProps {
  policy: GetVacationPoliciesResp
  trigger: React.ReactNode
}

const VacationPolicyDeleteDialog = ({
  policy,
  trigger
}: VacationPolicyDeleteDialogProps) => {
  const { t } = useTranslation('vacation')
  const deleteVacationPolicy = useDeleteVacationPolicyMutation()

  return (
    <ConfirmDialog
      trigger={trigger}
      title={t('policy.deleteTitle')}
      description={t('policy.deleteConfirm', { name: policy.vacation_policy_name })}
      onConfirm={() => deleteVacationPolicy.mutateAsync(policy.vacation_policy_id)}
    />
  )
}

export { VacationPolicyDeleteDialog }
