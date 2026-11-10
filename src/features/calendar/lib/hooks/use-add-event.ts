import { usePostScheduleMutation } from '@/entities/schedule'
import { usePostUseVacationMutation } from '@/entities/vacation'
import { eventRange, kindOfType, type EventFormPayloadInput } from '@/features/calendar/lib/event-payload'

export type AddEventParams = EventFormPayloadInput

export const useAddEvent = () => {
  const { mutateAsync: postUseVacation, isPending: isVacationPending } = usePostUseVacationMutation()
  const { mutateAsync: postSchedule, isPending: isSchedulePending } = usePostScheduleMutation()

  const isPending = isVacationPending || isSchedulePending

  /** 새 기록 — 종류가 휴가면 휴가 사용, 일정이면 일정. 실패하면 던진다(폼이 자기 자리에서 알린다) */
  const addEvent = (params: AddEventParams): Promise<unknown> => {
    const range = eventRange(params)
    if (kindOfType(params.calendarType) === 'vacation') {
      return postUseVacation({
        user_id: params.userId,
        ...range,
        vacation_type: params.vacationType ?? '',
        vacation_time_type: params.calendarType,
        vacation_desc: params.desc ?? '',
      })
    }
    return postSchedule({
      user_id: params.userId,
      ...range,
      schedule_type: params.calendarType,
      schedule_desc: params.desc ?? '',
    })
  }

  return { addEvent, isPending }
}
