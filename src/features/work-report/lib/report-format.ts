import type { WorkCodeResp, WorkGroupWithParts, WorkHistoryResp } from '@/entities/work'
import type { WorkRow } from '../model/types'

export const rowOf = (r: WorkHistoryResp): WorkRow => ({
  id: r.work_history_id,
  date: r.work_date,
  managerId: r.work_user_id,
  managerName: r.work_user_name,
  group: r.work_group,
  part: r.work_part,
  division: r.work_class,
  hours: r.work_hour,
  content: r.work_content ?? '',
})

/** 분류 아래 모든 파트(분류 → 이름표 → 파트) */
export const partsOf = (groups: WorkGroupWithParts[], groupCode: string): WorkCodeResp[] =>
  groups.find((g) => g.work_code === groupCode)?.labels.flatMap((l) => l.parts) ?? []

/** "분류 › 파트" */
export const codePath = (row: Pick<WorkRow, 'group' | 'part'>): string =>
  [row.group?.work_code_name, row.part?.work_code_name].filter(Boolean).join(' › ')

/** 줄 이름 — 내용이 있으면 내용, 없으면 "분류 › 파트 › 구분" */
export const rowTitle = (row: WorkRow): string =>
  row.content.trim() || [row.group?.work_code_name, row.part?.work_code_name, row.division?.work_code_name].filter(Boolean).join(' › ')

export interface RowActions {
  duplicate: boolean
  edit: boolean
  remove: boolean
}

/**
 * 줄에서 할 수 있는 일 — 서버 규칙과 같다. 쓰기는 모두 `WORK:WRITE` 가 필요하고(없으면 아무것도 없음),
 * 남의 기록의 수정 · 삭제는 `WORK:MANAGE` 가 있어야 한다(없으면 복제만 — 복제는 나로 만든다).
 */
export const rowActions = (row: WorkRow, { canWrite, canManage, loginId }: { canWrite: boolean; canManage: boolean; loginId: string }): RowActions => {
  if (!canWrite) return { duplicate: false, edit: false, remove: false }
  const mine = row.managerId === loginId
  const full = mine || canManage
  return { duplicate: true, edit: full, remove: full }
}

export const hasRowActions = (a: RowActions): boolean => a.duplicate || a.edit || a.remove

export interface DateGroup {
  date: string
  rows: WorkRow[]
}

/** 날짜 묶음(폰) — 받은 차례를 지킨다(최신순이면 묶음도 최신 날부터) */
export const groupByDate = (rows: WorkRow[]): DateGroup[] => {
  const groups: DateGroup[] = []
  for (const row of rows) {
    const last = groups[groups.length - 1]
    if (last && last.date === row.date) last.rows.push(row)
    else groups.push({ date: row.date, rows: [row] })
  }
  return groups
}
