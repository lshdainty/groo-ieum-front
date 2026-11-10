import { useDeleteScheduleMutation } from '@/entities/schedule';
import { useDeleteVacationUsageMutation } from '@/entities/vacation';
import type { IEvent } from '@/features/calendar/model/interfaces';

export const useDeleteEvent = () => {
  const { mutateAsync: deleteVacation, isPending: isVacationPending } = useDeleteVacationUsageMutation();
  const { mutateAsync: deleteSchedule, isPending: isSchedulePending } = useDeleteScheduleMutation();

  const isPending = isVacationPending || isSchedulePending;

  // 실패하면 던진다 — 확인창(ConfirmDialog)이 닫히고 실패 알림이 뜬다. 어느 표의 번호인지는 기록의 kind 가 정한다
  const deleteEvent = (event: IEvent): Promise<unknown> =>
    event.kind === 'vacation' ? deleteVacation(event.id) : deleteSchedule(event.id);

  return { deleteEvent, isPending };
};
