'use client'

import { useQuery } from '@tanstack/react-query'

import { createQueryKeys } from '@/shared/api'
import { calendarEventApi } from '@/entities/calendar-event/api/calendarEventApi'
import type { GetEventsByPeriodResp } from '@/entities/calendar-event/model/types'

export const calendarEventKeys = createQueryKeys('calendars')

export const useEventsByPeriodQuery = (startDate: string, endDate: string, options?: { quiet?: boolean }) => {
  return useQuery<GetEventsByPeriodResp[]>({
    queryKey: calendarEventKeys.list({ startDate, endDate }),
    queryFn: () => calendarEventApi.getEventsByPeriod(startDate, endDate),
    enabled: !!startDate && !!endDate,
    // quiet — 캘린더가 격자 자리에서 실패를 말한다(읽기 실패 임시 그물 Snackbar 를 건너뛴다)
    meta: options?.quiet ? { quiet: true } : undefined
  })
}
