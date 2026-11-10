import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

import { initialFilters, type ReportFilters } from '../lib/report-filter'
import type { WorkDraft } from './types'

interface ReportContextType {
  /** 처음 값(최근 한 달 …) — 기간이 처음 값인지 가르는 기준. 화면이 열린 날 고정 */
  base: ReportFilters
  filters: ReportFilters
  setFilters: (next: ReportFilters) => void
  resetFilters: () => void

  /** 고른 줄 번호 */
  selected: number[]
  setSelected: (next: number[]) => void
  /** 폰 "고르기" 모드 */
  selecting: boolean
  setSelecting: (next: boolean) => void

  /** 편집 중인 값(없으면 편집 중 아님) · 열 때의 값(바뀌었는지 가르는 기준) */
  draft: WorkDraft | null
  draftBase: WorkDraft | null
  setDraft: (next: WorkDraft) => void
  openDraft: (next: WorkDraft) => void
  closeDraft: () => void
}

const ReportContext = createContext<ReportContextType | null>(null)

export const ReportProvider = ({ children }: { children: ReactNode }) => {
  // 처음 값은 화면이 열린 날 고정 — 자정을 넘겨도 기간이 "처음 값" 인지 가르는 기준이 흔들리지 않는다
  const [base] = useState<ReportFilters>(initialFilters)
  const [filters, setFiltersState] = useState<ReportFilters>(base)
  const [selected, setSelected] = useState<number[]>([])
  const [selecting, setSelecting] = useState(false)
  const [draft, setDraftState] = useState<WorkDraft | null>(null)
  const [draftBase, setDraftBase] = useState<WorkDraft | null>(null)

  // 조건을 바꾸면 고른 줄을 푼다(다른 목록이 되므로)
  const setFilters = useCallback((next: ReportFilters) => {
    setFiltersState(next)
    setSelected([])
  }, [])
  const resetFilters = useCallback(() => setFilters(base), [base, setFilters])
  const openDraft = useCallback((next: WorkDraft) => {
    setDraftState(next)
    setDraftBase(next)
  }, [])
  const closeDraft = useCallback(() => {
    setDraftState(null)
    setDraftBase(null)
  }, [])

  return (
    <ReportContext.Provider
      value={{
        base,
        filters,
        setFilters,
        resetFilters,
        selected,
        setSelected,
        selecting,
        setSelecting,
        draft,
        draftBase,
        setDraft: setDraftState,
        openDraft,
        closeDraft,
      }}
    >
      {children}
    </ReportContext.Provider>
  )
}

export const useReportContext = () => {
  const context = useContext(ReportContext)
  if (!context) throw new Error('Cannot find ReportProvider')
  return context
}
