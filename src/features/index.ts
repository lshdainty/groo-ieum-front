// Features - Root Public API

// Auth
export { LoginContent } from '@/features/auth'
export { LoginProvider, useLoginContext } from '@/features/auth'

// Calendar
export { CalendarContent } from '@/features/calendar'
export { CalendarProvider, useCalendar } from '@/features/calendar'
export type { IEvent, IUser, ICalendarCell } from '@/features/calendar'
export type { TCalendarView, TEventColor, TCalendarType, TWorkingHours, TVisibleHours } from '@/features/calendar'
export { calendarTypes } from '@/features/calendar'

// Dashboard
export { DashboardContent } from '@/features/dashboard'

// User Notice
export { UserNoticeContent } from '@/features/user-notice'

// Vacation History
export { HistoryContent } from '@/features/vacation-history'
export { HistoryProvider, useHistoryContext } from '@/features/vacation-history'

// Vacation Application
export { ApplicationContent } from '@/features/vacation-application'
export { ApplicationProvider, useApplicationContext } from '@/features/vacation-application'

// Work Report
export { ReportContent } from '@/features/work-report'
export { ReportProvider, useReportContext } from '@/features/work-report'

// Work Schedule
export { ScheduleContent } from '@/features/work-schedule'
export { ScheduleProvider, useScheduleContext } from '@/features/work-schedule'

// Culture Dues
export { DuesContent } from '@/features/culture-dues'
export { DuesProvider, useDuesContext } from '@/features/culture-dues'

// Culture Regulation
export { RuleContent } from '@/features/culture-regulation'
export { RuleProvider, useRuleContext } from '@/features/culture-regulation'

// User Profile
export { UserInfoContent, PasswordChangeContent } from '@/features/user-profile'

// Admin - Company
export { CompanyContent } from '@/features/admin-company'
export { CompanyProvider, useCompanyContext } from '@/features/admin-company'

// Admin - Users Management
export { ManagementContent } from '@/features/admin-users-management'
export { ManagementProvider, useManagementContext } from '@/features/admin-users-management'

// Admin - Users Department
export { DepartmentContent } from '@/features/admin-users-department'
export { DepartmentProvider, useDepartmentContext } from '@/features/admin-users-department'

// Admin - Vacation Approval
export { VacationContent } from '@/features/admin-vacation-approval'
export { VacationProvider, useVacationContext } from '@/features/admin-vacation-approval'

// Admin - Vacation Policy
export { PolicyContent } from '@/features/admin-vacation-policy'
export { PolicyProvider, usePolicyContext } from '@/features/admin-vacation-policy'

// Admin - Vacation Plan
export { PlanContent } from '@/features/admin-vacation-plan'
export { PlanProvider, usePlanContext } from '@/features/admin-vacation-plan'

// Admin - Authority
export { RoleManagementPanel, UserManagementPanel } from '@/features/admin-authority'

// Admin - Holiday
export { HolidayContent } from '@/features/admin-holiday'

// Admin - Work Code
export { WorkCodeContent } from '@/features/admin-work-code'

// Admin - Notice
export { NoticeContent } from '@/features/admin-notice'
