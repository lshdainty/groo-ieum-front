import { toast } from '@/shared/ui/shadcn/sonner';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { useUnregisteredWorkHistoryExcelDownloadMutation } from '@/entities/work';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { claimFailure } from '@/shared/api/failure'

interface UnregisteredDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UnregisteredDownloadDialog = ({ open, onOpenChange }: UnregisteredDownloadDialogProps) => {
  const { t } = useTranslation('work');
  const { t: tc } = useTranslation('common');
  const [downloadYear, setDownloadYear] = useState(dayjs().year());
  const [downloadMonth, setDownloadMonth] = useState(dayjs().month() + 1);
  const downloadUnregisteredWorkHistoryExcel = useUnregisteredWorkHistoryExcelDownloadMutation();

  const handleConfirmUnregisteredDownload = async () => {
    try {
      const blob = await downloadUnregisteredWorkHistoryExcel.mutateAsync({
        year: downloadYear,
        month: downloadMonth
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t('unregistered.fileNamePrefix')}_${downloadYear}${t('unregistered.fileNameYear')}_${downloadMonth}${t('unregistered.fileNameMonth')}_${dayjs().format('YYYYMMDD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (error) {
      console.error('Unregistered list download failed:', error);
      claimFailure(error);
      toast.error(t('unregistered.downloadFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='min-[40rem]:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{t('unregistered.title')}</DialogTitle>
          <DialogDescription>
            {t('unregistered.desc')}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='year' className='text-right'>
              {t('unregistered.year')}
            </Label>
            <Input
              id='year'
              type='number'
              value={downloadYear}
              onChange={(e) => setDownloadYear(Number(e.target.value))}
              className='col-span-3'
              min={2000}
              max={2100}
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='month' className='text-right'>
              {t('unregistered.month')}
            </Label>
            <Input
              id='month'
              type='number'
              value={downloadMonth}
              onChange={(e) => setDownloadMonth(Number(e.target.value))}
              className='col-span-3'
              min={1}
              max={12}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          <Button
            type='button'
            onClick={handleConfirmUnregisteredDownload}
            disabled={downloadUnregisteredWorkHistoryExcel.isPending}
          >
            {downloadUnregisteredWorkHistoryExcel.isPending ? t('unregistered.downloading') : tc('download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { UnregisteredDownloadDialog }
