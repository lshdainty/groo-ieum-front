import { createContext, useContext, useState, type ReactNode } from 'react'

interface DepartmentContextType {
  /** 데스크톱에서 고른 부서 — 없으면 최상위 첫 부서. 폰은 주소의 `?dept=` 가 고른 부서다 */
  selectedDeptId: number | null
  setSelectedDeptId: (id: number | null) => void
}

const DepartmentContext = createContext<DepartmentContextType | null>(null)

export const DepartmentProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  return <DepartmentContext.Provider value={{ selectedDeptId, setSelectedDeptId }}>{children}</DepartmentContext.Provider>
}

export const useDepartmentContext = () => {
  const context = useContext(DepartmentContext)
  if (!context) throw new Error('Cannot find DepartmentProvider')
  return context
}
