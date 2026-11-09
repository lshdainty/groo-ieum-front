import type { ReactNode } from 'react'

import { ApplicationTableWidget } from '@/features/dashboard/ui/widgets/ApplicationTableWidget'
import { DepartmentChartWidget } from '@/features/dashboard/ui/widgets/DepartmentChartWidget'
import { DuesWidget } from '@/features/dashboard/ui/widgets/DuesWidget'
import { MissingWorkHistoryWidget } from '@/features/dashboard/ui/widgets/MissingWorkHistoryWidget'
import { MonthStatsWidget } from '@/features/dashboard/ui/widgets/MonthStatsWidget'
import { ProfileWidget } from '@/features/dashboard/ui/widgets/ProfileWidget'
import { ScheduleWidget } from '@/features/dashboard/ui/widgets/ScheduleWidget'
import { SystemCheckWidget } from '@/features/dashboard/ui/widgets/SystemCheckWidget'
import { TodayWorkStatusWidget } from '@/features/dashboard/ui/widgets/TodayWorkStatusWidget'
import { TotalDuesWidget } from '@/features/dashboard/ui/widgets/TotalDuesWidget'
import { TypeStatsWidget } from '@/features/dashboard/ui/widgets/TypeStatsWidget'
import { UserBirthDuesWidget } from '@/features/dashboard/ui/widgets/UserBirthDuesWidget'
import { UserCompanyStatsWidget } from '@/features/dashboard/ui/widgets/UserCompanyStatsWidget'
import { UserVacationStatsWidget } from '@/features/dashboard/ui/widgets/UserVacationStatsWidget'
import { VacationHistoryWidget } from '@/features/dashboard/ui/widgets/VacationHistoryWidget'
import { VacationRequestStatsWidget } from '@/features/dashboard/ui/widgets/VacationRequestStatsWidget'
import { VacationStatsWidget } from '@/features/dashboard/ui/widgets/VacationStatsWidget'

/** 위젯 id → 그리는 부품(위젯이 자기 카드 틀까지 그린다) */
export const WIDGET_VIEWS: Record<string, () => ReactNode> = {
  'vacation-stats': () => <VacationStatsWidget />,
  'today-work-status': () => <TodayWorkStatusWidget />,
  'month-stats': () => <MonthStatsWidget />,
  'type-stats': () => <TypeStatsWidget />,
  'system-check': () => <SystemCheckWidget />,
  profile: () => <ProfileWidget />,
  schedule: () => <ScheduleWidget />,
  'vacation-application': () => <ApplicationTableWidget />,
  'vacation-request-stats': () => <VacationRequestStatsWidget />,
  'vacation-history': () => <VacationHistoryWidget />,
  dues: () => <DuesWidget />,
  'total-dues': () => <TotalDuesWidget />,
  'user-birth-dues': () => <UserBirthDuesWidget />,
  'user-company-stats': () => <UserCompanyStatsWidget />,
  'missing-work-history': () => <MissingWorkHistoryWidget />,
  'user-vacation-stats': () => <UserVacationStatsWidget />,
  'department-chart': () => <DepartmentChartWidget />,
}
