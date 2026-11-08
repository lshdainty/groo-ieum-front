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
import { NoticeListResp } from '@/entities/notice'
import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface NoticeDeleteDialogProps {
  notice: NoticeListResp
  trigger: React.ReactNode
  onDelete: (noticeId: number) => void
}

const NoticeDeleteDialog = ({ notice, trigger, onDelete }: NoticeDeleteDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const handleDelete = () => {
    if (notice.notice_id) {
      onDelete(notice.notice_id)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className='min-[40rem]:max-w-[32rem]'>
        <div className='flex items-start space-x-4'>
          <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
            <TriangleAlert className='h-6 w-6 text-red-600 dark:text-red-400' />
          </div>
          <AlertDialogHeader className='flex-1'>
            <AlertDialogTitle>{t('notice.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('notice.deleteConfirm', { title: notice.title })}
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

export { NoticeDeleteDialog }
