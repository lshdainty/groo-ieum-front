import { useResetPasswordMutation } from '@/entities/user'
import { Button } from '@/shared/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog'
import { toast } from '@/shared/ui/shadcn/sonner'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { useTranslation } from 'react-i18next'
import { claimFailure } from '@/shared/api/failure'

interface UserPasswordResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
}

const UserPasswordResetDialog = ({ open, onOpenChange, userId, userName }: UserPasswordResetDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { mutateAsync: resetPassword, isPending } = useResetPasswordMutation()

  const handleConfirm = async () => {
    try {
      await resetPassword({ user_id: userId })
      toast.success(t('user.passwordResetSuccess'))
      onOpenChange(false)
    } catch (error) {
      claimFailure(error)
      toast.error(t('user.passwordResetError'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-[40rem]:max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>{t('user.passwordResetTitle')}</DialogTitle>
          <DialogDescription>
            {t('user.passwordResetConfirm', { name: userName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isPending}>
              {tc('cancel')}
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                {t('user.resetting')}
              </>
            ) : (
              t('user.reset')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { UserPasswordResetDialog }
