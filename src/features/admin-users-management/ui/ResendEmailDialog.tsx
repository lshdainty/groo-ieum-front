import { usePostResendInvitationMutation } from '@/entities/user'
import { Button } from '@/shared/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { useTranslation } from 'react-i18next'

interface ResendEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userEmail: string
}

const ResendEmailDialog = ({ open, onOpenChange, userId, userEmail }: ResendEmailDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { mutateAsync: resendInvitation, isPending } = usePostResendInvitationMutation()

  const handleConfirm = async () => {
    await resendInvitation(userId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-[40rem]:max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>{t('user.resendEmailTitle')}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {t('user.resendEmailConfirm', { email: userEmail })}
          </p>
        </div>
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
                {t('user.sending')}
              </>
            ) : (
              t('user.send')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ResendEmailDialog }
