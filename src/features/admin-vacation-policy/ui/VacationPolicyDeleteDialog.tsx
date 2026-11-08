import { useDeleteVacationPolicyMutation } from '@/entities/vacation-policy'
import { type GetVacationPoliciesResp } from '@/entities/vacation-policy'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/shadcn/alertDialog'
import { TriangleAlert } from 'lucide-react'
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
  const { t: tc } = useTranslation('common')
  const deleteVacationPolicy = useDeleteVacationPolicyMutation()

  const handleDelete = async () => {
    if (policy?.vacation_policy_id) {
      try {
        await deleteVacationPolicy.mutateAsync(policy.vacation_policy_id)
      } catch (error) {
        console.error(t('policy.saveError'), error)
      }
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="min-[40rem]:max-w-[32rem]">
        <div className="flex items-start space-x-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <TriangleAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogHeader className="flex-1">
            <AlertDialogTitle>{t('policy.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('policy.deleteConfirm', { name: policy.vacation_policy_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteVacationPolicy.isPending}
          >
            {deleteVacationPolicy.isPending ? tc('deleting') : tc('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { VacationPolicyDeleteDialog }
