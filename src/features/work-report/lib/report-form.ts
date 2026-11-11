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

/** 소요 시간 상한 — 지금 그대로(0 ~ 24) */
export const MAX_HOURS = 24
/** 소요 시간 한 단계 — 30분(25-4b, 사용자 결정 11-10). 서버 값은 4.5 같은 숫자 그대로 */
export const HOURS_STEP = 0.5

/**
 * [+] [−] 를 누를 때 30분 칸에 맞춘다(11-11 결정 5A) — 엑셀 · 옛 화면의 4.3 은 [+] 4.5 · [−] 4.0 으로 한 번에 들어간다.
 * `next` 는 부품이 계산한 값(현재 ± 0.5), 칸 위의 값이면 그대로 받는다. 누르지 않으면 값은 그대로 저장된다. 최소 0 · 최대 MAX_HOURS 는 부품이 이미 지킨다.
 */
export const snapHours = (current: number, next: number): number => {
  const slots = current / HOURS_STEP
  if (Math.abs(slots - Math.round(slots)) < 1e-9) return next
  const snapped = (next > current ? Math.ceil(slots) : Math.floor(slots)) * HOURS_STEP
  return Math.min(Math.max(snapped, 0), MAX_HOURS)
}
