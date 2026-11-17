import { EnvWatermark } from '@/shared/ui/env-watermark/EnvWatermark'
import { ThemeProvider } from '@/shared/ui/theme/theme-provider'
import { LoadingAnnouncer } from '@/shared/ds/skeleton'
import { SnackbarProvider } from '@/shared/ds/snackbar'
import { TooltipProvider } from '@/shared/ds/tooltip'
import { PermissionProvider } from '@/entities/session'
import { UserProvider } from '@/entities/session'
import { apiClient } from '@/shared/api'
import { QueryProvider, WriteFailureBridge } from '@/app/providers'
import { AppRouter } from '@/app/router'
import { AppHistoryRouter } from '@/app/router/AppHistoryRouter'
import { AppErrorBoundary, RouteErrorBoundary } from '@/app/router/RouteErrorBoundary'
import { lazy, Suspense } from 'react'

// interceptor 초기화를 위해 api import 유지
void apiClient

// ds 카탈로그 — 개발 서버 전용(/dev/ds). 로그인 없이 열리고, 운영 빌드에는 import 자체가 지워진다
const DsCatalogPage = import.meta.env.DEV
  ? lazy(() => import('@/shared/ds/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })))
  : null

export function App() {
  if (DsCatalogPage && window.location.pathname === '/dev/ds') {
    return (
      <Suspense fallback={null}>
        <DsCatalogPage />
      </Suspense>
    )
  }

  return (
    // 라우터 밖(스낵바 자리 등)에서 멈춰도 #root 가 통째로 비지 않게 — 화면 안은 라우터 안의 화면 경계가 먼저 받는다
    <AppErrorBoundary>
      <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
        <EnvWatermark />
        <QueryProvider>
          <SnackbarProvider>
            <TooltipProvider>
              {/* 불러오는 중 상태 글 — 앱 맨 위에 한 번(skeleton.md). 스켈레톤이 마운트하며 여기에 알린다 */}
              <LoadingAnnouncer>
                <WriteFailureBridge />
                {/* BrowserRouter 와 같되, 시트를 닫은 되돌림이 끝난 뒤에 옮긴다(app/router/app-history.ts) */}
                <AppHistoryRouter>
                  <UserProvider>
                    <PermissionProvider>
                      {/* 화면이 그리다 멈추면 빈 화면 대신 실패 결과 — 주소를 옮기면 풀린다(RouteErrorBoundary.tsx) */}
                      <RouteErrorBoundary>
                        <AppRouter />
                      </RouteErrorBoundary>
                    </PermissionProvider>
                  </UserProvider>
                </AppHistoryRouter>
              </LoadingAnnouncer>
            </TooltipProvider>
          </SnackbarProvider>
        </QueryProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  )
}
