import { parseISO } from 'date-fns'

import { usePermission, useUser } from '@/entities/session'
import type { IEvent } from '@/features/calendar/model/interfaces'

/** 일정을 만들 수 있는 사람 — 휴가 사용 · 일정 중 하나라도 쓸 수 있으면 */
export const useCanAddEvent = (): boolean => {
  const { hasAnyPermission } = usePermission()
  return hasAnyPermission(['VACATION:USE', 'VACATION:MANAGE', 'SCHEDULE:WRITE', 'SCHEDULE:MANAGE'])
}

/**
 * 이 기록을 고치거나 지울 수 있나 — 권한 + 서버가 거절하지 않을 때.
 * 휴가: (내 것 && VACATION:USE) || VACATION:MANAGE, 시작 전만(서버가 시작 뒤 취소를 VACATION_006 으로 거절 — 수정은 취소 뒤 다시 등록이라 같다).
 * 일정: (내 것 && SCHEDULE:WRITE) || SCHEDULE:MANAGE, 끝나기 전만(서버가 끝난 일정 삭제를 SCHEDULE_002 로 거절 — 수정은 삭제 뒤 다시 등록).
 */
export const useCanEditEvent = (): ((event: IEvent) => boolean) => {
  const { hasAnyPermission } = usePermission()
  const { loginUser } = useUser()
  return (event) => {
    const own = loginUser?.user_id === event.user.id
    const now = new Date()
    if (event.kind === 'vacation') {
      return ((own && hasAnyPermission(['VACATION:USE'])) || hasAnyPermission(['VACATION:MANAGE'])) && parseISO(event.startDate) > now
    }
    return ((own && hasAnyPermission(['SCHEDULE:WRITE'])) || hasAnyPermission(['SCHEDULE:MANAGE'])) && parseISO(event.endDate) >= now
  }
}
