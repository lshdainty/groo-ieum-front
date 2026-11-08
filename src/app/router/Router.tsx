import PermissionGuard from '@/shared/ui/require-permission/PermissionGuard'
import { useUser } from '@/entities/session'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Layout, NotFoundScreen } from '@/widgets/layout'
import { AuthCallbackPage } from '@/pages/auth-callback'
import { LoginPage } from '@/pages/login'
import { PasswordChangePage } from '@/pages/password-change'
import { OutsideNotFound, ResultScreen, WaitingScreen } from '@/widgets/outside'
import { loginPathFor, safeReturnPath } from '@/shared/lib/return-path'

// 설정 파일에서 import
import { RouteConfig, flattenRoutes, routesConfig } from '@/app/config/routes.config'
import React from 'react'

// 라우트 요소들을 재귀적으로 생성하는 함수
const generateRouteElements = (routes: RouteConfig[], parentPath = ''): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];

  routes.forEach(route => {
    const fullPath = route.path.replace(parentPath, '') || route.path;
    const cleanPath = fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;

    if (route.children && route.children.length > 0) {
      const childElements = generateRouteElements(route.children, route.path);
      const defaultChild = route.children.find(child => child.isDefault);

      elements.push(
        <Route
          key={route.id}
          path={cleanPath}
          element={
            route.requiredPermissions ? (
              <PermissionGuard requiredPermission={route.requiredPermissions} fallback={<Navigate to="/" replace />}>
                <Outlet />
              </PermissionGuard>
            ) : undefined
          }
        >
          {childElements}
          {defaultChild && (
            <Route
              key={`${route.id}-redirect`}
              path=""
              element={<Navigate replace to={defaultChild.path.replace(route.path, '').replace('/', '')} />}
            />
          )}
        </Route>
      )
    } else if (route.component) {
      // 직접 컴포넌트 참조 사용
      const Component = route.component
      elements.push(
        <Route
          key={route.id}
          path={cleanPath}
          element={
            route.requiredPermissions ? (
              <PermissionGuard requiredPermission={route.requiredPermissions} fallback={<Navigate to="/" replace />}>
                <Component />
              </PermissionGuard>
            ) : (
              <Component />
            )
          }
        />
      )
    }
  })

  return elements
}

export function AppRouter() {
  const { sessionStatus, isAuthenticated, loginUser, retrySession, isRetrying } = useUser()
  const { t } = useTranslation('common')
  const location = useLocation()

  // 세션 확인 중 — 앱 틀을 그리지 않는다. 1초 안에는 아무것도 그리지 않고, 1초부터 원, 5초에 "평소보다 오래 걸리고 있어요."(I-22 G 33)
  if (sessionStatus === 'checking') {
    return <WaitingScreen label={t('session.checking')} />
  }

  // 세션을 확인하지 못했다(5xx · 네트워크 · 시간 초과) — 로그인 안 됨이 아니므로 로그인으로 보내지 않고 다시 시도하게 한다
  if (sessionStatus === 'error') {
    return (
      <ResultScreen
        kind='failure'
        title={t('session.failedTitle')}
        description={t('session.failedDescription')}
        action={{ label: t('session.retry'), onClick: retrySession, loading: isRetrying }}
      />
    )
  }

  // 로그인 안 됨이면 /login 으로 — 원래 열려던 주소를 복귀 경로(?next=)로 싣는다(같은 출처 경로만 · return-path.ts)
  const returnTo = `${location.pathname}${location.search}${location.hash}`
  // 이미 로그인한 사람이 /login?next= 로 오면 그 자리로, 없으면 /dashboard
  const afterLogin = safeReturnPath(new URLSearchParams(location.search).get('next')) ?? '/dashboard'

  // 비밀번호 변경 필요 여부
  const requiresPasswordChange = loginUser?.password_change_required === 'Y'

  // 틀을 그리는 사람 — 로그인했고 비밀번호 변경이 필요 없는 사람
  const framed = isAuthenticated && !requiresPasswordChange

  const flattenedRoutes = flattenRoutes(routesConfig)
  const routeElements = generateRouteElements(flattenedRoutes)

  return (
    <Routes>
      {/* 로그인 - 이미 인증된 경우 돌아갈 자리(없으면 대시보드)로 리다이렉트 */}
      <Route
        path='/login'
        element={isAuthenticated ? <Navigate to={afterLogin} replace /> : <LoginPage/>}
      />
      {/* SSO 인증 콜백 */}
      <Route
        path='/auth/callback'
        element={<AuthCallbackPage />}
      />
      {/* 비밀번호 강제 변경 페이지 */}
      <Route
        path='/password-change'
        element={
          !isAuthenticated ? <Navigate to="/login" replace /> :
          !requiresPasswordChange ? <Navigate to="/dashboard" replace /> :
          <PasswordChangePage />
        }
      />

      {/* 보호된 라우트 - 인증 안된 경우 로그인으로, 비밀번호 변경 필요시 비밀번호 변경 페이지로 리다이렉트 */}
      <Route element={
        !isAuthenticated ? <Navigate to={loginPathFor(returnTo)} replace /> :
        requiresPasswordChange ? <Navigate to="/password-change" replace /> :
        <Layout/>
      }>
        {routeElements}
        {/* 로그인한 사람의 404 는 틀 안에서(H-A14 A) */}
        {framed && <Route path='*' element={<NotFoundScreen/>} />}
      </Route>

      {/* 로그인 전 404 — 흰 면. 비밀번호를 바꿔야 하는 사람은 모르는 주소도 /password-change 로 */}
      {!framed && <Route path='/*' element={requiresPasswordChange ? <Navigate to="/password-change" replace /> : <OutsideNotFound/>} />}
    </Routes>
  )
}
