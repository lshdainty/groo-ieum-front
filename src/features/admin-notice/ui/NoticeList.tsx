import { Badge } from '@/shared/ui/shadcn/badge'
import { Button } from '@/shared/ui/shadcn/button'
import { Card, CardContent } from '@/shared/ui/shadcn/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/shadcn/dropdownMenu'
import { NoticeDeleteDialog } from '@/features/admin-notice/ui/NoticeDeleteDialog'
import { type NoticeListResp } from '@/entities/notice';
import { EllipsisVertical, Eye, Pencil, Pin, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const noticeTypeColors: Record<string, string> = {
  GENERAL: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
  URGENT: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
  EVENT: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
};

interface NoticeListProps {
  notices?: NoticeListResp[]
  onEdit: (notice: NoticeListResp) => void
  onDelete: (noticeId: number) => Promise<unknown>
}

const NoticeList = ({
  notices,
  onEdit,
  onDelete,
}: NoticeListProps) => {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  return (
    <div className='grid gap-4'>
      {notices?.map((notice) => (
        <Card key={notice.notice_id} className='hover:shadow-md transition-shadow'>
          <CardContent className='px-6'>
            <div className='flex flex-col min-[40rem]:flex-row items-start min-[40rem]:items-center justify-between gap-4'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-2'>
                  {notice.is_pinned === 'Y' && (
                    <Pin className='h-4 w-4 text-amber-500 shrink-0' />
                  )}
                  <h3 className='text-lg font-semibold text-card-foreground truncate'>
                    {notice.title}
                  </h3>
                </div>
                <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
                  <span>{notice.writer_name}</span>
                  <span className='text-card-foreground/50'>•</span>
                  <span>{formatDate(notice.create_date)}</span>
                  <span className='text-card-foreground/50'>•</span>
                  <span className='flex items-center gap-1'>
                    <Eye className='h-3 w-3' />
                    {notice.view_count}
                  </span>
                </div>
                <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
                  <span>{t('notice.displayPeriod')}: {formatDate(notice.start_date)} ~ {formatDate(notice.end_date)}</span>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-2 w-full min-[40rem]:w-auto'>
                <Badge className={noticeTypeColors[notice.notice_type] || noticeTypeColors.GENERAL}>
                  {notice.notice_type_name}
                </Badge>
                {isActive(notice.start_date, notice.end_date) ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800">
                    {t('notice.statusActive')}
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    {t('notice.statusInactive')}
                  </Badge>
                )}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-muted ml-auto min-[40rem]:ml-0'
                    >
                      <EllipsisVertical className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-32'>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        onEdit(notice);
                      }}
                    >
                      <Pencil className='h-4 w-4' />
                      <span>{tc('edit')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <NoticeDeleteDialog
                      notice={notice}
                      onDelete={onDelete}
                      trigger={
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className='text-destructive focus:text-destructive hover:!bg-destructive/20'
                        >
                          <Trash2 className='h-4 w-4' />
                          <span>{tc('delete')}</span>
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { NoticeList }
