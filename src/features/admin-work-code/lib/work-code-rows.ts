import type { WorkCodeResp, WorkGroupWithParts } from '@/entities/work'

/** 표 · 목록의 한 줄 — level 은 들임 단계(묶음 아래 항목은 단계마다 20), canAddChild 는 ⋮ 의 "하위 코드 추가" */
export interface WorkCodeRow {
  code: WorkCodeResp
  level: 0 | 1 | 2
  canAddChild: boolean
}

/**
 * 업무 파트 줄 — 그룹 → 라벨 → 파트 차례로 펼친다. "하위 코드 추가" 는 지금 화면 그대로 라벨 줄(level 1)에만 있다
 * (옛 줄마다 있던 + 아이콘 단추의 자리 — 그룹 줄 · 파트 줄에는 없었다).
 */
export const partRowsOf = (groups: WorkGroupWithParts[]): WorkCodeRow[] =>
  groups.flatMap((group) => [
    { code: group, level: 0 as const, canAddChild: false },
    ...(group.labels ?? []).flatMap((label) => [
      { code: label as WorkCodeResp, level: 1 as const, canAddChild: true },
      ...(label.parts ?? []).map((part) => ({ code: part, level: 2 as const, canAddChild: false })),
    ]),
  ])

/** 업무 구분 줄 — 평평한 한 단계 */
export const divisionRowsOf = (divisions: WorkCodeResp[]): WorkCodeRow[] =>
  divisions.map((code) => ({ code, level: 0 as const, canAddChild: false }))

/** 종류 글 키 — LABEL 은 묶음, 그 밖(OPTION)은 항목 */
export const workCodeTypeKey = (codeType: string): string =>
  codeType === 'LABEL' ? 'adminWorkCode.typeLabel' : 'adminWorkCode.typeOption'

export interface WorkCodeFormValues {
  code: string
  name: string
  order: string
}

export const emptyWorkCodeForm = (): WorkCodeFormValues => ({ code: '', name: '', order: '0' })

export const workCodeFormOf = (row: WorkCodeResp): WorkCodeFormValues => ({
  code: row.work_code,
  name: row.work_code_name,
  order: String(row.order_seq ?? 0),
})

/** 순서 칸 — 비우면 0, 정수만(지금 칸 · 검증 그대로 숫자) */
export const parseOrder = (value: string): number | null => {
  const text = value.trim()
  if (text === '') return 0
  return /^-?\d+$/.test(text) ? Number(text) : null
}

export const workCodeFormErrors = (v: WorkCodeFormValues): { code?: true; name?: true; order?: true } => {
  const errors: { code?: true; name?: true; order?: true } = {}
  if (!v.code.trim()) errors.code = true
  if (!v.name.trim()) errors.name = true
  if (parseOrder(v.order) === null) errors.order = true
  return errors
}

export const workCodeFormChanged = (a: WorkCodeFormValues, b: WorkCodeFormValues): boolean =>
  a.code.trim() !== b.code.trim() || a.name.trim() !== b.name.trim() || parseOrder(a.order) !== parseOrder(b.order)
