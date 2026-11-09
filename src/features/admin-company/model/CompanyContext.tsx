import { createContext, useContext, useState, type ReactNode } from 'react'

interface CompanyContextType {
  /** 고른 부서 — 나무 패널과 폰의 두 탭이 함께 쓴다. 없으면 최상위 첫 부서 */
  selectedDeptId: number | null
  setSelectedDeptId: (id: number | null) => void
}

const CompanyContext = createContext<CompanyContextType | null>(null)

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  return <CompanyContext.Provider value={{ selectedDeptId, setSelectedDeptId }}>{children}</CompanyContext.Provider>
}

export const useCompanyContext = () => {
  const context = useContext(CompanyContext)
  if (!context) throw new Error('Cannot find CompanyProvider')
  return context
}
