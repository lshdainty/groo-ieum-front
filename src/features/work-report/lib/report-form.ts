import dayjs from 'dayjs'

import type { WorkDraft } from '../model/types'

export interface DraftErrors {
  date: boolean
  group: boolean
  part: boolean
  division: boolean
}

export const draftErrors = (d: WorkDraft): DraftErrors => ({
  date: !d.date,
  group: !d.groupCode,
  part: !d.partCode,
  division: !d.divisionCode,
})

export const hasDraftErrors = (e: DraftErrors): boolean => e.date || e.group || e.part || e.division

/** 새 줄의 처음 값 — 오늘 · 나 */
export const newDraft = (me: { id: string; name: string }): WorkDraft => ({
  date: dayjs().format('YYYY-MM-DD'),
  managerId: me.id,
  managerName: me.name,
  groupCode: '',
  partCode: '',
  divisionCode: '',
  hours: 0,
  content: '',
})

/** 이 줄을 고치는 편집 값 */
export const draftOf = (row: { id: number; date: string; managerId: string; managerName: string; group?: { work_code: string }; part?: { work_code: string }; division?: { work_code: string }; hours: number; content: string }): WorkDraft => ({
  id: row.id,
  date: row.date,
  managerId: row.managerId,
  managerName: row.managerName,
  groupCode: row.group?.work_code ?? '',
  partCode: row.part?.work_code ?? '',
  divisionCode: row.division?.work_code ?? '',
  hours: Number(row.hours) || 0,
  content: row.content,
})

export const draftChanged = (a: WorkDraft, b: WorkDraft): boolean =>
  a.date !== b.date ||
  a.groupCode !== b.groupCode ||
  a.partCode !== b.partCode ||
  a.divisionCode !== b.divisionCode ||
  a.hours !== b.hours ||
  a.content.trim() !== b.content.trim()
