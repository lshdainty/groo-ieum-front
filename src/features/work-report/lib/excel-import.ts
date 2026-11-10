import type { GetUsersResp } from '@/entities/user'
import type { CreateWorkHistoryReq, WorkCodeResp, WorkGroupWithParts } from '@/entities/work'

export type ImportErrorKey = 'xDateInvalid' | 'xUserMissing' | 'xOnlyMine' | 'xGroupInvalid' | 'xPartInvalid' | 'xDivisionInvalid' | 'xHoursInvalid'

/** 틀린 칸을 그 자리에서 고르는 대상 — 일자 · 시간 · 내용은 고르는 값이 아니라 읽기 전용 */
export type ImportFixField = 'manager' | 'group' | 'part' | 'division'

export interface ImportRow {
  id: number
  date: string
  userName: string
  managerId: string
  groupName: string
  partName: string
  divisionName: string
  hours: string
  content: string
  groupCode?: string
  partCode?: string
  divisionCode?: string
  /** 고르기 칸이 된 칸 — 한 번 틀렸던 칸(고른 뒤에도 그대로 고르기 칸) */
  fixable: ImportFixField[]
  /** 고칠 것 — 글 키(work 이름공간 `rep.`) */
  errors: ImportErrorKey[]
}

export interface ImportContext {
  groups: WorkGroupWithParts[]
  divisions: WorkCodeResp[]
  users: GetUsersResp[]
  me: { id: string; name: string }
  /** `WORK:MANAGE` — 있으면 누구 이름이든, 없으면 담당자는 나로 고정되고 남의 이름은 오류 */
  canManage: boolean
  /** 머리 열 이름(화면 언어) — 첫 줄이 이것이면 머리 줄이라 건너뛴다(예시 파일을 머리째 붙여 넣은 경우) */
  header?: string[]
}

/** 파일의 한 줄 — 일자 · 담당자 · 업무 분류 · 업무 파트 · 업무 구분 · 소요 시간 · 내용(이 차례) */
export const parseImportRows = (text: string, delimiter: string, ctx: ImportContext): ImportRow[] => {
  let lines = text.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.trim() !== '')
  const head = ctx.header
  if (head && lines.length > 0) {
    const first = lines[0].split(delimiter).map((x) => x.trim().toLowerCase())
    if (head.slice(0, 3).every((h, i) => first[i] === h.toLowerCase())) lines = lines.slice(1)
  }
  return lines.map((line, index) => {
    const c = line.split(delimiter).map((x) => x.trim())
    const userName = c[1] ?? ''
    return validateRow(
      {
        id: index,
        date: c[0] ?? '',
        userName: ctx.canManage ? userName : userName || ctx.me.name,
        managerId: '',
        groupName: c[2] ?? '',
        partName: c[3] ?? '',
        divisionName: c[4] ?? '',
        hours: c[5] ?? '',
        content: c[6] ?? '',
        fixable: [],
      },
      ctx,
      userName,
    )
  })
}

/**
 * 한 줄을 다시 검증한다 — 이름으로 담당자 · 분류 · 파트 · 구분을 찾고 오류 목록과 코드를 새로 만든다.
 * `fixable`(고르기 칸으로 바꿀 칸)은 한 번 걸린 칸이 계속 남는다 — 고른 뒤에도 칸이 글로 되돌아가지 않게.
 * 담당자 칸은 `WORK:MANAGE` 일 때만(없으면 나로 고정이라 고를 수 없다), 파트 칸은 분류가 맞을 때만(분류가 없으면 파트를 못 찾는 게 당연하다) 건다.
 */
export const validateRow = (row: Omit<ImportRow, 'errors' | 'groupCode' | 'partCode' | 'divisionCode'>, ctx: ImportContext, rawUserName: string = row.userName): ImportRow => {
  const errors: ImportErrorKey[] = []
  const fixable = new Set<ImportFixField>(row.fixable)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) errors.push('xDateInvalid')

  // 담당자 — 관리 권한이 있으면 이름으로 찾고, 없으면 나로 고정한다(남의 이름은 올리기 전에 오류 — 서버는 한 줄이라도 남의 이름이면 전체를 거절한다)
  let managerId = ''
  if (ctx.canManage) {
    managerId = row.managerId && ctx.users.some((u) => u.user_id === row.managerId && u.user_name === row.userName) ? row.managerId : (ctx.users.find((u) => u.user_name === row.userName)?.user_id ?? '')
    if (!managerId) {
      errors.push('xUserMissing')
      fixable.add('manager')
    }
  } else if (rawUserName === '' || rawUserName === ctx.me.name) {
    managerId = ctx.me.id
  } else {
    errors.push('xOnlyMine')
  }

  const group = ctx.groups.find((g) => g.work_code_name === row.groupName)
  if (!group) {
    errors.push('xGroupInvalid')
    fixable.add('group')
  }
  const part = group?.labels.flatMap((l) => l.parts).find((p) => p.work_code_name === row.partName)
  if (!part) {
    errors.push('xPartInvalid')
    if (group) fixable.add('part')
  }
  const division = ctx.divisions.find((d) => d.work_code_name === row.divisionName)
  if (!division) {
    errors.push('xDivisionInvalid')
    fixable.add('division')
  }

  if (row.hours !== '') {
    const n = Number(row.hours)
    if (!Number.isFinite(n) || n < 0 || n > 24) errors.push('xHoursInvalid')
  }

  return { ...row, managerId, groupCode: group?.work_code, partCode: part?.work_code, divisionCode: division?.work_code, fixable: [...fixable], errors }
}

export interface ImportFix {
  managerId?: string
  groupCode?: string
  partCode?: string
  divisionCode?: string
}

/** 고르기 칸에서 고른 값을 줄에 넣고 그 줄을 바로 다시 검증한다 — 일자 · 시간 · 내용은 건드리지 않는다 */
export const fixRow = (row: ImportRow, fix: ImportFix, ctx: ImportContext): ImportRow => {
  const next = { ...row }
  if (fix.managerId !== undefined) {
    next.managerId = fix.managerId
    next.userName = ctx.users.find((u) => u.user_id === fix.managerId)?.user_name ?? next.userName
  }
  if (fix.groupCode !== undefined) next.groupName = ctx.groups.find((g) => g.work_code === fix.groupCode)?.work_code_name ?? next.groupName
  if (fix.partCode !== undefined) {
    const parts = ctx.groups.find((g) => g.work_code_name === next.groupName)?.labels.flatMap((l) => l.parts) ?? []
    next.partName = parts.find((p) => p.work_code === fix.partCode)?.work_code_name ?? next.partName
  }
  if (fix.divisionCode !== undefined) next.divisionName = ctx.divisions.find((d) => d.work_code === fix.divisionCode)?.work_code_name ?? next.divisionName
  return validateRow(next, ctx)
}

/** 서버로 보낼 줄 — 오류가 없는 줄만 부른다 */
export const importPayload = (rows: ImportRow[]): CreateWorkHistoryReq[] =>
  rows.map((r) => ({
    work_date: r.date,
    work_user_id: r.managerId,
    work_group_code: r.groupCode!,
    work_part_code: r.partCode!,
    work_class_code: r.divisionCode!,
    work_hour: Number(r.hours) || 0,
    work_content: r.content,
  }))
