import { Button } from '@/shared/ui/shadcn/button';
import { Checkbox } from '@/shared/ui/shadcn/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Label } from '@/shared/ui/shadcn/label';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface NoticePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onHideToday: () => void;
  title: string;
  content: React.ReactNode;
}

export const NoticePopup = ({
  isOpen,
  onClose,
  onHideToday,
  title,
  content,
}: NoticePopupProps) => {
  const { t } = useTranslation('common');
  const [dontShowToday, setDontShowToday] = useState(false);

  const handleClose = () => {
    if (dontShowToday) {
      setDontShowToday(false);
      onHideToday();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="min-[40rem]:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 max-h-[400px] overflow-y-auto">
          {typeof content === 'string' ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {content}
            </p>
          ) : (
            content
          )}
        </div>
        <DialogFooter className="flex-col min-[40rem]:flex-col gap-2">
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id="dontShowToday"
              checked={dontShowToday}
              onCheckedChange={(checked) => setDontShowToday(checked as boolean)}
            />
            <Label
              htmlFor="dontShowToday"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('dontShowToday')}
            </Label>
          </div>
          <Button onClick={handleClose} className="w-full">
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
