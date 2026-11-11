import { parseISO } from 'date-fns'

import { usePermission, useUser } from '@/entities/session'
import type { IEvent } from '@/features/calendar/model/interfaces'

/**
 * 일정을 만들 수 있는 사람 — 휴가 사용(VACATION:USE) · 일정 쓰기(SCHEDULE:WRITE) 중 하나라도 있으면.
 * 서버는 등록에 이 둘을 요구하고 MANAGE 는 남의 기록까지 넓혀 줄 뿐이라, MANAGE 만으로는 열지 않는다.
 */
export const useCanAddEvent = (): boolean => {
  const { hasAnyPermission } = usePermission()
  return hasAnyPermission(['VACATION:USE', 'SCHEDULE:WRITE'])
}

/**
 * 이 기록을 고치거나 지울 수 있나 — 서버(groo-ieum-back)의 수정 · 삭제 검사와 같다.
 * 휴가: VACATION:USE && (내 것 || VACATION:MANAGE), 시작 전만(서버가 시작 뒤 취소를 VACATION_006 으로 거절 — 수정은 취소 뒤 다시 등록이라 같다).
 * 일정: SCHEDULE:WRITE && (내 것 || SCHEDULE:MANAGE), 끝나기 전만(서버가 끝난 일정 삭제를 SCHEDULE_002 로 거절 — 수정은 삭제 뒤 다시 등록).
 * MANAGE 는 @PreAuthorize 의 USE · WRITE 를 넘지 못한다 — MANAGE 만 있으면 서버가 403 으로 막는다.
 */
export const useCanEditEvent = (): ((event: IEvent) => boolean) => {
  const { hasPermission } = usePermission()
  const { loginUser } = useUser()
  return (event) => {
    const own = loginUser?.user_id === event.user.id
    const now = new Date()
    if (event.kind === 'vacation') {
      return hasPermission('VACATION:USE') && (own || hasPermission('VACATION:MANAGE')) && parseISO(event.startDate) > now
    }
    return hasPermission('SCHEDULE:WRITE') && (own || hasPermission('SCHEDULE:MANAGE')) && parseISO(event.endDate) >= now
  }
}
