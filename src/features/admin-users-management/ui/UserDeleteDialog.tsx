import { GetUsersResp } from '@/entities/user'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/shadcn/alertDialog'
import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface UserDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: GetUsersResp
  onDelete: (id: string) => void
}

const UserDeleteDialog = ({ open, onOpenChange, user, onDelete }: UserDeleteDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const handleDelete = () => {
    if (user.user_id !== '') {
      onDelete(user.user_id)
    }
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="min-[40rem]:max-w-[32rem]">
        <div className="flex items-start space-x-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <TriangleAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogHeader className="flex-1">
            <AlertDialogTitle>{t('user.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('user.deleteConfirm', { name: user.user_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction variant='destructive' onClick={handleDelete}>
            {tc('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { UserDeleteDialog }
