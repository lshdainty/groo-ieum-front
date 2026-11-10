import { useMemo } from 'react'

import { useUsersQuery } from '@/entities/user'
import { CalendarContent } from '@/features/calendar/ui/CalendarContent'
import { CalendarProvider } from '@/features/calendar/model/calendar-context'
import type { IUser } from '@/features/calendar/model/interfaces'

/**
 * 캘린더 — 사용자 목록은 이름 · 사진을 입히는 보조라 못 받아도 일정은 일정이 가진 이름으로 그린다(quiet).
 * 화면의 읽기 기다림 · 실패는 `CalendarContent` 가 격자 자리에서 말한다.
 */
const CalendarPage = () => {
  const { data: apiUsers } = useUsersQuery({ quiet: true })

  const users = useMemo<IUser[]>(
    () => (apiUsers ?? []).map((user) => ({ id: user.user_id, name: user.user_name, picturePath: user.profile_url || null })),
    [apiUsers]
  )

  return (
    <CalendarProvider users={users} initialView='month'>
      <CalendarContent />
    </CalendarProvider>
  )
}

export { CalendarPage }
