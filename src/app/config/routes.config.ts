// 컴포넌트 직접 import
import { ApplicationPage } from '@/pages/vacation-application'
import { Authority as AuthorityPage } from '@/pages/admin-authority'
import { CalendarPage } from '@/pages/calendar'
import { CompanyPage } from '@/pages/admin-company'
import { DashboardPage } from '@/pages/dashboard'
import { DuesPage } from '@/pages/culture-dues'
import { HistoryPage } from '@/pages/vacation-history'
import { HolidayPage } from '@/pages/admin-holiday'
import { NoticePage } from '@/pages/admin-notice'
import { PlanPage } from '@/pages/admin-vacation-plan'
import { PolicyPage } from '@/pages/admin-vacation-policy'
import { UserNoticeDetailPage, UserNoticePage } from '@/pages/notice'
import { ReportPage } from '@/pages/work-report'
import { RulePage } from '@/pages/culture-regulation'
import { SchedulePage } from '@/pages/work-schedule'
import { UsersDepartmentPage } from '@/pages/admin-users-department'
import { UsersManagementPage } from '@/pages/admin-users-management'
import { VacationPage } from '@/pages/admin-vacation-approval'
import { WorkCodePage } from '@/pages/admin-work'

import React from 'react'

export interface RouteConfig {
  id: string
  nameKey?: string // 메뉴 이름 키 (sidebar 네임스페이스 기준) — 화면(리프) 라우트만 갖는다. 메뉴 모델(widgets/layout/model/nav.ts)이 읽는다
  path: string
  children?: RouteConfig[]
  component?: React.ComponentType
  isDefault?: boolean
  requiredPermissions?: string[]
}

export interface RouteGroup {
  routes: RouteConfig[]
}

export const routesConfig: RouteGroup[] = [
  {
    routes: [
      {
        id: 'home',
        path: '/',
        children: [
          {
            id: 'dashboard',
            nameKey: 'menu.dashboard',
            path: '/dashboard',
            component: DashboardPage,
            isDefault: true,
          },
          {
            id: 'calendar',
            nameKey: 'menu.calendar',
            path: '/calendar',
            component: CalendarPage,
          },
          {
            id: 'notice',
            nameKey: 'menu.notice',
            path: '/notice',
            component: UserNoticePage,
            requiredPermissions: ['NOTICE:READ'],
          },
          {
            // 메뉴에 없는 하위 화면 — nameKey 가 없다(메뉴 모델이 읽지 않는다). 화면 제목 · 부모는 nav.ts 가 /notice 아래로 본다
            id: 'notice-detail',
            path: '/notice/:noticeId',
            component: UserNoticeDetailPage,
            requiredPermissions: ['NOTICE:READ'],
          },
        ],
      },
      {
        id: 'vacation',
        nameKey: 'menu.vacation',
        path: '/vacation',
        children: [
          {
            id: 'vacation-history',
            nameKey: 'menu.vacationHistory',
            path: '/vacation/history',
            component: HistoryPage,
            isDefault: true,
            requiredPermissions: ['VACATION:READ'],
          },
          {
            id: 'vacation-application',
            nameKey: 'menu.vacationApplication',
            path: '/vacation/application',
            component: ApplicationPage,
            requiredPermissions: ['VACATION:REQUEST'],
          },
        ],
      },
      {
        id: 'work',
        nameKey: 'menu.work',
        path: '/work',
        requiredPermissions: ['WORK:READ'],
        children: [
          {
            id: 'work-report',
            nameKey: 'menu.workReport',
            path: '/work/report',
            component: ReportPage,
            isDefault: true,
          },
          {
            id: 'work-schedule',
            nameKey: 'menu.workSchedule',
            path: '/work/schedule',
            component: SchedulePage,
          },
        ],
      },
      {
        id: 'culture',
        nameKey: 'menu.culture',
        path: '/culture',
        children: [
          {
            id: 'culture-dues',
            nameKey: 'menu.cultureDues',
            path: '/culture/dues',
            component: DuesPage,
            isDefault: true,
            requiredPermissions: ['DUES:READ'],
          },
          {
            id: 'culture-regulation',
            nameKey: 'menu.cultureRegulation',
            path: '/culture/regulation',
            component: RulePage,
            requiredPermissions: ['REGULATION:READ']
          },
        ],
      }
    ],
  },
  {
    routes: [
      {
        id: 'admin',
        path: '/admin',
        children: [
          {
            id: 'admin-company',
            nameKey: 'menu.adminCompany',
            path: '/admin/company',
            component: CompanyPage,
            isDefault: true,
            requiredPermissions: ['COMPANY:MANAGE'],
          },
          {
            id: 'admin-users',
            path: '/admin/users',
            isDefault: true,
            requiredPermissions: ['USER:MANAGE'],
            children: [
              {
                id: 'admin-users-management',
                nameKey: 'menu.adminUsersManagement',
                path: '/admin/users/management',
                component: UsersManagementPage,
                isDefault: true,
              },
              {
                id: 'users-department',
                nameKey: 'menu.adminUsersDepartment',
                path: '/admin/users/department',
                component: UsersDepartmentPage,
                isDefault: true,
              }
            ],
          },
          {
            id: 'admin-vacation',
            path: '/admin/vacation',
            requiredPermissions: ['VACATION:APPROVE'],
            children: [
              {
                id: 'admin-vacation-approval',
                nameKey: 'menu.adminVacationApproval',
                path: '/admin/vacation/approval',
                component: VacationPage,
                requiredPermissions: ['VACATION:APPROVE'],
                isDefault: true,
              },
              {
                id: 'admin-vacation-policy',
                nameKey: 'menu.adminVacationPolicy',
                path: '/admin/vacation/policy',
                requiredPermissions: ['VACATION:MANAGE'],
                component: PolicyPage,
              },
              {
                id: 'admin-vacation-plan',
                nameKey: 'menu.adminVacationPlan',
                path: '/admin/vacation/plan',
                requiredPermissions: ['VACATION:MANAGE'],
                component: PlanPage,
              },
            ],
          },
          {
            id: 'admin-authority',
            nameKey: 'menu.adminAuthority',
            path: '/admin/authority',
            requiredPermissions: ['ROLE:MANAGE'],
            isDefault: true,
            component: AuthorityPage
          },
          {
            id: 'admin-holiday',
            nameKey: 'menu.adminHoliday',
            path: '/admin/holiday',
            component: HolidayPage,
            isDefault: true,
            requiredPermissions: ['HOLIDAY:MANAGE'],
          },
          {
            id: 'admin-work',
            nameKey: 'menu.adminWork',
            path: '/admin/work',
            component: WorkCodePage,
            requiredPermissions: ['WORK:MANAGE'],
          },
          {
            id: 'admin-notice',
            nameKey: 'menu.adminNotice',
            path: '/admin/notice',
            component: NoticePage,
            requiredPermissions: ['NOTICE:MANAGE'],
          },
        ],
      }
    ]
  }
]

// 모든 그룹의 routes를 하나의 배열로 합치는 헬퍼 함수
export const flattenRoutes = (groups: RouteGroup[]): RouteConfig[] => {
  return groups.flatMap(group => group.routes)
}
