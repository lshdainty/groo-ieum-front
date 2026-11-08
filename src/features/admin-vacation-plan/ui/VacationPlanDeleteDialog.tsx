import { useDeleteVacationPlanMutation } from '@/entities/vacation-plan'
import { type VacationPlanResp } from '@/entities/vacation-plan'
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

interface VacationPlanDeleteDialogProps {
  plan: VacationPlanResp
  trigger: React.ReactNode
}

const VacationPlanDeleteDialog = ({
  plan,
  trigger
}: VacationPlanDeleteDialogProps) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const deleteVacationPlan = useDeleteVacationPlanMutation()

  const handleDelete = async () => {
    if (plan?.code) {
      try {
        await deleteVacationPlan.mutateAsync(plan.code)
      } catch (error) {
        console.error('Failed to delete plan:', error)
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
            <AlertDialogTitle>{t('plan.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t('plan.deleteConfirm', { name: plan.name })}</p>
              <p className="text-destructive">{t('plan.deleteWarning')}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteVacationPlan.isPending}
          >
            {deleteVacationPlan.isPending ? tc('deleting') : tc('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { VacationPlanDeleteDialog }
