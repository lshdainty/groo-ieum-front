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
import { VacationHistoryWidget } from '@/features/dashboard/ui/widgets/VacationHistory/VacationHistoryWidget'
import { VacationRequestStatsWidget } from '@/features/dashboard/ui/widgets/VacationRequestStatsWidget'
import { VacationStatsWidget } from '@/features/dashboard/ui/widgets/VacationStatsWidget'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 위젯 id → 그리는 부품(위젯이 자기 카드 틀까지 그린다). 새 틀로 옮기기 전 위젯은 아래 `framed` 로 옛 본문을 카드에 담는다 */
const framed = (id: string, body: 'content' | 'list', node: ReactNode): ReactNode => (
  <WidgetFrame id={id} body={body}>
    {node}
  </WidgetFrame>
)

export const WIDGET_VIEWS: Record<string, () => ReactNode> = {
  'vacation-stats': () => <VacationStatsWidget />,
  'today-work-status': () => <TodayWorkStatusWidget />,
  'month-stats': () => <MonthStatsWidget />,
  'type-stats': () => <TypeStatsWidget />,
  'system-check': () => <SystemCheckWidget />,
  profile: () => <ProfileWidget />,
  schedule: () => framed('schedule', 'content', <ScheduleWidget />),
  'vacation-application': () => framed('vacation-application', 'list', <ApplicationTableWidget />),
  'vacation-request-stats': () => framed('vacation-request-stats', 'content', <VacationRequestStatsWidget />),
  'vacation-history': () => framed('vacation-history', 'list', <VacationHistoryWidget />),
  dues: () => framed('dues', 'list', <DuesWidget />),
  'total-dues': () => framed('total-dues', 'content', <TotalDuesWidget />),
  'user-birth-dues': () => framed('user-birth-dues', 'content', <UserBirthDuesWidget />),
  'user-company-stats': () => framed('user-company-stats', 'content', <UserCompanyStatsWidget />),
  'missing-work-history': () => <MissingWorkHistoryWidget />,
  'user-vacation-stats': () => <UserVacationStatsWidget />,
  'department-chart': () => framed('department-chart', 'content', <DepartmentChartWidget />),
}
