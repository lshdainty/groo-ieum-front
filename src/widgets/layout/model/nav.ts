import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Briefcase,
  Building2,
  CalendarCog,
  CalendarDays,
  ChartGantt,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  FolderKanban,
  HeartHandshake,
  LayoutDashboard,
  ListTree,
  Megaphone,
  MessageSquarePlus,
  Network,
  NotebookPen,
  Scale,
  ShieldCheck,
  ShieldEllipsis,
  TreePalm,
  UserRoundCog,
} from 'lucide-react'

import { flattenRoutes, routesConfig, type RouteConfig } from '@/app/config/routes.config'

/*
 * 메뉴 모델 — 사이드바 · 폰 옆 패널이 함께 읽는다(I-22 B 13 ~ 16, 그림 `IA['B']` · `filter_ia()`).
 * 라우트(routes.config.ts) · 주소 · PermissionGuard 는 바꾸지 않는다 — 메뉴는 메뉴대로 두고 라우트 id 로 잇는다.
 * 경로 · 필요한 권한은 라우트에서 읽는다: 보이는가 = 그 라우트와 조상 라우트의 requiredPermissions 를 모두 가진다
 * (PermissionGuard 를 중첩한 지금 판정과 같다 — 보이는 항목을 누르면 늘 들어가진다).
 */

export interface NavLeaf {
  kind: 'leaf'
  /** 라우트 id */
  id: string
  /** sidebar 이름공간 키 — 메뉴 이름 = 화면 제목 = 문서 제목 = 폰 상단 바 제목 */
  labelKey: string
  icon: LucideIcon
  path: string
}

export interface NavParent {
  kind: 'parent'
  id: string
  labelKey: string
  icon: LucideIcon
  /** 하위 — 아이콘 없이 이름만(ds SideNavigationSubItem) */
  children: NavLeaf[]
}

export type NavItem = NavLeaf | NavParent

export interface NavGroup {
  id: 'main' | 'manage'
  /** 묶음 이름 키(sidebar) — 묶음이 둘 이상 남을 때만 쓴다 */
  labelKey?: string
  items: NavItem[]
}

// ── 라우트 표 ─────────────────────────────────────────────────
interface RouteInfo {
  route: RouteConfig
  /** 자기 + 조상의 requiredPermissions 묶음 — 묶음마다 하나라도 있으면 통과(PermissionGuard 기본) */
  chain: string[][]
}

const routeTable = (() => {
  const table = new Map<string, RouteInfo>()
  const walk = (routes: RouteConfig[], inherited: string[][]) => {
    for (const route of routes) {
      const chain = route.requiredPermissions ? [...inherited, route.requiredPermissions] : inherited
      table.set(route.id, { route, chain })
      if (route.children) walk(route.children, chain)
    }
  }
  walk(flattenRoutes(routesConfig), [])
  return table
})()

const routeOf = (id: string): RouteConfig => {
  const info = routeTable.get(id)
  if (!info) throw new Error(`메뉴 모델이 모르는 라우트 id: ${id}`)
  return info.route
}

// ── 메뉴 구조 — 그림 IA['B'] ──────────────────────────────────
const leaf = (id: string, icon: LucideIcon): NavLeaf => {
  const route = routeOf(id)
  if (!route.nameKey) throw new Error(`메뉴 이름 키가 없는 라우트: ${id}`)
  return { kind: 'leaf', id, labelKey: route.nameKey, icon, path: route.path }
}
const parent = (id: string, labelKey: string, icon: LucideIcon, children: NavLeaf[]): NavParent => ({
  kind: 'parent',
  id,
  labelKey,
  icon,
  children,
})

const MAIN: NavItem[] = [
  leaf('dashboard', LayoutDashboard),
  leaf('calendar', CalendarDays),
  leaf('notice', Bell),
  parent('vacation', 'menu.vacation', TreePalm, [
    leaf('vacation-history', ChartNoAxesCombined),
    leaf('vacation-application', MessageSquarePlus),
    leaf('admin-vacation-approval', ClipboardCheck),
  ]),
  parent('work', 'menu.work', Briefcase, [leaf('work-report', NotebookPen), leaf('work-schedule', ChartGantt)]),
  parent('culture', 'menu.culture', HeartHandshake, [
    leaf('culture-dues', CircleDollarSign),
    leaf('culture-regulation', Scale),
  ]),
]

const MANAGE: NavItem[] = [
  leaf('admin-company', Building2),
  leaf('admin-users-management', UserRoundCog),
  leaf('users-department', Network),
  leaf('admin-vacation-policy', ShieldEllipsis),
  leaf('admin-vacation-plan', FolderKanban),
  leaf('admin-authority', ShieldCheck),
  leaf('admin-holiday', CalendarCog),
  leaf('admin-work', ListTree),
  leaf('admin-notice', Megaphone),
]

/** 권한을 가리지 않은 전체 메뉴(화면 제목 찾기 · 하네스 점검용) */
export const FULL_NAV: NavGroup[] = [
  { id: 'main', items: MAIN },
  { id: 'manage', labelKey: 'group.manage', items: MANAGE },
]

const canSee = (id: string, hasAnyPermission: (p: string[]) => boolean): boolean =>
  (routeTable.get(id)?.chain ?? []).every((need) => hasAnyPermission(need))

/**
 * 이 사람에게 보이는 메뉴 — 안 보이는 항목을 빼고, 하위가 하나만 남은 부모는 그 하위를 단독 항목으로(하위 하나짜리 나무는
 * 만들지 않는다 — side-navigation.md), 빈 묶음은 빼고, 묶음이 하나만 남으면 묶음 이름을 두지 않는다.
 */
export function buildNav(hasAnyPermission: (permissions: string[]) => boolean): NavGroup[] {
  const groups: NavGroup[] = []
  for (const group of FULL_NAV) {
    const items: NavItem[] = []
    for (const item of group.items) {
      if (item.kind === 'leaf') {
        if (canSee(item.id, hasAnyPermission)) items.push(item)
        continue
      }
      const kids = item.children.filter((k) => canSee(k.id, hasAnyPermission))
      if (kids.length >= 2) items.push({ ...item, children: kids })
      else if (kids.length === 1) items.push(kids[0])
    }
    if (items.length > 0) groups.push({ ...group, items })
  }
  if (groups.length === 1) groups[0] = { ...groups[0], labelKey: undefined }
  return groups
}

/** 보이는 화면(링크)의 수 — 하네스가 역할마다 9 · 10 · 19 를 센다 */
export const navLeaves = (groups: NavGroup[]): NavLeaf[] =>
  groups.flatMap((g) => g.items.flatMap((i) => (i.kind === 'leaf' ? [i] : i.children)))

/** 지금 항목 — 그 라우트 경로로 시작하는 주소(상세 주소가 생겨도 부모 항목이 켜진다) */
export const isPathActive = (pathname: string, path: string): boolean =>
  pathname === path || pathname.startsWith(`${path}/`)

const ALL_LEAVES = navLeaves(FULL_NAV)

/** 이 주소의 화면 이름 키(sidebar) — 메뉴에 없는 주소(404)는 undefined */
export function screenTitleKeyOf(pathname: string): string | undefined {
  return ALL_LEAVES.find((l) => isPathActive(pathname, l.path))?.labelKey
}
