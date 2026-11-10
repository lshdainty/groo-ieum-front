import dayjs from 'dayjs'

import type { WorkGroupWithParts, WorkCodeResp, WorkHistorySearchCondition } from '@/entities/work'

export interface ReportFilters {
  /** "YYYY-MM-DD" */
  startDate: string
  endDate: string
  /** 담당자 아이디 — 빈 글이면 모든 사람 */
  userId: string
  groupCode: string
  partCode: string
  divisionCode: string
  sort: 'latest' | 'oldest'
}

export const ALL = 'all'

/** 처음 값 — 최근 한 달 · 모든 사람 · 전체 · 최신순. 기간은 걸린 조건으로 세지 않는다 */
export const initialFilters = (): ReportFilters => ({
  startDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  userId: '',
  groupCode: ALL,
  partCode: ALL,
  divisionCode: ALL,
  sort: 'latest',
})

export const isPeriodDefault = (f: ReportFilters, base: ReportFilters): boolean => f.startDate === base.startDate && f.endDate === base.endDate

/** 처음 값과 다른 조건이 하나라도 있는가 — ↺ 칩을 부른다 */
export const isFiltered = (f: ReportFilters, base: ReportFilters): boolean =>
  !isPeriodDefault(f, base) || f.userId !== '' || f.groupCode !== ALL || f.partCode !== ALL || f.divisionCode !== ALL || f.sort !== 'latest'

/** 서버 질의 조건 — 코드를 번호로 바꾼다(분류 목록을 아직 못 받았으면 그 조건은 걸지 않는다 — 칩이 고를 수 없는 때라 값도 처음 값이다) */
export const searchConditionOf = (f: ReportFilters, groups: WorkGroupWithParts[] | undefined, divisions: WorkCodeResp[] | undefined): WorkHistorySearchCondition => ({
  startDate: f.startDate || undefined,
  endDate: f.endDate || undefined,
  userId: f.userId || undefined,
  groupSeq: f.groupCode !== ALL ? groups?.find((g) => g.work_code === f.groupCode)?.work_code_id : undefined,
  partSeq: f.partCode !== ALL ? groups?.flatMap((g) => g.labels.flatMap((l) => l.parts)).find((p) => p.work_code === f.partCode)?.work_code_id : undefined,
  divisionSeq: f.divisionCode !== ALL ? divisions?.find((d) => d.work_code === f.divisionCode)?.work_code_id : undefined,
  sortType: f.sort === 'latest' ? 'LATEST' : 'OLDEST',
})
