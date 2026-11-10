import dayjs from 'dayjs'

import { usePutUpdateScheduleMutation } from '@/entities/schedule'
import { usePutUpdateVacationUsageMutation } from '@/entities/vacation'
import { eventRange, type EventFormPayloadInput } from '@/features/calendar/lib/event-payload'
import type { IEvent } from '@/features/calendar/model/interfaces'
import type { TEventKind } from '@/features/calendar/model/types'

export interface UpdateEventParams extends EventFormPayloadInput {
  /** 고칠 기록의 번호 — `kind` 가 가리키는 표의 행 번호다 */
  eventId: number
  /** 고치는 기록이 원래 휴가 사용인지 일정인지 — 요청 경로는 이 값이 정한다. 폼에서 고른 종류가 아니다
   *  (종류를 다른 쪽으로 바꾸면 한 쪽 번호가 다른 쪽 PUT 으로 가 남의 기록을 고친다) */
  kind: TEventKind
}

const FORMAT = 'YYYY-MM-DDTHH:mm:ss'

export const useUpdateEvent = () => {
  const { mutateAsync: updateVacation, isPending: isVacationPending } = usePutUpdateVacationUsageMutation()
  const { mutateAsync: updateSchedule, isPending: isSchedulePending } = usePutUpdateScheduleMutation()

  const isPending = isVacationPending || isSchedulePending

  /** 폼 저장 — 기록이 가진 kind 의 PUT 으로만 간다. 실패하면 던진다 */
  const updateFromForm = (params: UpdateEventParams): Promise<unknown> => {
    const range = eventRange(params)
    if (params.kind === 'vacation') {
      return updateVacation({
        vacation_usage_id: params.eventId,
        user_id: params.userId,
        ...range,
        vacation_type: params.vacationType ?? '',
        vacation_time_type: params.calendarType,
        vacation_desc: params.desc ?? '',
      })
    }
    return updateSchedule({
      schedule_id: params.eventId,
      user_id: params.userId,
      ...range,
      schedule_type: params.calendarType,
      schedule_desc: params.desc ?? '',
    })
  }

  /** 끌어 옮기기(날짜만 바뀜) — 지금 기능 그대로. 기록의 kind 로 갈린다 */
  const updateEvent = (event: IEvent): void => {
    const base = { user_id: event.user.id, start_date: dayjs(event.startDate).format(FORMAT), end_date: dayjs(event.endDate).format(FORMAT) }
    if (event.kind === 'vacation') {
      void updateVacation({
        ...base,
        vacation_usage_id: event.id,
        vacation_type: event.vacationType || '',
        vacation_time_type: event.type.id,
        vacation_desc: event.description,
      }).catch(() => undefined)
    } else {
      void updateSchedule({ ...base, schedule_id: event.id, schedule_type: event.type.id, schedule_desc: event.description }).catch(() => undefined)
    }
  }

  return { updateEvent, updateFromForm, isPending }
}
