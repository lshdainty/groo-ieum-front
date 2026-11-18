import { companyToday, type CalendarDate } from '@/shared/lib/company-date'
import { useUser } from '@/entities/session/model/UserContext'

/**
 * [userClock] 회사 기준 오늘 — 로그인 확인이 실은 회사 타임존(`company_timezone`)으로 센다(`companyToday`). 서버가 싣기 전이면
 * 브라우저 날짜. 휴가 화면의 기본 연도 · 해 선택지 · 휴가 차트의 해 고르기가 쓴다(서버가 쓴 · 예정을 가르는 오늘과 같은 시계).
 */
export function useCompanyToday(): CalendarDate {
  const { loginUser } = useUser()
  return companyToday(loginUser?.company_timezone)
}
