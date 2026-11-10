import type { GetUsersResp } from '@/entities/user'
import type { CreateWorkHistoryReq, WorkCodeResp, WorkGroupWithParts } from '@/entities/work'

export type ImportErrorKey = 'xDateInvalid' | 'xUserMissing' | 'xOnlyMine' | 'xGroupInvalid' | 'xPartInvalid' | 'xDivisionInvalid' | 'xHoursInvalid'

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
    const date = c[0] ?? ''
    const userName = c[1] ?? ''
    const groupName = c[2] ?? ''
    const partName = c[3] ?? ''
    const divisionName = c[4] ?? ''
    const hours = c[5] ?? ''
    const content = c[6] ?? ''
    const errors: ImportErrorKey[] = []

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('xDateInvalid')

    // 담당자 — 관리 권한이 있으면 이름으로 찾고, 없으면 나로 고정한다(남의 이름은 올리기 전에 오류 — 서버는 한 줄이라도 남의 이름이면 전체를 거절한다)
    let managerId = ''
    if (ctx.canManage) {
      managerId = ctx.users.find((u) => u.user_name === userName)?.user_id ?? ''
      if (!managerId) errors.push('xUserMissing')
    } else if (userName === '' || userName === ctx.me.name) {
      managerId = ctx.me.id
    } else {
      errors.push('xOnlyMine')
    }

    const group = ctx.groups.find((g) => g.work_code_name === groupName)
    if (!group) errors.push('xGroupInvalid')
    const part = group?.labels.flatMap((l) => l.parts).find((p) => p.work_code_name === partName)
    if (!part) errors.push('xPartInvalid')
    const division = ctx.divisions.find((d) => d.work_code_name === divisionName)
    if (!division) errors.push('xDivisionInvalid')

    if (hours !== '') {
      const n = Number(hours)
      if (!Number.isFinite(n) || n < 0 || n > 24) errors.push('xHoursInvalid')
    }

    return {
      id: index,
      date,
      userName: ctx.canManage ? userName : userName || ctx.me.name,
      managerId,
      groupName,
      partName,
      divisionName,
      hours,
      content,
      groupCode: group?.work_code,
      partCode: part?.work_code,
      divisionCode: division?.work_code,
      errors,
    }
  })
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
