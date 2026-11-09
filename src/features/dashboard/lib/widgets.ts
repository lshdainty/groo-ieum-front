/*
 * 홈 위젯 17 의 정의(I-23 D 표) — id · 이름 키 · 볼 수 있는 권한 · 자리 · "전체 보기" 목적지.
 * 자리(place)는 1280 이상 2 : 1 두 열에서만 뜻이 있다 — wide = 왼쪽(2), narrow = 오른쪽(1). 1279 이하는 고른 차례대로 한 칸이다.
 * 저장된 배치의 모양은 read-home-widgets.ts 가 읽는다(이 파일은 어떤 위젯이 있는가만 안다).
 */

export type WidgetPlace = 'wide' | 'narrow'

export interface WidgetSeeAll {
  /** 목적지 화면 주소 */
  path: string
  /** 목적지를 볼 수 있는 권한 — 하나라도 있으면 동작을 그린다. 비면 권한이 필요 없다 */
  permissions: readonly string[]
}

export interface Widget {
  id: string
  /** dashboard 이름공간 키 — 편집 목록 · 카드 머리 */
  labelKey: string
  /** 이 중 하나라도 있으면 보인다. 없으면 모두에게 */
  permissions?: readonly string[]
  place: WidgetPlace
  /** "전체 보기" — 없으면 동작을 그리지 않는다 */
  seeAll?: WidgetSeeAll
}

const VACATION_HISTORY: WidgetSeeAll = { path: '/vacation/history', permissions: ['VACATION:READ'] }
const VACATION_APPLICATION: WidgetSeeAll = { path: '/vacation/application', permissions: ['VACATION:REQUEST'] }
const WORK_REPORT: WidgetSeeAll = { path: '/work/report', permissions: ['WORK:READ'] }
const DUES: WidgetSeeAll = { path: '/culture/dues', permissions: ['DUES:READ'] }

// 차례 = 편집 목록 · 처음 모양의 기준 차례(D 표 1 ~ 17)
export const WIDGETS: readonly Widget[] = [
  { id: 'vacation-stats', labelKey: 'widget.vacationStatus', permissions: ['VACATION:READ'], place: 'wide', seeAll: VACATION_HISTORY },
  { id: 'today-work-status', labelKey: 'widget.workHistoryStatus', permissions: ['WORK:READ'], place: 'narrow', seeAll: WORK_REPORT },
  { id: 'month-stats', labelKey: 'widget.monthlyVacationStats', permissions: ['VACATION:READ'], place: 'wide', seeAll: VACATION_HISTORY },
  { id: 'type-stats', labelKey: 'widget.vacationTypeStats', permissions: ['VACATION:READ'], place: 'narrow', seeAll: VACATION_HISTORY },
  { id: 'system-check', labelKey: 'widget.systemDailyCheck', place: 'wide' },
  { id: 'profile', labelKey: 'widget.myInfo', permissions: ['USER:READ'], place: 'narrow' },
  { id: 'schedule', labelKey: 'widget.workSchedule', permissions: ['USER:READ'], place: 'wide', seeAll: { path: '/work/schedule', permissions: ['WORK:READ'] } },
  { id: 'vacation-application', labelKey: 'widget.vacationApplicationHistory', permissions: ['VACATION:REQUEST'], place: 'wide', seeAll: VACATION_APPLICATION },
  { id: 'vacation-request-stats', labelKey: 'widget.vacationApplicationStats', permissions: ['VACATION:APPROVE'], place: 'wide', seeAll: VACATION_APPLICATION },
  { id: 'vacation-history', labelKey: 'widget.vacationHistory', permissions: ['VACATION:READ'], place: 'wide', seeAll: VACATION_HISTORY },
  { id: 'dues', labelKey: 'widget.duesHistory', permissions: ['DUES:READ'], place: 'wide', seeAll: DUES },
  { id: 'total-dues', labelKey: 'widget.duesStatus', permissions: ['DUES:READ'], place: 'wide', seeAll: DUES },
  { id: 'user-birth-dues', labelKey: 'widget.monthlyBirthdayDeposit', permissions: ['DUES:READ'], place: 'wide', seeAll: DUES },
  { id: 'user-company-stats', labelKey: 'widget.companyUserStats', permissions: ['COMPANY:MANAGE'], place: 'narrow', seeAll: { path: '/admin/users/management', permissions: ['USER:MANAGE'] } },
  { id: 'missing-work-history', labelKey: 'widget.monthlyWorkAlert', permissions: ['WORK:READ'], place: 'narrow', seeAll: WORK_REPORT },
  { id: 'user-vacation-stats', labelKey: 'widget.allUserVacationStatus', permissions: ['VACATION:MANAGE'], place: 'wide' },
  { id: 'department-chart', labelKey: 'widget.departmentChart', permissions: ['COMPANY:READ'], place: 'wide', seeAll: { path: '/admin/company', permissions: ['COMPANY:MANAGE'] } },
]

export const WIDGET_IDS: readonly string[] = WIDGETS.map((w) => w.id)

export const widgetOf = (id: string): Widget | undefined => WIDGETS.find((w) => w.id === id)

/** 처음 모양 — 저장값이 없을 때 · [처음 모양으로] 의 차례(왼쪽 휴가 현황 · 월별 · 시스템 체크, 오른쪽 업무이력 · 유형별 · 내 정보) */
export const DEFAULT_HOME_WIDGETS: readonly string[] = [
  'vacation-stats',
  'today-work-status',
  'month-stats',
  'type-stats',
  'system-check',
  'profile',
]

/** 이 사람이 볼 수 있는 위젯인가 — 권한이 하나라도 있으면(없는 위젯은 모두에게) */
export const canSeeWidget = (widget: Widget, hasAnyPermission: (permissions: string[]) => boolean): boolean =>
  !widget.permissions || widget.permissions.length === 0 || hasAnyPermission([...widget.permissions])
