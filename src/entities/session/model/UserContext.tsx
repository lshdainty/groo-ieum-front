import { useLoginCheckQuery } from '@/entities/session/api/sessionQueries'
import type { GetLoginCheck } from '@/entities/session/model/types'
import { sessionApi } from '@/entities/session/api/sessionApi'
import { isAxiosError } from 'axios'
import { createContext, ReactNode, useContext, useState } from 'react'
import { useLocation } from 'react-router-dom'

// 로그인 체크를 건너뛸 경로
const AUTH_PATHS = ['/login', '/logout', '/signup', '/auth/callback']

/**
 * 세션 확인 상태
 *  - checking: 확인 중 — 앱 틀 밖 기다림 화면(1초 안에는 아무것도 그리지 않는다)
 *  - authenticated / unauthenticated: 확인이 끝났다(401 · 로그인 정보 없음 = 로그인 안 됨)
 *  - error: 확인하지 못했다(5xx · 네트워크 · 시간 초과) — 로그인 안 됨이 아니므로 로그인으로 보내지 않고 다시 시도하게 한다
 */
export type SessionStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'error'

// Context 타입 정의
interface UserContextType {
  loginUser: GetLoginCheck | null
  isLoading: boolean
  sessionStatus: SessionStatus
  /** 세션 확인을 다시 한다(확인 실패 화면의 [다시 시도]) */
  retrySession: () => Promise<void>
  /** 다시 확인하는 중 */
  isRetrying: boolean
  isAuthenticated: boolean
  setLoginUser: (user: GetLoginCheck | null) => void
  clearLoginUser: () => void
  refreshUser: () => Promise<void>
  logout: () => void
}

// Context 생성 (초기값 undefined)
const UserContext = createContext<UserContextType | undefined>(undefined)

// Provider Props
interface UserProviderProps {
  children: ReactNode
}

// UserProvider 컴포넌트
export function UserProvider({ children }: UserProviderProps) {
  // 손으로 바꾼 로그인 정보(로그아웃 · 설정) — 더 새로 받은 세션 확인 결과가 이긴다
  const [override, setOverride] = useState<{ user: GetLoginCheck | null; at: number } | null>(null)
  // 확인 실패 화면의 [다시 시도] 를 누른 동안 — 쿼리는 이때 pending 으로 돌아가지만 실패 화면을 그대로 두고 단추만 기다린다
  const [retrying, setRetrying] = useState(false)
  const location = useLocation()

  // 현재 경로가 인증 페이지인지 확인
  const isAuthPage = AUTH_PATHS.includes(location.pathname)

  // 인증 페이지가 아닐 때 로그인 체크 쿼리 실행 (HttpOnly 쿠키 기반)
  const shouldCheckLogin = !isAuthPage
  const { data, error, isPending, dataUpdatedAt, refetch } = useLoginCheckQuery(shouldCheckLogin)

  // 로그인 정보는 쿼리 결과에서 바로 꺼낸다 — 상태 + effect 로 복사하면 확인이 끝난 첫 렌더에 아직 null 이라
  // 주소를 직접 연 화면이 /login 을 거쳐 늘 /dashboard 로 떨어졌다(I-22-2 ⓓ)
  const loginUser: GetLoginCheck | null = override && override.at >= dataUpdatedAt ? override.user : (data ?? null)

  const authenticated = !!loginUser && loginUser.is_login === 'Y'
  const overridden = !!override && override.at >= dataUpdatedAt
  let sessionStatus: SessionStatus
  if (!shouldCheckLogin || overridden) {
    sessionStatus = authenticated ? 'authenticated' : 'unauthenticated'
  } else if (data) {
    sessionStatus = authenticated ? 'authenticated' : 'unauthenticated'
  } else if (isPending) {
    sessionStatus = retrying ? 'error' : 'checking'
  } else if (isAxiosError(error) && error.response?.status === 401) {
    sessionStatus = 'unauthenticated'
  } else {
    sessionStatus = 'error'
  }

  // 로그인 유저 설정 함수
  const setLoginUser = (user: GetLoginCheck | null) => {
    setOverride({ user, at: Date.now() })
  }

  // 로그인 유저 초기화 함수
  const clearLoginUser = () => {
    setOverride({ user: null, at: Date.now() })
  }

  // 로그아웃 함수 (HttpOnly 쿠키 삭제)
  const logout = async () => {
    try {
      await sessionApi.logout()
    } catch (e) {
      // 로그아웃 실패해도 로그인 페이지로 이동
    }
    setOverride({ user: null, at: Date.now() })
    window.location.href = '/login'
  }

  // 유저 정보 새로고침 (프로필 수정 후 등)
  const refreshUser = async () => {
    try {
      const result = await refetch()
      // 새로 받은 값이 오면 쿼리 결과가 이긴다 — 못 받았으면 로그인 안 됨으로 둔다
      if (!result.data) setOverride({ user: null, at: Date.now() })
    } catch {
      setOverride({ user: null, at: Date.now() })
    }
  }

  const retrySession = async () => {
    setRetrying(true)
    try {
      await refetch()
    } finally {
      setRetrying(false)
    }
  }

  const value: UserContextType = {
    loginUser,
    isLoading: sessionStatus === 'checking',
    sessionStatus,
    retrySession,
    isRetrying: retrying,
    isAuthenticated: authenticated,
    setLoginUser,
    clearLoginUser,
    refreshUser,
    logout,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// Custom Hook - Context 사용을 위한 Hook
export function useUser() {
  const context = useContext(UserContext)

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}
