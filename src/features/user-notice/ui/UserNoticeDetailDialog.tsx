import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import { NoticeType, useNoticeQuery } from '@/entities/notice'
import dayjs from 'dayjs';
import { Calendar, Eye, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UserNoticeDetailDialogProps {
  noticeId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const noticeTypeBadgeVariant: Record<NoticeType, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  GENERAL: 'secondary',
  URGENT: 'destructive',
  EVENT: 'default',
  MAINTENANCE: 'outline',
};

export const UserNoticeDetailDialog = ({
  noticeId,
  isOpen,
  onClose,
}: UserNoticeDetailDialogProps) => {
  const { t } = useTranslation(['notice', 'common']);
  const { data: notice, isLoading } = useNoticeQuery(isOpen ? noticeId : null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-[40rem]:max-w-[600px] max-h-[80vh] flex flex-col">
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : notice ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={noticeTypeBadgeVariant[notice.notice_type]}>
                  {notice.notice_type_name}
                </Badge>
                {notice.is_pinned === 'Y' && (
                  <Badge variant="outline">{t('notice:pinned')}</Badge>
                )}
              </div>
              <DialogTitle className="text-xl">{notice.title}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground py-2 border-b">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{notice.writer_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{dayjs(notice.create_date).format('YYYY-MM-DD HH:mm')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{notice.view_count}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {notice.content}
              </p>
            </div>
          </>
        ) : null}

        <DialogFooter>
          <Button onClick={onClose} className="w-full min-[40rem]:w-auto">
            {t('common:close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
