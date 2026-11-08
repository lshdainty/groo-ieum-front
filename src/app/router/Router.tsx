import PermissionGuard from '@/shared/ui/require-permission/PermissionGuard'
import Loading from '@/shared/ui/loading/Loading'
import { useUser } from '@/entities/session'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

import { Layout, NotFoundScreen } from '@/widgets/layout'
import NotFound from '@/shared/ui/not-found/NotFound'
import { AuthCallbackPage } from '@/pages/auth-callback'
import { LoginPage } from '@/pages/login'
import { PasswordChangePage } from '@/pages/password-change'
import { SignUpPage } from '@/pages/signup'

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
  const { isLoading, isAuthenticated, loginUser } = useUser()

  // 초기 세션 확인 중
  if (isLoading) {
    return <Loading />
  }

  // 비밀번호 변경 필요 여부
  const requiresPasswordChange = loginUser?.password_change_required === 'Y'

  // 틀을 그리는 사람 — 로그인했고 비밀번호 변경이 필요 없는 사람
  const framed = isAuthenticated && !requiresPasswordChange

  const flattenedRoutes = flattenRoutes(routesConfig)
  const routeElements = generateRouteElements(flattenedRoutes)

  return (
    <Routes>
      {/* 로그인 - 이미 인증된 경우 대시보드로 리다이렉트 */}
      <Route
        path='/login'
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage/>}
      />
      {/* SSO 인증 콜백 */}
      <Route
        path='/auth/callback'
        element={<AuthCallbackPage />}
      />
      {/* 회원가입 - SSO에서 처리하므로 리다이렉트 */}
      <Route
        path='/signup'
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignUpPage/>}
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
        !isAuthenticated ? <Navigate to="/login" replace /> :
        requiresPasswordChange ? <Navigate to="/password-change" replace /> :
        <Layout/>
      }>
        {routeElements}
        {/* 로그인한 사람의 404 는 틀 안에서(H-A14 A) */}
        {framed && <Route path='*' element={<NotFoundScreen/>} />}
      </Route>

      {/* 로그인 전 404 — 흰 면(22-2 가 옮긴다) */}
      {!framed && <Route path='/*' element={<NotFound/>} />}
    </Routes>
  )
}
