import { createContext, ReactNode, useContext } from 'react'
import { useUser } from '@/entities/session/model/UserContext'

// 권한 타입 정의
export type Permission = string

interface PermissionContextType {
  permissions: Permission[]
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  isLoading: boolean
}

const EMPTY: Permission[] = []

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

interface PermissionProviderProps {
  children: ReactNode
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { loginUser, isLoading: isUserLoading } = useUser()
  // 권한은 로그인 정보에서 바로 꺼낸다 — 상태 + effect 로 복사하면 로그인 정보가 생긴 첫 렌더에 아직 비어 있어
  // 주소를 직접 연 화면의 PermissionGuard 가 "/" 로 내보냈다(I-22-2 ⓓ)
  const permissions: Permission[] = loginUser?.permissions ?? EMPTY

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission)
  }

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(perm => permissions.includes(perm))
  }

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(perm => permissions.includes(perm))
  }

  const value = {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading: isUserLoading
  }

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermission() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider')
  }
  return context
}
