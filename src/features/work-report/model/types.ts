import type { WorkCodeResp } from '@/entities/work'

/** 화면이 그리는 업무 기록 한 줄 — 서버 응답을 줄 모양으로 옮긴 것 */
export interface WorkRow {
  id: number
  date: string
  managerId: string
  managerName: string
  group?: WorkCodeResp
  part?: WorkCodeResp
  division?: WorkCodeResp
  hours: number
  content: string
}

/** 편집 중인 값 — 고르는 칸은 코드(code)로 든다. `id` 가 없으면 새 줄 */
export interface WorkDraft {
  id?: number
  date: string
  managerId: string
  managerName: string
  groupCode: string
  partCode: string
  divisionCode: string
  hours: number
  content: string
  /** 복제로 시작한 새 줄 — 저장 알림 글만 다르다 */
  duplicated?: boolean
}
