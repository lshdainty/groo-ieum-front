import type { GetCompanyWithDepartment } from '@/entities/company'
import { COLOR_SWATCH_ORDER, type ChartColor } from '@/shared/ds/color-swatch'
import type { TreeNode } from '@/shared/ds/tree-view'

export type Dept = GetCompanyWithDepartment

/** 옛 색 값 → 새 이름(D 20) — `chart-3` 은 이름이 "노란색" 이었으나 칠은 주황이라 고른 사람이 본 색으로 읽는다 */
const LEGACY_COLOR: Record<string, ChartColor> = {
  'chart-1': 'blue',
  'chart-2': 'green',
  'chart-3': 'orange',
  'chart-4': 'violet',
  'chart-5': 'red',
}

/** 저장 값 → 팔레트 색 이름. 팔레트 밖 · 빈 값은 null */
export const deptColorName = (code: string | null | undefined): ChartColor | null => {
  if (!code) return null
  const legacy = LEGACY_COLOR[code]
  if (legacy) return legacy
  return (COLOR_SWATCH_ORDER as readonly string[]).includes(code) ? (code as ChartColor) : null
}

/** 팔레트 밖 hex(가져오기 색) — "지금 색" 칸이 그 색 그대로 보인다 */
export const outsidePaletteHex = (code: string | null | undefined): string | null =>
  code && deptColorName(code) === null && /^#[0-9a-f]{6}$/i.test(code) ? code : null

/** 그릴 때의 색 — 색이 없는 부서는 중립 회색(값은 바꾸지 않는다, D 22) */
export const deptChartColor = (code: string | null | undefined): ChartColor => deptColorName(code) ?? 'gray'

export const chartColorVar = (color: ChartColor): string => `var(--color-chart-${color})`

export const childrenOf = (dept: Dept): Dept[] => dept.children ?? []

export const hasChildren = (dept: Dept): boolean => childrenOf(dept).length > 0

export const flattenDepts = (depts: Dept[]): Dept[] => depts.flatMap((d) => [d, ...flattenDepts(childrenOf(d))])

export const findDept = (depts: Dept[], id: number): Dept | null => flattenDepts(depts).find((d) => d.department_id === id) ?? null

export const countDepts = (depts: Dept[]): number => flattenDepts(depts).length

/** 자기와 그 아래 모든 부서의 id — 상위 부서로 고를 수 없는 것들 */
export const selfAndDescendantIds = (dept: Dept): Set<number> => new Set(flattenDepts([dept]).map((d) => d.department_id))

/** 이 회사 부서가 이미 쓰는 색(옛 값은 새 이름으로 바꿔 센다) — 새 부서의 처음 색을 정한다 */
export const usedColors = (depts: Dept[]): ChartColor[] =>
  flattenDepts(depts)
    .map((d) => deptColorName(d.color_code))
    .filter((c): c is ChartColor => c !== null)

/** Tree View 나무 — id 는 부서 id 글자, 이름은 한글 이름(말줄임 없이 줄바꿈) */
export const toTreeNodes = (depts: Dept[], blocked?: Set<number>): TreeNode[] =>
  depts.map((d) => ({
    id: String(d.department_id),
    label: d.department_name_kr,
    disabled: blocked?.has(d.department_id) || undefined,
    children: hasChildren(d) ? toTreeNodes(childrenOf(d), blocked) : undefined,
  }))

/** 처음 고를 부서 — 없으면 최상위 첫 부서 */
export const firstDeptId = (depts: Dept[]): number | null => depts[0]?.department_id ?? null
