// Session Entity - Public API

// Types
export type {
  PermissionInfo,
  RoleInfo,
  GetLoginCheck,
  TokenExchangeRequest,
  TokenExchangeUserInfo,
  TokenExchangeResponse,
} from '@/entities/session/model/types'

// API
export { sessionApi } from '@/entities/session/api/sessionApi'

// Queries
export { authKeys, useLoginCheckQuery } from '@/entities/session/api/sessionQueries'

// Contexts
export { UserProvider, useUser } from '@/entities/session/model/UserContext'
export { useCompanyToday } from '@/entities/session/model/company-today'
export { PermissionProvider, usePermission } from '@/entities/session/model/PermissionContext'
export type { Permission } from '@/entities/session/model/PermissionContext'
