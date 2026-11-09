'use client';

import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Text, User } from 'lucide-react';
import { Activity, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/shadcn/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog';
import { ConfirmDialog } from '@/shared/ui/confirm';
import { usePermission } from '@/entities/session';
import { useUser } from '@/entities/session';
import { EditEventDialog } from '@/features/calendar/ui/dialogs/edit-event-dialog';
import { useDeleteEvent } from '@/features/calendar/lib/hooks/use-delete-event';
import { getEventDisplayName } from '@/features/calendar/lib/helpers';

import type { IEvent } from '@/features/calendar/model/interfaces';

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const { t } = useTranslation('calendar');
  const { t: tc } = useTranslation('common');
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 휴가 이벤트를 지우면 휴가 사용 내역이 지워지고 쓴 시간이 돌아온다 — 일반 일정과 글이 다르다
  const isVacation = event.type.type === 'vacation';
  const { deleteEvent } = useDeleteEvent();
  const { hasAnyPermission } = usePermission();
  const { loginUser } = useUser();

  // 본인 이벤트 여부 확인
  const isOwnEvent = loginUser?.user_id === event.user.id;

  // 권한 체크: 이벤트 타입에 따라 권한 확인
  const eventType = event.type.type; // 'vacation' | 'schedule'

  // 휴가: (본인 이벤트 && VACATION:USE) || VACATION:MANAGE
  // 스케줄: (본인 이벤트 && SCHEDULE:WRITE) || SCHEDULE:MANAGE
  const canModifyVacation = (isOwnEvent && hasAnyPermission(['VACATION:USE'])) || hasAnyPermission(['VACATION:MANAGE']);
  const canModifySchedule = (isOwnEvent && hasAnyPermission(['SCHEDULE:WRITE'])) || hasAnyPermission(['SCHEDULE:MANAGE']);

  // 해당 이벤트 타입에 대한 수정/삭제 권한
  const canModify = eventType === 'vacation' ? canModifyVacation : canModifySchedule;


  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent className='min-[40rem]:max-w-[24rem]'>
          <DialogHeader>
            <DialogTitle>{getEventDisplayName(event)}</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='flex items-start gap-2'>
              <User className='mt-1 size-4 shrink-0' />
              <div>
                <p className='text-sm font-medium'>{t('eventDetails.user')}</p>
                <p className='text-sm text-muted-foreground'>{event.user.name}</p>
              </div>
            </div>

            <div className='flex items-start gap-2'>
              <Calendar className='mt-1 size-4 shrink-0' />
              <div>
                <p className='text-sm font-medium'>{t('eventDetails.startDate')}</p>
                <p className='text-sm text-muted-foreground'>{format(startDate, 'yyyy.MM.dd hh:mm a')}</p>
              </div>
            </div>

            <div className='flex items-start gap-2'>
              <Clock className='mt-1 size-4 shrink-0' />
              <div>
                <p className='text-sm font-medium'>{t('eventDetails.endDate')}</p>
                <p className='text-sm text-muted-foreground'>{format(endDate, 'yyyy.MM.dd hh:mm a')}</p>
              </div>
            </div>

            <div className='flex items-start gap-2'>
              <Text className='mt-1 size-4 shrink-0' />
              <div>
                <p className='text-sm font-medium'>{t('eventDetails.content')}</p>
                <p className='text-sm text-muted-foreground'>{event.description}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Activity mode={canModify ? 'visible' : 'hidden'}>
              <EditEventDialog event={event}>
                <Button type='button' variant='outline'>
                  {tc('edit')}
                </Button>
              </EditEventDialog>
            </Activity>
            <Activity mode={canModify ? 'visible' : 'hidden'}>
              <Button type='button' variant='destructive' onClick={() => setConfirmOpen(true)}>
                {tc('delete')}
              </Button>
            </Activity>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일정 상세 위에 뜬다 — 지우면 둘 다 닫힌다 */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isVacation ? tc('deleteVacation.title') : t('eventDetails.deleteTitle')}
        description={
          isVacation
            ? tc('deleteVacation.confirm', { date: format(startDate, 'yyyy.MM.dd') })
            : t('eventDetails.deleteConfirm', { date: format(startDate, 'yyyy.MM.dd'), title: getEventDisplayName(event) })
        }
        onConfirm={() => deleteEvent(event)}
        onDone={() => setOpen(false)}
      />
    </>
  );
}
